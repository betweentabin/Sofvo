import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// Note: Most messaging is handled directly through Supabase for real-time features
// These endpoints provide additional REST API access

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', verifySupabaseToken, async (req, res) => {
  try {
    const { data: conversations, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations(
          id,
          type,
          name,
          updated_at,
          participants:conversation_participants(
            user:profiles(id, username, display_name, avatar_url)
          )
        )
      `)
      .eq('user_id', req.userId)
      .order('conversation.updated_at', { ascending: false });

    if (error) throw error;

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            type,
            created_at,
            sender:profiles(id, username)
          `)
          .eq('conversation_id', conv.conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv.conversation,
          last_message: lastMessage
        };
      })
    );

    res.json(conversationsWithLastMessage);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// @route   POST /api/messages/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', verifySupabaseToken, async (req, res) => {
  try {
    const { type = 'direct', participant_ids, name } = req.body;

    if (!participant_ids || participant_ids.length === 0) {
      return res.status(400).json({ message: 'Participants required' });
    }

    // For direct messages, check if conversation already exists
    if (type === 'direct' && participant_ids.length === 1) {
      const recipientId = participant_ids[0];
      
      // Check existing conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select(`
          id,
          participants:conversation_participants(user_id)
        `)
        .eq('type', 'direct');

      // Find matching conversation
      const existingConv = existing?.find(conv => {
        const participantIds = conv.participants.map(p => p.user_id);
        return participantIds.includes(req.userId) && participantIds.includes(recipientId);
      });

      if (existingConv) {
        return res.json({ conversation_id: existingConv.id, existing: true });
      }
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({ type, name })
      .select()
      .single();

    if (error) throw error;

    // Add participants
    const participants = [
      { conversation_id: conversation.id, user_id: req.userId },
      ...participant_ids.map(id => ({
        conversation_id: conversation.id,
        user_id: id
      }))
    ];

    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (participantError) throw participantError;

    res.status(201).json({
      conversation_id: conversation.id,
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// @route   GET /api/messages/conversations/:id
// @desc    Get conversation messages
// @access  Private
router.get('/conversations/:id', verifySupabaseToken, async (req, res) => {
  try {
    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!participant) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    const { limit = 50, before } = req.query;

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(id, username, display_name, avatar_url)
      `)
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    // Reverse to get chronological order
    const chronologicalMessages = (messages || []).reverse();

    // Update last read
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', req.params.id)
      .eq('user_id', req.userId);

    res.json(chronologicalMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// @route   POST /api/messages/send
// @desc    Send a message
// @access  Private
router.post('/send', verifySupabaseToken, async (req, res) => {
  try {
    const { conversation_id, content, type = 'text', file_url } = req.body;

    if (!conversation_id || !content) {
      return res.status(400).json({ message: 'Conversation ID and content required' });
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', req.userId)
      .single();

    if (!participant) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    // Send message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id: req.userId,
        content,
        type,
        file_url
      })
      .select(`
        *,
        sender:profiles(id, username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id);

    // Create notifications for other participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversation_id)
      .neq('user_id', req.userId);

    if (participants && participants.length > 0) {
      const notifications = participants.map(p => ({
        user_id: p.user_id,
        type: 'new_message',
        title: '新しいメッセージ',
        message: `${message.sender.display_name || message.sender.username}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        data: { conversation_id, message_id: message.id }
      }));

      await supabase.from('notifications').insert(notifications);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', verifySupabaseToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content required' });
    }

    // Verify sender
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', req.params.id)
      .single();

    if (!message || message.sender_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Update message
    const { data: updated, error } = await supabase
      .from('messages')
      .update({
        content,
        edited_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(updated);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Failed to edit message' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', verifySupabaseToken, async (req, res) => {
  try {
    // Verify sender
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', req.params.id)
      .single();

    if (!message || message.sender_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Soft delete (update content)
    const { error } = await supabase
      .from('messages')
      .update({
        content: '[削除されたメッセージ]',
        type: 'deleted',
        edited_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', verifySupabaseToken, async (req, res) => {
  try {
    // Get user's conversations
    const { data: conversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', req.userId);

    if (!conversations || conversations.length === 0) {
      return res.json({ count: 0 });
    }

    let totalUnread = 0;

    for (const conv of conversations) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.conversation_id)
        .neq('sender_id', req.userId)
        .gt('created_at', conv.last_read_at || '1970-01-01');

      totalUnread += count || 0;
    }

    res.json({ count: totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

export default router;