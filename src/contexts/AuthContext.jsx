import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import axios from 'axios'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const USE_RAILWAY_AUTH = import.meta.env.VITE_USE_RAILWAY_AUTH === 'true'
  const nodeBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    const init = async () => {
      if (USE_RAILWAY_AUTH) {
        const token = localStorage.getItem('JWT')
        if (token) {
          try {
            const { data } = await axios.get(`${nodeBase}/railway-auth/me`, { headers: { Authorization: `Bearer ${token}` }})
            setUser({ id: data.user.id, email: data.user.email })
          } catch { setUser(null) }
        }
        setLoading(false)
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session2) => {
        setUser(session2?.user ?? null)
        setLoading(false)
      })
      return () => subscription.unsubscribe()
    }
    init()
  }, [])

  const signIn = async (email, password) => {
    if (USE_RAILWAY_AUTH) {
      const { data } = await axios.post(`${nodeBase}/railway-auth/login`, { email, password })
      localStorage.setItem('JWT', data.token)
      setUser({ id: data.user.id, email: data.user.email })
      return data
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error; return data
  }

  const signUp = async (email, password, metadata = {}) => {
    if (USE_RAILWAY_AUTH) {
      const payload = { email, password, username: metadata.username || email.split('@')[0], display_name: metadata.display_name || metadata.username || 'User' }
      const { data } = await axios.post(`${nodeBase}/railway-auth/register`, payload)
      localStorage.setItem('JWT', data.token)
      setUser({ id: data.user.id, email: data.user.email })
      return data
    }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
    if (error) throw error; return data
  }

  const signOut = async () => {
    if (USE_RAILWAY_AUTH) {
      localStorage.removeItem('JWT')
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut(); if (error) throw error
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
