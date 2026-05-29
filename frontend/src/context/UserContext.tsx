import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  name: string
  email: string
  sector: string
  supabase_user_id: string
}

interface UserContextType {
  profile: UserProfile | null
  setProfile: (p: UserProfile | null) => void
  loading: boolean
}

const UserContext = createContext<UserContextType>({
  profile: null,
  setProfile: () => {},
  loading: true,
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setProfile({
          name: session.user.user_metadata?.name || session.user.email || '',
          email: session.user.email || '',
          sector: session.user.user_metadata?.sector || '',
          supabase_user_id: session.user.id,
        })
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setProfile({
          name: session.user.user_metadata?.name || session.user.email || '',
          email: session.user.email || '',
          sector: session.user.user_metadata?.sector || '',
          supabase_user_id: session.user.id,
        })
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ profile, setProfile, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
