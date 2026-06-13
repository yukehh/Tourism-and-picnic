import express from 'express';
import Contact from '../models/Contact.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { sendContactNotificationEmail } from '../utils/sendEmail.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit a new contact message
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // Send email to admin asynchronously
    sendContactNotificationEmail(newContact);

    const io = req.app.get('io');
    if (io) io.emit('newMessage', newContact);

    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages
// @access  Private/Admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/contact/:id/read
// @desc    Mark a message as read
// @access  Private/Admin
router.patch('/:id/read', requireAdmin, async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.status = 'read';
    await message.save();

    res.json({ message: 'Marked as read', data: message });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
