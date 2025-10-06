import React, { createContext, useContext, useEffect, useState } from 'react'
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
  // Prefer relative API base in production (Vercel rewrite) to avoid CORS
  const isBrowser = typeof window !== 'undefined'
  const host = isBrowser ? window.location.hostname : ''
  const inVercel = /\.vercel\.app$/.test(host) || host === 'sofvo.vercel.app'
  // Detect native Capacitor only (web also defines window.Capacitor)
  const isCapacitor = isBrowser && (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.Capacitor?.getPlatform && window.Capacitor.getPlatform() !== 'web')
  )
  // Runtime config (loaded in src/index.jsx before mount)
  const RUNTIME = isBrowser ? (window.__APP_CONFIG__ || {}) : {}

  let nodeBase
  if (isCapacitor) {
    // In Capacitor, relative '/api' won't work. Use explicit mobile API URL.
    nodeBase = RUNTIME.nodeApiUrl || import.meta.env.VITE_MOBILE_API_URL || import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'
  } else if (inVercel) {
    // On Vercel, allow runtime/env override to bypass proxy if needed.
    nodeBase = RUNTIME.nodeApiUrl || import.meta.env.VITE_NODE_API_URL || '/api'
  } else {
    nodeBase = RUNTIME.nodeApiUrl || import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'
  }

  const http = axios.create({ baseURL: nodeBase })

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('JWT')
      if (token) {
        try {
          // Try new Railway auth route first
          const { data } = await http.get('/railway-auth/me', { headers: { Authorization: `Bearer ${token}` }})
          setUser({ id: data.user.id, email: data.user.email })
        } catch (err) {
          // Fallback to older local-auth if Railway route not present
          const status = err?.response?.status
          if (status === 404 || status === 401) {
            try {
              const { data } = await http.get('/local-auth/me', { headers: { Authorization: `Bearer ${token}` }})
              // local-auth/me returns user fields directly
              setUser({ id: data.id, email: data.email })
            } catch {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const signIn = async (email, password) => {
    try {
      const { data } = await http.post('/railway-auth/login', { email, password })
      localStorage.setItem('JWT', data.token)
      setUser({ id: data.user.id, email: data.user.email })
      return data
    } catch (err) {
      // Retry against legacy local-auth if Railway route is missing
      if (err?.response?.status === 404 || err?.response?.status === 401) {
        const { data } = await http.post('/local-auth/login', { email, password })
        localStorage.setItem('JWT', data.token)
        setUser({ id: data.user.id, email: data.user.email })
        return data
      }
      throw err
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    const payload = { email, password, username: metadata.username || email.split('@')[0], display_name: metadata.display_name || metadata.username || 'User' }
    try {
      const { data } = await http.post('/railway-auth/register', payload)
      localStorage.setItem('JWT', data.token)
      setUser({ id: data.user.id, email: data.user.email })
      return data
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 401) {
        const { data } = await http.post('/local-auth/register', payload)
        localStorage.setItem('JWT', data.token)
        setUser({ id: data.user.id, email: data.user.email })
        return data
      }
      throw err
    }
  }

  const signOut = async () => {
    localStorage.removeItem('JWT')
    setUser(null)
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
