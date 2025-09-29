import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { query } from '../config/database.js';
import { verifyAnyAuth } from '../middleware/auth.middleware.js';
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
  verifyAnyAuth,
  upload.single('file')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type = 'image', entity_type, entity_id } = req.body;
    
    // Build file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${type}/${req.file.filename}`;
    
    // Save file info to database
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

    try {
      const { rows } = await query(
        `INSERT INTO media (
          user_id, file_name, file_path, file_url, file_size, mime_type, type, entity_type, entity_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id`,
        [mediaData.user_id, mediaData.file_name, mediaData.file_path, mediaData.file_url, mediaData.file_size, mediaData.mime_type, mediaData.type, mediaData.entity_type, mediaData.entity_id]
      );
      mediaData.id = rows?.[0]?.id;
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
  verifyAnyAuth,
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

      // Save to database
      try {
        await query(
          `INSERT INTO media (user_id, file_name, file_path, file_url, file_size, mime_type, type, entity_type, entity_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [req.userId, file.originalname, file.path, fileUrl, file.size, file.mimetype, type, entity_type, entity_id]
        );
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
router.delete('/:id', verifyAnyAuth, async (req, res) => {
  try {
    // Get media info from database
    const { rows } = await query('SELECT * FROM media WHERE id = $1 LIMIT 1', [req.params.id]);
    const media = rows?.[0];
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Check ownership
    if (media.user_id !== req.userId) {
      // Check if user is admin
      const { rows: profileRows } = await query('SELECT role FROM profiles WHERE id = $1', [req.userId]);
      const profile = profileRows?.[0];

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
    await query('DELETE FROM media WHERE id = $1', [req.params.id]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// @route   GET /api/media/:id
// @desc    Get media info
// @access  Private
router.get('/:id', verifyAnyAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM media WHERE id = $1 LIMIT 1', [req.params.id]);
    const media = rows?.[0];
    if (!media) {
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
router.get('/user/:userId', verifyAnyAuth, async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    
    // Check if requesting own media or if admin
    if (req.userId !== req.params.userId) {
      const { rows: profileRows } = await query('SELECT role FROM profiles WHERE id = $1', [req.userId]);
      const profile = profileRows?.[0];

      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const baseParams = [req.params.userId];
    const where = ['user_id = $1'];
    if (type) {
      where.push(`type = $2`);
      baseParams.push(type);
    }
    const limOff = [Number(limit) || 50, Number(offset) || 0];

    const { rows: mediaRows } = await query(
      `SELECT * FROM media WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`,
      [...baseParams, ...limOff]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int as c FROM media WHERE ${where.join(' AND ')}`,
      baseParams
    );

    res.json({ media: mediaRows || [], total: countRows?.[0]?.c || 0, limit: Number(limit) || 50, offset: Number(offset) || 0 });
  } catch (error) {
    console.error('Error fetching user media:', error);
    res.status(500).json({ message: 'Failed to fetch media' });
  }
});

// @route   POST /api/media/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', [
  verifyAnyAuth,
  upload.single('avatar')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/image/${req.file.filename}`;
    
    // Update user profile with new avatar
    const { rows: profileRows } = await query(
      'UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, display_name, avatar_url',
      [fileUrl, req.userId]
    );
    const profile = profileRows?.[0];

    // Save to media table
    try {
      await query(
        `INSERT INTO media (user_id, file_name, file_path, file_url, file_size, mime_type, type, entity_type, entity_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [req.userId, req.file.originalname, req.file.path, fileUrl, req.file.size, req.file.mimetype, 'avatar', 'profile', req.userId]
      );
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
  verifyAnyAuth,
  upload.single('logo')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if user is team admin
    const { rows: memberRows } = await query('SELECT role FROM team_members WHERE team_id=$1 AND user_id=$2', [req.params.teamId, req.userId]);
    const member = memberRows?.[0];

    if (!member || !['owner', 'admin'].includes(member.role)) {
      fs.unlink(req.file.path).catch(console.error);
      return res.status(403).json({ message: 'Not authorized to update team logo' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/image/${req.file.filename}`;
    
    // Update team with new logo
    const { rows: teamRows } = await query('UPDATE teams SET logo_url=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [fileUrl, req.params.teamId]);
    const team = teamRows?.[0];

    // Save to media table
    try {
      await query(
        `INSERT INTO media (user_id, file_name, file_path, file_url, file_size, mime_type, type, entity_type, entity_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [req.userId, req.file.originalname, req.file.path, fileUrl, req.file.size, req.file.mimetype, 'logo', 'team', req.params.teamId]
      );
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
