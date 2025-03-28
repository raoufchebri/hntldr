// Analytics configuration
export const ANALYTICS_CONFIG = {
  // Replace with your actual domain or use environment variable in production
  domain: process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || 'hntldr.com',
  
  // Enable/disable analytics in development
  enableInDevelopment: false,
  
  // High-frequency events that might cause excessive database requests
  highFrequencyEvents: [
    'play_episode',
    'pause_episode',
    'play_latest_episode',
    'pause_latest_episode'
  ],
  
  // Whether to track high-frequency events (set to false to reduce database load)
  trackHighFrequencyEvents: false,
  
  // Batch size for analytics events (to reduce number of requests)
  batchSize: 10,
  
  // Event names for consistent tracking
  events: {
    // Page views
    PAGE_VIEW: 'pageview',
    
    // Episode interactions
    EPISODE_LOADED: 'episode_detail_loaded',
    EPISODE_ERROR: 'episode_detail_error',
    EPISODE_PLAY: 'play_episode',
    EPISODE_PAUSE: 'pause_episode',
    LATEST_EPISODE_LOADED: 'latest_episode_loaded',
    LATEST_EPISODE_ERROR: 'latest_episode_error',
    LATEST_EPISODE_PLAY: 'play_latest_episode',
    LATEST_EPISODE_PAUSE: 'pause_latest_episode',
    VIEW_EPISODE_DETAILS: 'view_latest_episode_details',
    
    // Episode list interactions
    EPISODES_LIST_LOADED: 'episodes_list_loaded',
    EPISODES_LIST_ERROR: 'episodes_list_error',
    EPISODE_SELECTED: 'episode_selected',
    
    // Navigation
    BACK_TO_HOME: 'back_to_home_click',
    
    // External links
    HN_STORY_CLICK: 'hn_story_click',
    
    // UI interactions
    THEME_CHANGED: 'theme_changed',
    DISCLAIMER_SHOWN: 'disclaimer_shown',
    DISCLAIMER_DISMISSED: 'disclaimer_dismissed'
  }
}; 