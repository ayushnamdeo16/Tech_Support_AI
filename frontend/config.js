// API Configuration
// This file determines which API URL to use based on the environment
// For production, set this via environment variable or update the default

const API_CONFIG = {
  // Automatically detect API URL based on hostname
  getApiUrl: function() {
    // If running on localhost, use local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // For production, use environment variable or default to Render/Railway URL
    // You can set this via Vercel/Netlify environment variables
    const envApiUrl = window.API_URL || 'https://tech-support-ai-backend.onrender.com';
    return envApiUrl;
  }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;
