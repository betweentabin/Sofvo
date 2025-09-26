import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
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
  const nodeBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('JWT')
      if (token) {
        try {
          const { data } = await axios.get(`${nodeBase}/railway-auth/me`, { headers: { Authorization: `Bearer ${token}` }})
          setUser({ id: data.user.id, email: data.user.email })
        } catch { setUser(null) }
      }
      setLoading(false)
    }
    init()
  }, [])

  const signIn = async (email, password) => {
    const { data } = await axios.post(`${nodeBase}/railway-auth/login`, { email, password })
    localStorage.setItem('JWT', data.token)
    setUser({ id: data.user.id, email: data.user.email })
    return data
  }

  const signUp = async (email, password, metadata = {}) => {
    const payload = { email, password, username: metadata.username || email.split('@')[0], display_name: metadata.display_name || metadata.username || 'User' }
    const { data } = await axios.post(`${nodeBase}/railway-auth/register`, payload)
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
