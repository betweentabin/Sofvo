import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const verifySupabaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided',
      message: 'Authentication required' 
    });
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found' 
      });
    }
    
    // ユーザー情報をリクエストオブジェクトに追加
    req.user = user;
    req.userId = user.id;
    
    // プロファイル情報も取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      req.profile = profile;
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Authentication failed' 
    });
  }
};

// オプション: 管理者権限チェック
export const requireAdmin = async (req, res, next) => {
  if (!req.profile || req.profile.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin access required' 
    });
  }
  next();
};

// オプション: チームメンバーチェック
export const requireTeamMember = (paramName = 'teamId') => {
  return async (req, res, next) => {
    const teamId = req.params[paramName];
    
    if (!teamId) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Team ID required' 
      });
    }
    
    try {
      const { data: member, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', req.userId)
        .single();
      
      if (error || !member) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Not a team member' 
        });
      }
      
      req.teamRole = member.role;
      next();
    } catch (error) {
      console.error('Team member check error:', error);
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  };
};

// オプション: チーム管理者チェック
export const requireTeamAdmin = (paramName = 'teamId') => {
  return async (req, res, next) => {
    const teamId = req.params[paramName];
    
    if (!teamId) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Team ID required' 
      });
    }
    
    try {
      const { data: member, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', req.userId)
        .single();
      
      if (error || !member || !['owner', 'admin'].includes(member.role)) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Team admin access required' 
        });
      }
      
      req.teamRole = member.role;
      next();
    } catch (error) {
      console.error('Team admin check error:', error);
      return res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  };
};