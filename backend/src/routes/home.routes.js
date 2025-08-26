import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// @route   GET /api/home/feed
// @desc    Get home feed for user
// @access  Private
router.get('/feed', verifySupabaseToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Get user's teams and sport type for personalized feed
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('sport_type')
      .eq('id', req.userId)
      .single();

    const { data: userTeams } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', req.userId);

    const teamIds = userTeams?.map(t => t.team_id) || [];

    // Build feed with various content types
    const feedItems = [];

    // 1. Recent tournaments in user's sport
    if (userProfile?.sport_type) {
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          description,
          start_date,
          location,
          sport_type,
          created_at,
          organizer:profiles!tournaments_organizer_id_fkey(id, username, display_name, avatar_url),
          participants:tournament_participants(count)
        `)
        .eq('sport_type', userProfile.sport_type)
        .eq('status', 'upcoming')
        .order('created_at', { ascending: false })
        .limit(5);

      if (tournaments) {
        tournaments.forEach(t => {
          feedItems.push({
            type: 'tournament',
            data: t,
            timestamp: t.created_at,
            priority: 2
          });
        });
      }
    }

    // 2. Team updates
    if (teamIds.length > 0) {
      const { data: teamTournaments } = await supabase
        .from('tournament_participants')
        .select(`
          registered_at,
          tournament:tournaments(
            id,
            name,
            start_date,
            location,
            sport_type
          ),
          team:teams(id, name, logo_url)
        `)
        .in('team_id', teamIds)
        .order('registered_at', { ascending: false })
        .limit(5);

      if (teamTournaments) {
        teamTournaments.forEach(tt => {
          feedItems.push({
            type: 'team_tournament',
            data: tt,
            timestamp: tt.registered_at,
            priority: 3
          });
        });
      }

      // New team members
      const { data: newMembers } = await supabase
        .from('team_members')
        .select(`
          joined_at,
          team:teams(id, name, logo_url),
          user:profiles(id, username, display_name, avatar_url)
        `)
        .in('team_id', teamIds)
        .neq('user_id', req.userId)
        .gte('joined_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('joined_at', { ascending: false })
        .limit(5);

      if (newMembers) {
        newMembers.forEach(nm => {
          feedItems.push({
            type: 'new_member',
            data: nm,
            timestamp: nm.joined_at,
            priority: 4
          });
        });
      }
    }

    // 3. Tournament results
    const { data: recentResults } = await supabase
      .from('tournament_results')
      .select(`
        created_at,
        position,
        points,
        tournament:tournaments(
          id,
          name,
          sport_type
        ),
        participant:tournament_participants(
          team:teams(id, name, logo_url),
          user:profiles(id, username, display_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentResults) {
      // Group results by tournament
      const tournamentResults = {};
      recentResults.forEach(r => {
        if (!tournamentResults[r.tournament.id]) {
          tournamentResults[r.tournament.id] = {
            tournament: r.tournament,
            results: [],
            timestamp: r.created_at
          };
        }
        tournamentResults[r.tournament.id].results.push(r);
      });

      Object.values(tournamentResults).forEach(tr => {
        feedItems.push({
          type: 'tournament_results',
          data: tr,
          timestamp: tr.timestamp,
          priority: 1
        });
      });
    }

    // 4. Recommended teams
    if (userProfile?.sport_type) {
      const { data: recommendedTeams } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          logo_url,
          sport_type,
          created_at,
          members:team_members(count)
        `)
        .eq('sport_type', userProfile.sport_type)
        .not('id', 'in', `(${teamIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recommendedTeams && recommendedTeams.length > 0) {
        feedItems.push({
          type: 'recommended_teams',
          data: recommendedTeams,
          timestamp: new Date().toISOString(),
          priority: 5
        });
      }
    }

    // Sort feed by timestamp and priority
    feedItems.sort((a, b) => {
      const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
      if (Math.abs(timeDiff) < 86400000) { // Within 1 day
        return a.priority - b.priority;
      }
      return timeDiff;
    });

    // Paginate
    const paginatedFeed = feedItems.slice(offset, offset + limit);

    res.json({
      feed: paginatedFeed,
      total: feedItems.length,
      limit,
      offset,
      hasMore: offset + limit < feedItems.length
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ message: 'Failed to fetch feed' });
  }
});

// @route   GET /api/home/trending
// @desc    Get trending content
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    // Get trending tournaments (most participants in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: trendingTournaments } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        description,
        start_date,
        location,
        sport_type,
        organizer:profiles!tournaments_organizer_id_fkey(id, username, display_name),
        participants:tournament_participants(count)
      `)
      .eq('status', 'upcoming')
      .gte('created_at', weekAgo)
      .order('participants', { ascending: false })
      .limit(5);

    // Get active teams (most recent activity)
    const { data: activeTeams } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        description,
        logo_url,
        sport_type,
        members:team_members(count),
        recent_tournaments:tournament_participants(
          tournament_id,
          registered_at
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(5);

    // Process active teams to get activity score
    const teamsWithActivity = activeTeams?.map(team => {
      const recentActivity = team.recent_tournaments?.filter(
        t => new Date(t.registered_at) > new Date(weekAgo)
      ).length || 0;
      
      return {
        ...team,
        activity_score: team.members[0].count + (recentActivity * 5)
      };
    }).sort((a, b) => b.activity_score - a.activity_score);

    res.json({
      tournaments: trendingTournaments || [],
      teams: teamsWithActivity?.slice(0, 5) || []
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    res.status(500).json({ message: 'Failed to fetch trending content' });
  }
});

// @route   GET /api/home/stats
// @desc    Get platform statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    // Get total counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    const { count: totalTournaments } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'upcoming');

    const { count: completedTournaments } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get sport distribution
    const { data: sportDistribution } = await supabase
      .from('profiles')
      .select('sport_type')
      .not('sport_type', 'is', null);

    const sportCounts = {};
    sportDistribution?.forEach(p => {
      sportCounts[p.sport_type] = (sportCounts[p.sport_type] || 0) + 1;
    });

    res.json({
      users: totalUsers || 0,
      teams: totalTeams || 0,
      tournaments: {
        upcoming: totalTournaments || 0,
        completed: completedTournaments || 0
      },
      sports: sportCounts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// @route   GET /api/home/announcements
// @desc    Get platform announcements
// @access  Public
router.get('/announcements', async (req, res) => {
  try {
    // This would typically come from an announcements table
    // For now, return mock data
    const announcements = [
      {
        id: '1',
        title: 'Sofvoへようこそ！',
        content: 'スポーツチーム管理プラットフォームSofvoをご利用いただきありがとうございます。',
        type: 'info',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: '新機能：リアルタイムチャット',
        content: 'チームメンバーとリアルタイムでコミュニケーションが取れるようになりました。',
        type: 'feature',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// @route   GET /api/home/calendar
// @desc    Get upcoming events calendar
// @access  Private
router.get('/calendar', verifySupabaseToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get user's teams
    const { data: userTeams } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', req.userId);

    const teamIds = userTeams?.map(t => t.team_id) || [];

    // Get tournaments user is participating in
    const { data: userTournaments } = await supabase
      .from('tournament_participants')
      .select(`
        tournament:tournaments(
          id,
          name,
          start_date,
          end_date,
          location,
          sport_type
        )
      `)
      .eq('user_id', req.userId)
      .eq('status', 'registered');

    // Get tournaments teams are participating in
    let teamTournaments = [];
    if (teamIds.length > 0) {
      const { data } = await supabase
        .from('tournament_participants')
        .select(`
          team:teams(id, name),
          tournament:tournaments(
            id,
            name,
            start_date,
            end_date,
            location,
            sport_type
          )
        `)
        .in('team_id', teamIds)
        .eq('status', 'registered');
      
      teamTournaments = data || [];
    }

    // Combine and format events
    const events = [];
    
    userTournaments?.forEach(ut => {
      if (ut.tournament) {
        events.push({
          id: `user-${ut.tournament.id}`,
          title: ut.tournament.name,
          start: ut.tournament.start_date,
          end: ut.tournament.end_date,
          type: 'personal_tournament',
          location: ut.tournament.location
        });
      }
    });

    teamTournaments.forEach(tt => {
      if (tt.tournament) {
        events.push({
          id: `team-${tt.tournament.id}`,
          title: `${tt.team.name}: ${tt.tournament.name}`,
          start: tt.tournament.start_date,
          end: tt.tournament.end_date,
          type: 'team_tournament',
          location: tt.tournament.location,
          team: tt.team
        });
      }
    });

    // Filter by date range if provided
    let filteredEvents = events;
    if (start_date) {
      filteredEvents = filteredEvents.filter(e => e.start >= start_date);
    }
    if (end_date) {
      filteredEvents = filteredEvents.filter(e => e.start <= end_date);
    }

    // Sort by start date
    filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    res.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ message: 'Failed to fetch calendar' });
  }
});

export default router;