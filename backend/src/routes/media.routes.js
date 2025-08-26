import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Multer configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const type = req.body.type || 'general';
    const typeDir = path.join(uploadDir, type);
    await fs.mkdir(typeDir, { recursive: true });
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp|svg/,
    document: /pdf|doc|docx|xls|xlsx|txt/,
    video: /mp4|avi|mov|wmv/
  };

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const type = req.body.type || 'image';
  
  if (type === 'image' && !allowedTypes.image.test(ext)) {
    return cb(new Error('Invalid image format'), false);
  }
  
  if (type === 'document' && !allowedTypes.document.test(ext)) {
    return cb(new Error('Invalid document format'), false);
  }
  
  if (type === 'video' && !allowedTypes.video.test(ext)) {
    return cb(new Error('Invalid video format'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// @route   POST /api/media/upload
// @desc    Upload a file
// @access  Private
router.post('/upload', [
  verifySupabaseToken,
  upload.single('file')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type = 'image', entity_type, entity_id } = req.body;
    
    // Build file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${type}/${req.file.filename}`;
    
    // Save file info to database (optional - create media table if needed)
    const mediaData = {
      user_id: req.userId,
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_url: fileUrl,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      type,
      entity_type,
      entity_id
    };

    // Try to save to database (create table if needed)
    try {
      const { data: media, error } = await supabase
        .from('media')
        .insert(mediaData)
        .select()
        .single();

      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        await supabase.rpc('create_media_table', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.media (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
              file_name TEXT NOT NULL,
              file_path TEXT NOT NULL,
              file_url TEXT NOT NULL,
              file_size INTEGER,
              mime_type TEXT,
              type TEXT,
              entity_type TEXT,
              entity_id UUID,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        }).single();

        // Retry insertion
        const { data: retryMedia } = await supabase
          .from('media')
          .insert(mediaData)
          .select()
          .single();
        
        if (retryMedia) {
          mediaData.id = retryMedia.id;
        }
      } else if (!error && media) {
        mediaData.id = media.id;
      }
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError);
    }

    res.status(201).json({
      id: mediaData.id,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ message: error.message || 'Failed to upload file' });
  }
});

// @route   POST /api/media/upload-multiple
// @desc    Upload multiple files
// @access  Private
router.post('/upload-multiple', [
  verifySupabaseToken,
  upload.array('files', 10) // Max 10 files
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { type = 'image', entity_type, entity_id } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${type}/${file.filename}`;
      
      uploadedFiles.push({
        url: fileUrl,
        filename: file.originalname,
        size: file.size,
        type: file.mimetype
      });

      // Save to database (optional)
      try {
        await supabase
          .from('media')
          .insert({
            user_id: req.userId,
            file_name: file.originalname,
            file_path: file.path,
            file_url: fileUrl,
            file_size: file.size,
            mime_type: file.mimetype,
            type,
            entity_type,
            entity_id
          });
      } catch (dbError) {
        console.error('Database error (non-critical):', dbError);
      }
    }

    res.status(201).json({
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        fs.unlink(file.path).catch(console.error);
      }
    }
    
    res.status(500).json({ message: error.message || 'Failed to upload files' });
  }
});

// @route   DELETE /api/media/:id
// @desc    Delete a media file
// @access  Private
router.delete('/:id', verifySupabaseToken, async (req, res) => {
  try {
    // Get media info from database
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Check ownership
    if (media.user_id !== req.userId) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.userId)
        .single();

      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this file' });
      }
    }

    // Delete file from filesystem
    try {
      await fs.unlink(media.file_path);
    } catch (fsError) {
      console.error('Error deleting file from filesystem:', fsError);
      // Continue even if file doesn't exist
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// @route   GET /api/media/:id
// @desc    Get media info
// @access  Private
router.get('/:id', verifySupabaseToken, async (req, res) => {
  try {
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

// @route   GET /api/media/user/:userId
// @desc    Get user's uploaded media
// @access  Private
router.get('/user/:userId', verifySupabaseToken, async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    
    // Check if requesting own media or if admin
    if (req.userId !== req.params.userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.userId)
        .single();

      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    let query = supabase
      .from('media')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: media, error, count } = await query;

    if (error) throw error;

    res.json({
      media: media || [],
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching user media:', error);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

// @route   POST /api/media/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', [
  verifySupabaseToken,
  upload.single('avatar')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/image/${req.file.filename}`;
    
    // Update user profile with new avatar
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ avatar_url: fileUrl })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) throw error;

    // Save to media table
    try {
      await supabase
        .from('media')
        .insert({
          user_id: req.userId,
          file_name: req.file.originalname,
          file_path: req.file.path,
          file_url: fileUrl,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          type: 'avatar',
          entity_type: 'profile',
          entity_id: req.userId
        });
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError);
    }

    res.json({
      avatar_url: fileUrl,
      profile
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

// @route   POST /api/media/upload-team-logo
// @desc    Upload team logo
// @access  Private (Team Admin)
router.post('/upload-team-logo/:teamId', [
  verifySupabaseToken,
  upload.single('logo')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if user is team admin
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', req.params.teamId)
      .eq('user_id', req.userId)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      fs.unlink(req.file.path).catch(console.error);
      return res.status(403).json({ message: 'Not authorized to update team logo' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/image/${req.file.filename}`;
    
    // Update team with new logo
    const { data: team, error } = await supabase
      .from('teams')
      .update({ logo_url: fileUrl })
      .eq('id', req.params.teamId)
      .select()
      .single();

    if (error) throw error;

    // Save to media table
    try {
      await supabase
        .from('media')
        .insert({
          user_id: req.userId,
          file_name: req.file.originalname,
          file_path: req.file.path,
          file_url: fileUrl,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          type: 'logo',
          entity_type: 'team',
          entity_id: req.params.teamId
        });
    } catch (dbError) {
      console.error('Database error (non-critical):', dbError);
    }

    res.json({
      logo_url: fileUrl,
      team
    });
  } catch (error) {
    console.error('Error uploading team logo:', error);
    
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ message: 'Failed to upload team logo' });
  }
});

export default router;