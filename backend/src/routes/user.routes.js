import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken as supabaseAuth } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// Get current user profile
router.get('/me', supabaseAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user profile
router.put('/me', supabaseAuth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.id; // Prevent ID modification
    delete updates.created_at; // Prevent timestamp modification

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create or update profile
router.post('/profile', supabaseAuth, async (req, res) => {
  try {
    const profileData = {
      id: req.user.id,
      username: req.body.username,
      full_name: req.body.full_name,
      avatar_url: req.body.avatar_url,
      bio: req.body.bio,
      location: req.body.location,
      birth_date: req.body.birth_date,
      gender: req.body.gender,
      skill_level: req.body.skill_level,
      position: req.body.position,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    res.status(500).json({ error: 'Failed to create/update profile' });
  }
});

// Get user settings
router.get('/settings', supabaseAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email_notifications, push_notifications, privacy_settings')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json(profile || {
      email_notifications: true,
      push_notifications: true,
      privacy_settings: {}
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/settings', supabaseAuth, async (req, res) => {
  try {
    const { email_notifications, push_notifications, privacy_settings } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        email_notifications,
        push_notifications,
        privacy_settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Update notification settings
router.put('/notification-settings', supabaseAuth, async (req, res) => {
  try {
    const { 
      email_notifications,
      push_notifications,
      message_notifications,
      team_notifications,
      tournament_notifications
    } = req.body;

    const notificationSettings = {
      email_notifications,
      push_notifications,
      message_notifications,
      team_notifications,
      tournament_notifications
    };

    const { data, error } = await supabase
      .from('profiles')
      .update({
        notification_settings: notificationSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Get recommended users
router.get('/recommended', supabaseAuth, async (req, res) => {
  try {
    // Get current user profile
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('skill_level, position, location')
      .eq('id', req.user.id)
      .single();

    if (userError) throw userError;

    // Find similar users based on skill level and position
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', req.user.id)
      .limit(10);

    if (currentUser?.skill_level) {
      query = query.eq('skill_level', currentUser.skill_level);
    }

    if (currentUser?.position) {
      query = query.eq('position', currentUser.position);
    }

    const { data: recommendedUsers, error } = await query;

    if (error) throw error;

    res.json(recommendedUsers || []);
  } catch (error) {
    console.error('Error fetching recommended users:', error);
    res.status(500).json({ error: 'Failed to fetch recommended users' });
  }
});

// Search users
router.get('/search', supabaseAuth, async (req, res) => {
  try {
    const { q, skill_level, position, location } = req.query;

    let query = supabase
      .from('profiles')
      .select('*');

    if (q) {
      query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
    }

    if (skill_level) {
      query = query.eq('skill_level', skill_level);
    }

    if (position) {
      query = query.eq('position', position);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user by ID
router.get('/:userId', supabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user's teams
router.get('/:userId/teams', supabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        joined_at,
        teams (
          id,
          name,
          description,
          logo_url,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const teams = teamMembers?.map(member => ({
      ...member.teams,
      role: member.role,
      joined_at: member.joined_at
    })) || [];

    res.json(teams);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({ error: 'Failed to fetch user teams' });
  }
});

// Get user's tournament history
router.get('/:userId/tournaments', supabaseAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: participations, error } = await supabase
      .from('tournament_participants')
      .select(`
        tournament_id,
        team_id,
        registered_at,
        tournaments (
          id,
          name,
          description,
          start_date,
          end_date,
          status
        ),
        teams (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    res.json(participations || []);
  } catch (error) {
    console.error('Error fetching user tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch user tournaments' });
  }
});

export default router;