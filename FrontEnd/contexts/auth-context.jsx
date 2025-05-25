"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { clearAuthCache, detectSessionInconsistencies } from "@/lib/session-utils"

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileTableExists, setProfileTableExists] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const checkProfilesTable = async () => {
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1)

      if (error && error.message.includes("does not exist")) {
        console.warn("Profiles table does not exist in the database. User profile data will be limited.")
        setProfileTableExists(false)
        return false
      }
      return true
    } catch (error) {
      console.error("Error checking profiles table:", error)
      setProfileTableExists(false)
      return false
    }
  }

  // Update the useEffect hook that checks authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)

        const inconsistencyFixed = await detectSessionInconsistencies(supabase)
        if (inconsistencyFixed) {
          console.log("Session inconsistency fixed, rechecking auth...")
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (session) {
          console.log("Session found, user is authenticated", session.user.email)

          checkProfilesTable().catch((err) => console.error("Profile table check failed:", err))

          setUser({
            ...session.user,
          })
        } else {
          console.log("No session found, user is not authenticated")
          setUser(null)
          // Clear cache if no session
          localStorage.removeItem("user-profile-cache")
        }
      } catch (error) {
        console.error("Auth verification error:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up auth state change listener with debounce to prevent multiple rapid updates
    let debounceTimeout = null
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (debounceTimeout) clearTimeout(debounceTimeout)

      debounceTimeout = setTimeout(async () => {
        console.log("Auth state changed:", event)

        if (session) {
          console.log("Session updated, user is authenticated", session.user.email)

          setUser({
            ...session.user,
          })

          if (profileTableExists) {
            try {

              const { data: profile, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single()

              if (error) {
                if (error.message.includes("does not exist")) {
                  console.warn("Profiles table does not exist. Using basic user data.")
                  setProfileTableExists(false)
                } else {
                  console.error("Error fetching profile on auth change:", error)
                }
              } else if (profile) {
                localStorage.setItem("user-profile-cache", JSON.stringify(profile))
                setUser((prev) => ({
                  ...prev,
                  ...profile,
                }))
              }
            } catch (error) {
              console.error("Error in profile fetch during auth change:", error)
            }
          }
        } else {
          console.log("Session removed, user is not authenticated")
          setUser(null)
          localStorage.removeItem("user-profile-cache")
        }
        setIsLoading(false)
      }, 300) 
    })

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
      subscription?.unsubscribe()
    }
  }, [supabase, router])

  // Update the login function for better error handling and performance
  const login = async (email, password) => {
    setIsLoading(true)

    try {
      // Clear any cache before login
      localStorage.removeItem("user-profile-cache")

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
        if (error.message.includes("rate limit") || error.status === 429) {
          return {
            success: false,
            error: "Too many login attempts. Please try again later.",
            isRateLimited: true,
          }
        }

        throw error
      }

      console.log("Login successful", data.user.email)

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  // Update the logout function
  const logout = async () => {
    try {
      clearAuthCache()

      await supabase.auth.signOut()

      setUser(null)

      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      clearAuthCache()
      setUser(null)
      router.push("/auth/login")
    }
  }

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

      console.log("Registration successful", data.user.email)

      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (profileData) => {
    if (!user) return { success: false, error: "Not authenticated" }

    if (!profileTableExists) {
      return { success: false, error: "Profile functionality is not available" }
    }

    try {
      const { error } = await supabase.from("profiles").update(profileData).eq("id", user.id)

      if (error) {
        if (error.message.includes("does not exist")) {
          console.warn("Profiles table does not exist. Cannot update profile.")
          setProfileTableExists(false)
          return { success: false, error: "Profile functionality is not available" }
        }
        throw error
      }

      setUser({ ...user, ...profileData })

      return { success: true }
    } catch (error) {
      console.error("Profile update error:", error)
      return { success: false, error: error.message }
    }
  }

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

export const useAuth = () => useContext(AuthContext)
