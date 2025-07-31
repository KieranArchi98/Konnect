import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

class ProfileService {
  async getProfile() {
    try {
      const response = await axios.get(`${API_BASE_URL}/profile/`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to fetch profile'
        };
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch profile'
      };
    }
  }

  async completeQuest(questId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/profile/complete-quest/${questId}`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to complete quest'
        };
      }
    } catch (error) {
      console.error('Error completing quest:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to complete quest'
      };
    }
  }
}

export default new ProfileService(); 