import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 開発環境では環境変数の警告のみ
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Warning: Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }
  
  return data;
};

export const signUp = async (email, password, username, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });
  
  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }
  
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const subscribeToMessages = (conversationId, callback) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return channel;
};

export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversations (
        *,
        messages (
          content,
          created_at,
          sender_id
        )
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  
  return data?.map(item => item.conversations) || [];
};

export const getMessages = async (conversationId, limit = 50) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:sender_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data?.reverse() || [];
};

export const sendMessage = async (conversationId, senderId, content, type = 'text') => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      type,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }
  
  return data;
};

export const createConversation = async (type = 'direct', name = null) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      type,
      name,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
  
  return data;
};

export const addParticipant = async (conversationId, userId) => {
  const { data, error } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding participant:', error);
    throw error;
  }
  
  return data;
};

// ==============================
// Posts (quick, Twitter-like)
// ==============================
export const createPost = async (userId, content, visibility = 'public') => {
  const payload = { user_id: userId, content, visibility };
  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select(`
      *,
      profiles:user_id (username, display_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }
  return data;
};

export const getLatestPosts = async (limit = 20) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (username, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching latest posts:', error);
    return [];
  }
  return data || [];
};

export const getPostById = async (postId) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (username, display_name, avatar_url)
    `)
    .eq('id', postId)
    .single();

  if (error) {
    console.error('Error fetching post by id:', error);
    throw error;
  }
  return data;
};

export const subscribeToPosts = (callback) => {
  const channel = supabase
    .channel('posts:public')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      (payload) => callback(payload.new)
    )
    .subscribe();
  return channel;
};
