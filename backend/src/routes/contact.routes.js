import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Create email transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Create contact_inquiries table if not exists
const ensureContactTable = async () => {
  const { error } = await supabase.rpc('create_contact_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.contact_inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
        response TEXT,
        responded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  }).single();
  
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating contact table:', error);
  }
};

// Initialize table
ensureContactTable().catch(console.error);

// @route   POST /api/contact
// @desc    Send contact inquiry
// @access  Public
router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().isLength({ min: 2, max: 100 }),
  body('category').notEmpty().isIn(['general', 'bug', 'feature', 'account', 'other']),
  body('subject').notEmpty().isLength({ min: 5, max: 200 }),
  body('message').notEmpty().isLength({ min: 10, max: 2000 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, name, category, subject, message } = req.body;

    // Get user ID if authenticated
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Save to database
    const { data: inquiry, error } = await supabase
      .from('contact_inquiries')
      .insert({
        user_id: userId,
        email,
        name,
        category,
        subject,
        message
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, try to create it
      if (error.code === '42P01') {
        await ensureContactTable();
        // Retry insertion
        const { data: retryInquiry } = await supabase
          .from('contact_inquiries')
          .insert({
            user_id: userId,
            email,
            name,
            category,
            subject,
            message
          })
          .select()
          .single();
        
        if (retryInquiry) {
          inquiry = retryInquiry;
        } else {
          throw new Error('Failed to save inquiry');
        }
      } else {
        throw error;
      }
    }

    // Send email notification to admin
    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `[Sofvo Contact] ${category}: ${subject}`,
          html: `
            <h2>新しいお問い合わせ</h2>
            <p><strong>カテゴリ:</strong> ${category}</p>
            <p><strong>名前:</strong> ${name}</p>
            <p><strong>メール:</strong> ${email}</p>
            <p><strong>件名:</strong> ${subject}</p>
            <p><strong>メッセージ:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            ${userId ? `<p><strong>ユーザーID:</strong> ${userId}</p>` : ''}
          `
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send confirmation email to user
    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: 'お問い合わせを受け付けました - Sofvo',
          html: `
            <h2>お問い合わせありがとうございます</h2>
            <p>${name}様</p>
            <p>以下の内容でお問い合わせを受け付けました。</p>
            <hr>
            <p><strong>件名:</strong> ${subject}</p>
            <p><strong>カテゴリ:</strong> ${category}</p>
            <p><strong>メッセージ:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p>担当者より2-3営業日以内にご連絡させていただきます。</p>
            <p>Sofvoサポートチーム</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    res.status(201).json({
      message: 'お問い合わせを受け付けました',
      inquiry_id: inquiry?.id
    });
  } catch (error) {
    console.error('Error submitting contact:', error);
    res.status(500).json({ message: 'Failed to submit contact inquiry' });
  }
});

// @route   GET /api/contact/history
// @desc    Get user's contact history
// @access  Private
router.get('/history', verifySupabaseToken, async (req, res) => {
  try {
    const { data: inquiries, error } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist
      if (error.code === '42P01') {
        return res.json([]);
      }
      throw error;
    }

    res.json(inquiries || []);
  } catch (error) {
    console.error('Error fetching contact history:', error);
    res.status(500).json({ message: 'Failed to fetch contact history' });
  }
});

// @route   GET /api/contact/admin
// @desc    Get all contact inquiries (admin only)
// @access  Private (Admin)
router.get('/admin', verifySupabaseToken, async (req, res) => {
  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('contact_inquiries')
      .select(`
        *,
        user:profiles(id, username, display_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: inquiries, error, count } = await query;

    if (error) throw error;

    res.json({
      inquiries: inquiries || [],
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching all inquiries:', error);
    res.status(500).json({ message: 'Failed to fetch inquiries' });
  }
});

// @route   PUT /api/contact/:id/respond
// @desc    Respond to contact inquiry (admin only)
// @access  Private (Admin)
router.put('/:id/respond', [
  verifySupabaseToken,
  body('response').notEmpty().isLength({ min: 10, max: 5000 }),
  body('status').optional().isIn(['responded', 'closed']),
  handleValidationErrors
], async (req, res) => {
  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.userId)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { response, status = 'responded' } = req.body;

    // Get inquiry details
    const { data: inquiry } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Update inquiry
    const { data: updated, error } = await supabase
      .from('contact_inquiries')
      .update({
        response,
        status,
        responded_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Send email response to user
    if (process.env.SMTP_USER && inquiry.email) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: inquiry.email,
          subject: `Re: ${inquiry.subject} - Sofvo`,
          html: `
            <h2>お問い合わせへの回答</h2>
            <p>${inquiry.name}様</p>
            <p>お問い合わせいただきありがとうございます。</p>
            <p>以下の通り回答させていただきます。</p>
            <hr>
            <h3>お問い合わせ内容:</h3>
            <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
            <hr>
            <h3>回答:</h3>
            <p>${response.replace(/\n/g, '<br>')}</p>
            <hr>
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            <p>Sofvoサポートチーム</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send response email:', emailError);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error responding to inquiry:', error);
    res.status(500).json({ message: 'Failed to respond to inquiry' });
  }
});

// @route   GET /api/contact/categories
// @desc    Get contact categories
// @access  Public
router.get('/categories', (req, res) => {
  res.json([
    { value: 'general', label: '一般的なお問い合わせ' },
    { value: 'bug', label: 'バグ・不具合の報告' },
    { value: 'feature', label: '機能リクエスト' },
    { value: 'account', label: 'アカウントに関するお問い合わせ' },
    { value: 'other', label: 'その他' }
  ]);
});

export default router;