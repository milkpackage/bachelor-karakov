"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"

// Create the auth context
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateProfile: async () => {},
})

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session from Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Get user profile data
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setUser({
            ...session.user,
            ...profile,
          })
        }
      } catch (error) {
        console.error("Auth verification error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Get user profile data
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        setUser({
          ...session.user,
          ...profile,
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  // Login function
  const login = async (email, password) => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check for specific error types
        if (error.message.includes("Email not confirmed")) {
          return {
            success: false,
            error: "Please confirm your email address before logging in. Check your inbox for a confirmation link.",
            isEmailNotConfirmed: true,
          }
        }
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // Register function
  const register = async ({ email, password, username }) => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (profileData) => {
    if (!user) return { success: false, error: "Not authenticated" }

    try {
      const { error } = await supabase.from("profiles").update(profileData).eq("id", user.id)

      if (error) {
        throw error
      }

      // Update local user state
      setUser({ ...user, ...profileData })

      return { success: true }
    } catch (error) {
      console.error("Profile update error:", error)
      return { success: false, error: error.message }
    }
  }

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)
