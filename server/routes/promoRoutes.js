import express from 'express';
import PromoCode from '../models/PromoCode.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/promo/validate
// @desc    Validate a promo code and return discount
// @access  Public
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Promo code is required' });

    const promo = await PromoCode.findOne({ code: code.toUpperCase() });

    if (!promo) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    if (!promo.isActive) {
      return res.status(400).json({ message: 'This promo code is no longer active' });
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return res.status(400).json({ message: 'This promo code has expired' });
    }

    res.json({ discountPercent: promo.discountPercent, message: `Promo applied! You get ${promo.discountPercent}% off.` });
  } catch (error) {
    console.error('Error validating promo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Secret dev route to quickly create a promo code for testing
router.post('/create-dev', async (req, res) => {
  try {
    const { code, discountPercent } = req.body;
    const existing = await PromoCode.findOne({ code });
    if (existing) return res.json({ message: 'Already exists', promo: existing });
    
    const promo = new PromoCode({ code, discountPercent });
    await promo.save();
    res.json({ message: 'Created', promo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/promo
// @desc    Get all promo codes
// @access  Private/Admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (error) {
    console.error('Error fetching promos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/promo
// @desc    Create a new promo code
// @access  Private/Admin
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { code, discountPercent, expiryDate, isActive } = req.body;
    const newPromo = new PromoCode({
      code: code.toUpperCase(),
      discountPercent,
      expiryDate,
      isActive: isActive !== undefined ? isActive : true
    });
    await newPromo.save();

    const io = req.app.get('io');
    if (io) io.emit('promoCreated', newPromo);

    res.status(201).json(newPromo);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Promo code already exists' });
    console.error('Error creating promo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/promo/:id
// @desc    Delete a promo code
// @access  Private/Admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo not found' });

    const io = req.app.get('io');
    if (io) io.emit('promoDeleted', req.params.id);

    res.json({ message: 'Promo deleted' });
  } catch (error) {
    console.error('Error deleting promo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
