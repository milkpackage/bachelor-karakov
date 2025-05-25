/**
 * Utility functions for session management
 */

// Clear all authentication-related cache
export const clearAuthCache = () => {
  // Clear profile cache
  localStorage.removeItem("user-profile-cache")

  // Clear any stored errors
  sessionStorage.removeItem("login-error")

  // Clear any other auth-related cache
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.includes("supabase.auth") || key.includes("serenify-auth")) {
      keysToRemove.push(key)
    }
  }

  // Remove the keys in a separate loop to avoid issues with changing localStorage during iteration
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

// Check if the session token is about to expire and needs refresh
export const checkSessionExpiry = (session) => {
  if (!session) return false

  try {
    // Get expiry from session
    const expiresAt = session.expires_at
    if (!expiresAt) return false

    // Convert to milliseconds (expires_at is in seconds)
    const expiryTime = expiresAt * 1000
    const currentTime = Date.now()

    // If token expires in less than 5 minutes, it needs refresh
    return expiryTime - currentTime < 5 * 60 * 1000
  } catch (error) {
    console.error("Error checking session expiry:", error)
    return false
  }
}

// Detect and fix common session inconsistencies
export const detectSessionInconsistencies = async (supabase) => {
  try {
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check localStorage for session data
    const localStorageKeys = Object.keys(localStorage)
    const hasLocalStorageSession = localStorageKeys.some(
      (key) => key.includes("supabase.auth") || key.includes("serenify-auth"),
    )

    // Detect inconsistency: localStorage has session but actual session is null
    if (hasLocalStorageSession && !session) {
      console.warn("Session inconsistency detected: localStorage has session but actual session is null")
      clearAuthCache()
      return true
    }

    // Detect inconsistency: session exists but is expired
    if (session && checkSessionExpiry(session)) {
      console.warn("Session is about to expire, refreshing")
      await supabase.auth.refreshSession()
      return true
    }

    return false
  } catch (error) {
    console.error("Error detecting session inconsistencies:", error)
    return false
  }
}
