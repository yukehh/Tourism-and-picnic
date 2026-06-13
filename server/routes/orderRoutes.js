import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../utils/sendEmail.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate a random Order ID (e.g., WH-123456)
const generateOrderId = () => {
  return 'WH-' + Math.floor(100000 + Math.random() * 900000);
};

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { userId, customer, items, payment, financials } = req.body;

    // Basic validation
    if (!customer || !items || items.length === 0 || !financials || !payment || !payment.method) {
      return res.status(400).json({ message: 'Missing required order fields' });
    }

    if (payment.method === 'bkash' && !payment.trxId) {
      return res.status(400).json({ message: 'Transaction ID is required for bKash payments' });
    }

    // Advanced Validation: Check stock and prices
    let calculatedSubtotal = 0;
    for (const item of items) {
      const dbProduct = await Product.findById(item.id || item.productId);
      if (!dbProduct) {
        return res.status(400).json({ message: `Product ${item.name} no longer exists.` });
      }
      if (dbProduct.stock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}. Available: ${dbProduct.stock}` });
      }
      // Compare prices (allowing small floating point discrepancies if any, but better to enforce exact match)
      if (dbProduct.price !== item.price) {
        return res.status(400).json({ message: `Price mismatch for ${item.name}. Please refresh your cart.` });
      }
      calculatedSubtotal += (dbProduct.price * item.qty);
    }

    // Optional: Could validate calculatedSubtotal matches financials.subtotal
    if (Math.abs(calculatedSubtotal - financials.subtotal) > 1) {
       return res.status(400).json({ message: 'Subtotal calculation mismatch. Please try again.' });
    }

    const orderId = generateOrderId();

    const newOrder = new Order({
      orderId,
      userId,
      customer,
      items,
      payment,
      financials,
      status: 'Pending'
    });

    const savedOrder = await newOrder.save();
    
    // Reduce stock and emit live updates
    const io = req.app.get('io');
    for (const item of items) {
      const updatedProduct = await Product.findByIdAndUpdate(item.id || item.productId, {
        $inc: { stock: -item.qty }
      }, { new: true });
      if (io && updatedProduct) {
        io.emit('stockUpdated', { productId: updatedProduct._id, stock: updatedProduct.stock });
      }
    }

    // Send email asynchronously (don't block the response)
    sendOrderConfirmationEmail(savedOrder);
    
    // Broadcast new order via Socket.io
    if (io) {
      io.emit('newOrder', savedOrder);
    }
    
    res.status(201).json({
      success: true,
      orderId: savedOrder.orderId,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server Error. Failed to place order.' });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (Admin only ideally)
// @access  Private/Admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/orders/user/:userId
// @desc    Get all orders for a specific user
// @access  Private
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    // Only allow users to fetch their own orders, or admin to fetch any
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Shipped', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Send status update email if status is shipped or delivered
    if (status === 'Shipped' || status === 'Delivered') {
      sendOrderStatusEmail(order);
    }

    // Broadcast status update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('orderStatusUpdated', order);
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
