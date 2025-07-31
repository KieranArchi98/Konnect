// Cache utility for storing quest data locally
const CACHE_PREFIX = 'quests_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const cacheUtils = {
  // Store data in cache with timestamp
  set: (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.warn('Failed to cache data:', error);
      return false;
    }
  },

  // Get data from cache if not expired
  get: (key) => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now > cacheData.expiresAt) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
  },

  // Check if cache exists and is valid
  has: (key) => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return false;

      const cacheData = JSON.parse(cached);
      return Date.now() <= cacheData.expiresAt;
    } catch (error) {
      return false;
    }
  },

  // Remove specific cache entry
  remove: (key) => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
      return true;
    } catch (error) {
      console.warn('Failed to remove cache:', error);
      return false;
    }
  },

  // Clear all quest cache entries
  clearAll: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('Failed to clear cache:', error);
      return false;
    }
  },

  // Get cache age in milliseconds
  getAge: (key) => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      return Date.now() - cacheData.timestamp;
    } catch (error) {
      return null;
    }
  }
};

// Cache keys
export const CACHE_KEYS = {
  ALL_QUESTS: 'all_quests',
  AVAILABLE_QUESTS: 'available_quests',
  IN_PROGRESS_QUESTS: 'in_progress_quests',
  COMPLETED_QUESTS: 'completed_quests',
  REPORT_STATUS: 'report_status',
  DEADLINE: 'deadline',
  TODOS: 'todos',
  TODOS_LAST_RESET: 'todos_last_reset',
  HABITS: 'habits',
  HABITS_LAST_RESET: 'habits_last_reset'
}; 