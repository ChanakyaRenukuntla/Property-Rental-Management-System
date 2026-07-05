// ============================================================
// controllers/message.controller.js
// ============================================================

const Message = require('../models/Message');

// GET conversation between two users
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params; // the other person in the conversation

    // Find messages where I am sender OR receiver
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId,       receiver: req.user._id }
      ]
    })
      .populate('sender',   'name role')
      .populate('receiver', 'name role')
      .sort({ createdAt: 1 }); // oldest first (chat order)

    // Mark messages FROM the other person as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all conversations list (just the last message from each conversation)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique users this person has chatted with
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender',   'name role')
      .populate('receiver', 'name role')
      .sort({ createdAt: -1 });

    // Build a map of unique conversations (keep only the latest message per contact)
    const seen  = new Set();
    const convos = [];

    for (const msg of messages) {
      const other = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
      const key   = other._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        // Count unread messages from this contact
        const unread = await Message.countDocuments({
          sender: other._id, receiver: userId, read: false
        });
        convos.push({ contact: other, lastMessage: msg, unread });
      }
    }

    res.json({ success: true, conversations: convos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SEND a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    const message = await Message.create({
      sender:   req.user._id,
      receiver: receiverId,
      text
    });

    const populated = await message.populate(['sender', 'receiver']);
    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, read: false });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
