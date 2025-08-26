import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useChat = (conversationId) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, username, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  const sendMessage = async (content, type = 'text', fileUrl = null) => {
    if (!user || !conversationId) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          type,
          file_url: fileUrl
        })
        .select(`
          *,
          sender:profiles(id, username, display_name, avatar_url)
        `)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const subscribeToMessages = useCallback(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(id, username, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const markAsRead = async () => {
    if (!user || !conversationId) return

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    const unsubscribe = subscribeToMessages()
    return unsubscribe
  }, [subscribeToMessages])

  useEffect(() => {
    if (messages.length > 0) {
      markAsRead()
    }
  }, [messages])

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages
  }
}

export const useConversations = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation:conversations(
            id,
            type,
            name,
            updated_at,
            participants:conversation_participants(
              user:profiles(id, username, display_name, avatar_url)
            ),
            last_message:messages(
              id,
              content,
              created_at,
              sender:profiles(username)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('conversation.updated_at', { ascending: false })

      if (error) throw error

      const formattedData = data?.map(item => ({
        ...item.conversation,
        last_message: item.conversation.last_message?.[0] || null
      })) || []

      setConversations(formattedData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createDirectConversation = async (recipientId) => {
    if (!user) return

    try {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select(`
          id,
          participants:conversation_participants(user_id)
        `)
        .eq('type', 'direct')
        .contains('participants', [{ user_id: user.id }, { user_id: recipientId }])
        .single()

      if (existingConversation) {
        return existingConversation
      }

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'direct' })
        .select()
        .single()

      if (convError) throw convError

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: recipientId }
        ])

      if (participantError) throw participantError

      return conversation
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    createDirectConversation,
    refetch: fetchConversations
  }
}