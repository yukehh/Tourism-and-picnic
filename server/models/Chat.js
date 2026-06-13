import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true // One active chat thread per user/session
  },
  userName: {
    type: String,
    default: 'Guest'
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  unreadByAdmin: {
    type: Number,
    default: 0
  },
  unreadByUser: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
