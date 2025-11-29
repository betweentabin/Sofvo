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
    // In Capacitor, relative '/api' won't work. Prefer runtime URL only (no build-time env)
    nodeBase = RUNTIME.nodeApiUrl || 'http://localhost:5000/api'
  } else if (inVercel) {
    // On Vercel, prefer runtime or relative '/api' to avoid build-time env inlining
    nodeBase = RUNTIME.nodeApiUrl || '/api'
  } else {
    nodeBase = RUNTIME.nodeApiUrl || 'http://localhost:5000/api'
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
              // Final fallback: parse token directly if it's base64 encoded JSON
              try {
                const tokenData = JSON.parse(atob(token))
                if (tokenData.id && tokenData.email) {
                  setUser({ id: tokenData.id, email: tokenData.email })
                } else {
                  setUser(null)
                }
              } catch {
                setUser(null)
              }
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
      console.log('Login response:', data)
      
      localStorage.setItem('JWT', data.token)
      
      // Store complete user information
      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        display_name: data.user.display_name,
        phone: data.user.phone || null,
        furigana: data.user.furigana || null
      }
      
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      console.log('User data stored:', userData)
      
      return data
    } catch (err) {
      console.error('Login error:', err)
      
      // Retry against legacy local-auth if Railway route is missing
      if (err?.response?.status === 404 || err?.response?.status === 401) {
        try {
          const { data } = await http.post('/local-auth/login', { email, password })
          localStorage.setItem('JWT', data.token)
          
          const userData = {
            id: data.user.id,
            email: data.user.email,
            username: data.user.username || data.user.email.split('@')[0],
            display_name: data.user.display_name || 'User',
            phone: data.user.phone || null,
            furigana: data.user.furigana || null
          }
          
          localStorage.setItem('user', JSON.stringify(userData))
          setUser(userData)
          
          return data
        } catch (localErr) {
          console.error('Local auth login error:', localErr)
          throw localErr
        }
      }
      throw err
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    const payload = { 
      email, 
      password, 
      username: metadata.username || email.split('@')[0], 
      display_name: metadata.display_name || metadata.username || 'User',
      phone: metadata.phone || null,
      furigana: metadata.furigana || null
    }
    
    console.log('Signing up with payload:', { ...payload, password: '[REDACTED]' })
    
    try {
      const { data } = await http.post('/railway-auth/register', payload)
      console.log('Signup response:', data)
      
      // Store JWT token
      localStorage.setItem('JWT', data.token)
      
      // Store complete user information
      const userData = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        display_name: data.user.display_name,
        phone: data.user.phone,
        furigana: data.user.furigana
      }
      
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      console.log('User data stored:', userData)
      
      return data
    } catch (err) {
      console.error('Signup error:', err)
      
      if (err?.response?.status === 404 || err?.response?.status === 401) {
        try {
          const { data } = await http.post('/local-auth/register', payload)
          localStorage.setItem('JWT', data.token)
          
          const userData = {
            id: data.user.id,
            email: data.user.email,
            username: data.user.username,
            display_name: data.user.display_name,
            phone: data.user.phone,
            furigana: data.user.furigana
          }
          
          localStorage.setItem('user', JSON.stringify(userData))
          setUser(userData)
          
          return data
        } catch (localErr) {
          console.error('Local auth signup error:', localErr)
          throw localErr
        }
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
