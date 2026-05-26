import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    localStorage.removeItem('demo_user')
    await supabase.auth.signOut()
  }

  // Check for demo session
  const getDemoUser = () => {
    const demoUser = localStorage.getItem('demo_user')
    return demoUser ? JSON.parse(demoUser) : null
  }

  return {
    user: user || (getDemoUser() ? { email: getDemoUser().email, id: getDemoUser().id } : null),
    session,
    loading,
    signIn,
    signOut
  }
}
