// Default settings
const DEFAULT_SETTINGS = {
  queryAgentMode: 'basic',
  llmModel: 'chatgpt',
  language: 'en',
  timezone: 'UTC',
  // ... other existing settings
};

// Settings keys for localStorage
const SETTINGS_KEYS = {
  QUERY_AGENT_MODE: 'queryAgentMode',
  ALL_SETTINGS: 'userSettings',
};

export const getQueryAgentMode = () => {
  try {
    const mode = localStorage.getItem(SETTINGS_KEYS.QUERY_AGENT_MODE);
    return mode || DEFAULT_SETTINGS.queryAgentMode;
  } catch (error) {
    console.warn('Failed to get query agent mode from localStorage:', error);
    return DEFAULT_SETTINGS.queryAgentMode;
  }
};

export const setQueryAgentMode = (mode) => {
  try {
    localStorage.setItem(SETTINGS_KEYS.QUERY_AGENT_MODE, mode);
    return true;
  } catch (error) {
    console.error('Failed to save query agent mode to localStorage:', error);
    return false;
  }
};

export const getAllSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEYS.ALL_SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('Failed to get settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveAllSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEYS.ALL_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    return false;
  }
};

export const resetToDefaults = () => {
  try {
    localStorage.removeItem(SETTINGS_KEYS.QUERY_AGENT_MODE);
    localStorage.removeItem(SETTINGS_KEYS.ALL_SETTINGS);
    return true;
  } catch (error) {
    console.error('Failed to reset settings:', error);
    return false;
  }
};

// Helper function to update a specific setting
export const updateSetting = (key, value) => {
  try {
    const currentSettings = getAllSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    return saveAllSettings(updatedSettings);
  } catch (error) {
    console.error(`Failed to update setting ${key}:`, error);
    return false;
  }
};

// Helper function to get a specific setting
export const getSetting = (key) => {
  try {
    const settings = getAllSettings();
    return settings[key] || DEFAULT_SETTINGS[key];
  } catch (error) {
    console.warn(`Failed to get setting ${key}:`, error);
    return DEFAULT_SETTINGS[key];
  }
}; 