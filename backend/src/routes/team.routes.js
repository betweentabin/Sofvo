import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken as supabaseAuth } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// Create a new team
router.post('/', supabaseAuth, async (req, res) => {
  try {
    const { name, description, logo_url, max_members, sport_type } = req.body;

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        description,
        logo_url,
        max_members: max_members || 20,
        sport_type,
        creator_id: req.user.id
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: req.user.id,
        role: 'admin',
        joined_at: new Date().toISOString()
      });

    if (memberError) throw memberError;

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get all teams with search and filter
router.get('/', supabaseAuth, async (req, res) => {
  try {
    const { q, sport_type, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('teams')
      .select(`
        *,
        team_members!inner(count)
      `)
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (sport_type) {
      query = query.eq('sport_type', sport_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID
router.get('/:teamId', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          user_id,
          role,
          joined_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            skill_level,
            position
          )
        )
      `)
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if current user is a member
    const isMember = team.team_members.some(member => member.user_id === req.user.id);
    const userRole = team.team_members.find(member => member.user_id === req.user.id)?.role;

    res.json({
      ...team,
      is_member: isMember,
      user_role: userRole
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Update team
router.put('/:teamId', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;

    // Check if user is admin
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can update team details' });
    }

    // Update team
    delete updates.id;
    delete updates.created_at;
    delete updates.creator_id;

    const { data: team, error } = await supabase
      .from('teams')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    res.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team (disband)
router.delete('/:teamId', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Check if user is admin
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can disband the team' });
    }

    // Delete team (cascade will handle team_members)
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;

    res.json({ message: 'Team disbanded successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to disband team' });
  }
});

// Get team members
router.get('/:teamId/members', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;

    const { data: members, error } = await supabase
      .from('team_members')
      .select(`
        user_id,
        role,
        joined_at,
        profiles (
          id,
          username,
          full_name,
          avatar_url,
          bio,
          skill_level,
          position
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    res.json(members || []);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Add member to team
router.post('/:teamId/members', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { user_id, role = 'member' } = req.body;

    // Check if current user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (adminError || !adminCheck || adminCheck.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can add members' });
    }

    // Check if user is already a member
    const { data: existing, error: existingError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Add member
    const { data: member, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id,
        role,
        joined_at: new Date().toISOString()
      })
      .select(`
        user_id,
        role,
        joined_at,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json(member);
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Update member role
router.put('/:teamId/members/:userId', supabaseAuth, async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;

    // Check if current user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (adminError || !adminCheck || adminCheck.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can update member roles' });
    }

    // Update member role
    const { data: member, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json(member);
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Remove member from team
router.delete('/:teamId/members/:userId', supabaseAuth, async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    // Check if current user is admin or removing themselves
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    if (member.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Only admins can remove other members' });
    }

    // Remove member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Join team (request to join)
router.post('/:teamId/join', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Check if already a member
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    // Check team member limit
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('max_members')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    const { count, error: countError } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);

    if (countError) throw countError;

    if (count >= team.max_members) {
      return res.status(400).json({ error: 'Team is full' });
    }

    // Add as member
    const { data: member, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: req.user.id,
        role: 'member',
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(member);
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// Leave team
router.post('/:teamId/leave', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Check if user is a member
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (memberError || !member) {
      return res.status(400).json({ error: 'You are not a member of this team' });
    }

    // Don't allow last admin to leave
    if (member.role === 'admin') {
      const { count, error: countError } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('role', 'admin');

      if (countError) throw countError;

      if (count === 1) {
        return res.status(400).json({ error: 'Cannot leave team as the only admin. Please assign another admin first or disband the team.' });
      }
    }

    // Remove member
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Successfully left the team' });
  } catch (error) {
    console.error('Error leaving team:', error);
    res.status(500).json({ error: 'Failed to leave team' });
  }
});

// Get team tournaments
router.get('/:teamId/tournaments', supabaseAuth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('tournament_participants')
      .select(`
        tournament_id,
        registered_at,
        tournaments (
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          location,
          entry_fee,
          prize_pool
        )
      `)
      .eq('team_id', teamId)
      .order('registered_at', { ascending: false });

    if (status) {
      query = query.eq('tournaments.status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching team tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch team tournaments' });
  }
});

export default router;