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
  const isCapacitor = isBrowser && (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:' || !!window.Capacitor)

  let nodeBase
  if (isCapacitor) {
    // In Capacitor, relative '/api' won't work. Use explicit mobile API URL.
    nodeBase = import.meta.env.VITE_MOBILE_API_URL || import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'
  } else if (inVercel) {
    // On Vercel, prefer relative path to use rewrites and avoid CORS.
    nodeBase = '/api'
  } else {
    nodeBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'
  }

  const http = axios.create({ baseURL: nodeBase })

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('JWT')
      if (token) {
        try {
          const { data } = await http.get('/railway-auth/me', { headers: { Authorization: `Bearer ${token}` }})
          setUser({ id: data.user.id, email: data.user.email })
        } catch { setUser(null) }
      }
      setLoading(false)
    }
    init()
  }, [])

  const signIn = async (email, password) => {
    const { data } = await http.post('/railway-auth/login', { email, password })
    localStorage.setItem('JWT', data.token)
    setUser({ id: data.user.id, email: data.user.email })
    return data
  }

  const signUp = async (email, password, metadata = {}) => {
    const payload = { email, password, username: metadata.username || email.split('@')[0], display_name: metadata.display_name || metadata.username || 'User' }
    const { data } = await http.post('/railway-auth/register', payload)
    localStorage.setItem('JWT', data.token)
    setUser({ id: data.user.id, email: data.user.email })
    return data
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
