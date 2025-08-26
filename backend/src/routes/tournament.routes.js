import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken as supabaseAuth } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// Create a new tournament
router.post('/', supabaseAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      start_date,
      end_date,
      location,
      max_teams,
      entry_fee,
      prize_pool,
      tournament_type,
      sport_type,
      rules
    } = req.body;

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        name,
        description,
        start_date,
        end_date,
        location,
        max_teams: max_teams || 32,
        entry_fee: entry_fee || 0,
        prize_pool: prize_pool || 0,
        tournament_type: tournament_type || 'elimination',
        sport_type,
        rules,
        organizer_id: req.user.id,
        status: 'upcoming'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Search and list tournaments
router.get('/search', supabaseAuth, async (req, res) => {
  try {
    const { 
      q, 
      status, 
      sport_type, 
      start_date,
      end_date,
      limit = 20, 
      offset = 0 
    } = req.query;

    let query = supabase
      .from('tournaments')
      .select(`
        *,
        profiles!tournaments_organizer_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        tournament_participants (
          count
        )
      `)
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (sport_type) {
      query = query.eq('sport_type', sport_type);
    }

    if (start_date) {
      query = query.gte('start_date', start_date);
    }

    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error searching tournaments:', error);
    res.status(500).json({ error: 'Failed to search tournaments' });
  }
});

// Get tournament by ID
router.get('/:tournamentId', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        profiles!tournaments_organizer_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        tournament_participants (
          team_id,
          registered_at,
          teams (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (error) throw error;

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Check if user's team is registered
    const { data: userTeams } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', req.user.id);

    const userTeamIds = userTeams?.map(t => t.team_id) || [];
    const isRegistered = tournament.tournament_participants.some(
      p => userTeamIds.includes(p.team_id)
    );

    res.json({
      ...tournament,
      is_registered: isRegistered,
      is_organizer: tournament.organizer_id === req.user.id
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// Update tournament
router.put('/:tournamentId', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const updates = req.body;

    // Check if user is organizer
    const { data: tournament, error: checkError } = await supabase
      .from('tournaments')
      .select('organizer_id')
      .eq('id', tournamentId)
      .single();

    if (checkError || !tournament || tournament.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the organizer can update this tournament' });
    }

    // Update tournament
    delete updates.id;
    delete updates.created_at;
    delete updates.organizer_id;

    const { data, error } = await supabase
      .from('tournaments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// Delete tournament
router.delete('/:tournamentId', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Check if user is organizer
    const { data: tournament, error: checkError } = await supabase
      .from('tournaments')
      .select('organizer_id, status')
      .eq('id', tournamentId)
      .single();

    if (checkError || !tournament || tournament.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the organizer can delete this tournament' });
    }

    if (tournament.status === 'ongoing') {
      return res.status(400).json({ error: 'Cannot delete an ongoing tournament' });
    }

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (error) throw error;

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// Register team for tournament
router.post('/:tournamentId/register', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { team_id } = req.body;

    // Check if user is admin of the team
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', team_id)
      .eq('user_id', req.user.id)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can register for tournaments' });
    }

    // Check tournament capacity
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('max_teams, status')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ error: 'Registration is closed for this tournament' });
    }

    const { count, error: countError } = await supabase
      .from('tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    if (countError) throw countError;

    if (count >= tournament.max_teams) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    // Check if team is already registered
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('team_id', team_id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Team is already registered for this tournament' });
    }

    // Register team
    const { data, error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        team_id,
        registered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error registering for tournament:', error);
    res.status(500).json({ error: 'Failed to register for tournament' });
  }
});

// Unregister team from tournament
router.delete('/:tournamentId/register/:teamId', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId, teamId } = req.params;

    // Check if user is admin of the team
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only team admins can unregister from tournaments' });
    }

    // Check tournament status
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('status')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ error: 'Cannot unregister from an ongoing or completed tournament' });
    }

    const { error } = await supabase
      .from('tournament_participants')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId);

    if (error) throw error;

    res.json({ message: 'Successfully unregistered from tournament' });
  } catch (error) {
    console.error('Error unregistering from tournament:', error);
    res.status(500).json({ error: 'Failed to unregister from tournament' });
  }
});

// Get tournament results
router.get('/:tournamentId/results', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const { data: results, error } = await supabase
      .from('tournament_results')
      .select(`
        *,
        teams!tournament_results_team_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('rank', { ascending: true });

    if (error) throw error;

    res.json(results || []);
  } catch (error) {
    console.error('Error fetching tournament results:', error);
    res.status(500).json({ error: 'Failed to fetch tournament results' });
  }
});

// Submit tournament results (organizer only)
router.post('/:tournamentId/results', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { results } = req.body; // Array of { team_id, rank, points }

    // Check if user is organizer
    const { data: tournament, error: checkError } = await supabase
      .from('tournaments')
      .select('organizer_id')
      .eq('id', tournamentId)
      .single();

    if (checkError || !tournament || tournament.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the organizer can submit results' });
    }

    // Insert results
    const resultsData = results.map(r => ({
      tournament_id: tournamentId,
      team_id: r.team_id,
      rank: r.rank,
      points: r.points || 0,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('tournament_results')
      .upsert(resultsData, { onConflict: 'tournament_id,team_id' })
      .select();

    if (error) throw error;

    // Update tournament status to completed
    await supabase
      .from('tournaments')
      .update({ status: 'completed' })
      .eq('id', tournamentId);

    res.json(data);
  } catch (error) {
    console.error('Error submitting tournament results:', error);
    res.status(500).json({ error: 'Failed to submit tournament results' });
  }
});

// Get user's hosted tournaments
router.get('/my-hosted', supabaseAuth, async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('tournaments')
      .select(`
        *,
        tournament_participants (
          count
        )
      `)
      .eq('organizer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching hosted tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch hosted tournaments' });
  }
});

// Get user's participating tournaments
router.get('/my-participating', supabaseAuth, async (req, res) => {
  try {
    const { status } = req.query;

    // Get user's teams
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', req.user.id);

    if (teamsError) throw teamsError;

    const teamIds = userTeams?.map(t => t.team_id) || [];

    if (teamIds.length === 0) {
      return res.json([]);
    }

    let query = supabase
      .from('tournament_participants')
      .select(`
        tournament_id,
        team_id,
        registered_at,
        tournaments!inner (
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          location,
          entry_fee,
          prize_pool
        ),
        teams (
          id,
          name,
          logo_url
        )
      `)
      .in('team_id', teamIds)
      .order('registered_at', { ascending: false });

    if (status) {
      query = query.eq('tournaments.status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching participating tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch participating tournaments' });
  }
});

// Update tournament status (organizer only)
router.patch('/:tournamentId/status', supabaseAuth, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if user is organizer
    const { data: tournament, error: checkError } = await supabase
      .from('tournaments')
      .select('organizer_id')
      .eq('id', tournamentId)
      .single();

    if (checkError || !tournament || tournament.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the organizer can update tournament status' });
    }

    const { data, error } = await supabase
      .from('tournaments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating tournament status:', error);
    res.status(500).json({ error: 'Failed to update tournament status' });
  }
});

export default router;