// This script runs before React hydration to prevent theme flash
(function() {
  const THEME_STORAGE_KEY = 'transactproof-theme'
  
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  
  function applyTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      const theme = savedTheme || 'system'
      const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
      
      // Apply theme class immediately
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      // Set CSS custom property for background color
      document.documentElement.style.setProperty(
        '--background-color',
        resolvedTheme === 'dark' ? '#000000' : '#ffffff'
      )
      
      // Apply background color to body immediately
      document.body.style.backgroundColor = resolvedTheme === 'dark' ? '#000000' : '#ffffff'
      
    } catch (e) {
      // Fallback to dark theme if localStorage fails
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#000000'
    }
  }
  
  // Apply theme immediately
  applyTheme()
  
  // Listen for storage changes (theme changes in other tabs)
  window.addEventListener('storage', function(e) {
    if (e.key === THEME_STORAGE_KEY) {
      applyTheme()
    }
  })
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (!savedTheme || savedTheme === 'system') {
      applyTheme()
    }
  })
})()