import express from 'express';
import Newsletter from '../models/Newsletter.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/newsletter
// @desc    Subscribe to newsletter
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'You are already subscribed!' });
    }

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    res.status(201).json({ message: 'Successfully subscribed to newsletter!' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/newsletter
// @desc    Get all subscribers
// @access  Private/Admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
