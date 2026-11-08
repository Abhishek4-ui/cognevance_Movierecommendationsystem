import { Conversation } from '../models/Conversation.js';
import { aiEngineService } from '../services/aiEngineService.js';

export const handleChatMessage = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?._id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
    }
    if (!conversation) {
      conversation = new Conversation({
        userId,
        title: message.slice(0, 30) + '...',
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      sender: 'user',
      text: message.trim(),
      timestamp: new Date(),
    });

    // Run semantic AI query
    const aiResponse = await aiEngineService.handleChatQuery({
      query: message,
      conversationHistory: conversation.messages,
      userId,
    });

    // Add assistant reply
    conversation.messages.push({
      sender: 'assistant',
      text: aiResponse.text,
      movieSuggestions: (aiResponse.movieSuggestions || []).map(m => ({
        tmdbId: m.tmdbId,
        title: m.title,
        posterPath: m.posterPath,
        voteAverage: m.voteAverage,
        overview: m.overview,
        matchReason: m.overview ? m.overview.slice(0, 100) + '...' : 'Strong match based on query parameters',
      })),
      timestamp: new Date(),
    });

    await conversation.save();

    res.json({
      success: true,
      conversationId: conversation._id,
      response: {
        text: aiResponse.text,
        movieSuggestions: aiResponse.movieSuggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.json([]);
    }
    const conversations = await Conversation.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Conversation.findOneAndDelete({ _id: id, userId: req.user._id });
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (error) {
    next(error);
  }
};
