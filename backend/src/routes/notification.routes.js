import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', verifySupabaseToken, async (req, res) => {
  try {
    const { read, type, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (read !== undefined) {
      query = query.eq('read', read === 'true');
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error, count } = await query;

    if (error) throw error;

    res.json({
      notifications: notifications || [],
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', verifySupabaseToken, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId)
      .eq('read', false);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', verifySupabaseToken, async (req, res) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', verifySupabaseToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.userId)
      .eq('read', false);

    if (error) throw error;

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', verifySupabaseToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Delete all read notifications
// @access  Private
router.delete('/clear-all', verifySupabaseToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', req.userId)
      .eq('read', true);

    if (error) throw error;

    res.json({ message: 'All read notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// @route   POST /api/notifications/subscribe
// @desc    Subscribe to real-time notifications
// @access  Private
router.post('/subscribe', verifySupabaseToken, async (req, res) => {
  try {
    // Return subscription info for client to connect directly to Supabase
    res.json({
      channel: `notifications:${req.userId}`,
      event: 'INSERT',
      table: 'notifications',
      filter: `user_id=eq.${req.userId}`
    });
  } catch (error) {
    console.error('Error setting up subscription:', error);
    res.status(500).json({ message: 'Failed to setup subscription' });
  }
});

// @route   POST /api/notifications/test
// @desc    Send test notification (for development)
// @access  Private
router.post('/test', verifySupabaseToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Test notifications disabled in production' });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: req.userId,
        type: 'test',
        title: 'テスト通知',
        message: 'これはテスト通知です',
        data: { test: true, timestamp: new Date().toISOString() }
      })
      .select()
      .single();

    if (error) throw error;

    res.json(notification);
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
});

export default router;