// Utility functions for navigation and scroll management

export const cleanNavigate = (router, path) => {
  // Remove any hash fragments from the path
  const cleanPath = path.split("#")[0]

  // Use replace to avoid history issues
  router.replace(cleanPath)

  // Ensure scroll reset
  setTimeout(() => {
    window.scrollTo(0, 0)
  }, 100)
}

export const resetPageScroll = () => {
  // Force scroll to top
  window.scrollTo(0, 0)

  // Also try using requestAnimationFrame for better timing
  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
  })
}

export const preventHashScroll = () => {
  // If there's a hash in the URL, temporarily remove it
  if (window.location.hash) {
    const hash = window.location.hash
    // Remove hash without triggering scroll
    history.replaceState(null, null, window.location.pathname + window.location.search)

    // Optionally restore hash after a delay without scrolling
    setTimeout(() => {
      history.replaceState(null, null, window.location.pathname + window.location.search + hash)
    }, 100)
  }
}

/**
 * Scrolls to an element by ID without changing the URL hash
 * @param {string} elementId - The ID of the element to scroll to
 * @param {Object} options - Scrolling options
 */
export const scrollToElement = (elementId, options = { behavior: "smooth", block: "start" }) => {
  const element = document.getElementById(elementId)
  if (element) {
    // Scroll to the element without changing the URL
    element.scrollIntoView(options)
  }
}

/**
 * Completely disables automatic hash scrolling
 */
export const disableHashScrolling = () => {
  // Remove any hash from the URL without triggering a scroll
  if (window.location.hash) {
    window.history.replaceState(null, null, window.location.pathname)
  }

  // Prevent default scroll behavior for hash links
  const preventHashScroll = (event) => {
    const target = event.target.closest("a")
    if (target && target.hash && target.pathname === window.location.pathname) {
      event.preventDefault()
    }
  }

  // Add event listener
  document.addEventListener("click", preventHashScroll)

  // Return cleanup function
  return () => {
    document.removeEventListener("click", preventHashScroll)
  }
}
