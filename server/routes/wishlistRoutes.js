import express from 'express';
import Wishlist from '../models/Wishlist.js';

const router = express.Router();

// @route   GET /api/wishlist/:userId
router.get('/:userId', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId }).populate('products');
    if (!wishlist) {
      return res.json({ products: [] });
    }
    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/wishlist/toggle
router.post('/toggle', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) return res.status(400).json({ message: 'Missing fields' });

    let wishlist = await Wishlist.findOne({ userId });
    
    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({ userId, products: [productId] });
      await wishlist.save();
      return res.json({ message: 'Added to wishlist', wishlist });
    }

    // Check if product exists in wishlist
    const index = wishlist.products.findIndex(id => id.toString() === productId);
    
    if (index > -1) {
      // Remove it
      wishlist.products.splice(index, 1);
      await wishlist.save();
      return res.json({ message: 'Removed from wishlist', wishlist });
    } else {
      // Add it
      wishlist.products.push(productId);
      await wishlist.save();
      return res.json({ message: 'Added to wishlist', wishlist });
    }

  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
