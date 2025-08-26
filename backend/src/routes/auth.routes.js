import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3, max: 30 }),
  body('display_name').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password, username, display_name, sport_type } = req.body;

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      throw authError;
    }

    if (!authData.user) {
      return res.status(400).json({ message: 'Failed to create user' });
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        display_name,
        sport_type
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we should ideally delete the auth user
      // But for now, log the error
      console.error('Profile creation failed:', profileError);
    }

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        display_name
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Failed to register user' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      throw error;
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ message: 'Login failed' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Failed to login' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', verifySupabaseToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.headers['x-refresh-token'];
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw error;

    res.json({
      session: data.session
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Failed to refresh token' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Request password reset
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) throw error;

    res.json({ 
      message: 'Password reset email sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
});

// @route   POST /api/auth/update-password
// @desc    Update password (after reset or when logged in)
// @access  Private
router.post('/update-password', [
  verifySupabaseToken,
  body('password').isLength({ min: 6 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { password } = req.body;

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// @route   DELETE /api/auth/withdraw
// @desc    Delete user account
// @access  Private
router.delete('/withdraw', verifySupabaseToken, async (req, res) => {
  try {
    // Soft delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.userId);

    if (profileError) throw profileError;

    // Update auth metadata to mark as deleted
    const { error: authError } = await supabase.auth.admin.updateUserById(
      req.userId,
      { app_metadata: { deleted: true } }
    );

    if (authError) {
      console.error('Failed to update auth metadata:', authError);
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify current session
// @access  Private
router.get('/verify', verifySupabaseToken, async (req, res) => {
  try {
    // Get full user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.userId)
      .single();

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        ...profile
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Failed to verify session' });
  }
});

// @route   POST /api/auth/oauth/:provider
// @desc    OAuth authentication
// @access  Public
router.post('/oauth/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const validProviders = ['google', 'github', 'discord'];
    
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ message: 'Invalid OAuth provider' });
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });

    if (error) throw error;

    res.json({ url: data.url });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ message: 'Failed to initiate OAuth' });
  }
});

export default router;