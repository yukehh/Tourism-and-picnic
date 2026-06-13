import express from 'express';
import Chat from '../models/Chat.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/chat/admin
// @desc    Get all chats (Admin)
// @access  Private/Admin
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/chat/:userId
// @desc    Get a user's chat thread
// @access  Public (Guest) or Private
router.get('/:userId', async (req, res) => {
  try {
    let chat = await Chat.findOne({ userId: req.params.userId });
    if (!chat) {
      chat = new Chat({ userId: req.params.userId });
      await chat.save();
    }
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/chat/message
// @desc    Send a message
// @access  Public (Guest) or Private
router.post('/message', async (req, res) => {
  try {
    const { userId, userName, text, sender } = req.body;
    if (!userId || !text || !sender) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({ userId, userName: userName || 'Guest' });
    } else if (userName && chat.userName === 'Guest') {
      chat.userName = userName; // Update name if it was a guest before
    }

    const newMessage = { sender, text };
    chat.messages.push(newMessage);

    if (sender === 'user') {
      chat.unreadByAdmin += 1;
    } else {
      chat.unreadByUser += 1;
    }

    await chat.save();

    const savedMessage = chat.messages[chat.messages.length - 1];

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      if (sender === 'user') {
        io.to('adminRoom').emit('newChatMessage', { userId, message: savedMessage, userName: chat.userName });
      } else {
        io.to(userId).emit('newChatMessage', { userId, message: savedMessage });
      }
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/chat/:userId/read
// @desc    Mark chat as read
// @access  Public or Private
router.patch('/:userId/read', async (req, res) => {
  try {
    const { reader } = req.body; // 'admin' or 'user'
    const chat = await Chat.findOne({ userId: req.params.userId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (reader === 'admin') {
      chat.unreadByAdmin = 0;
    } else {
      chat.unreadByUser = 0;
    }

    await chat.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
