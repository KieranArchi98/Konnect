import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('[ProfileService] No access token found in localStorage');
    return {
      'Content-Type': 'application/json'
    };
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

class ProfileService {
  async getProfile() {
    try {
      console.log('[ProfileService] Starting profile fetch...');
      console.log('[ProfileService] API URL:', `${API_BASE_URL}/profile/`);
      
      const headers = getAuthHeaders();
      console.log('[ProfileService] Auth headers present:', !!headers.Authorization);
      
      // Check if we have a token
      if (!headers.Authorization) {
        return {
          success: false,
          error: 'Authentication required. Please log in again.'
        };
      }
      
      const response = await axios.get(`${API_BASE_URL}/profile/`, {
        headers: headers,
        timeout: 10000
      });
      
      console.log('[ProfileService] Response received:', response.status);
      console.log('[ProfileService] Response data:', response.data);
      
      if (response.data.success) {
        console.log('[ProfileService] Profile fetch successful');
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.error('[ProfileService] Profile service returned error:', response.data);
        return {
          success: false,
          error: response.data.message || 'Failed to fetch profile'
        };
      }
    } catch (error) {
      console.error('[ProfileService] Error fetching profile:', error);
      console.error('[ProfileService] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to fetch profile';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view this profile.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Profile not found.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async completeQuest(questId) {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        return {
          success: false,
          error: 'Authentication required. Please log in again.'
        };
      }

      const response = await axios.post(`${API_BASE_URL}/profile/complete-quest/${questId}`, {}, {
        headers: headers,
        timeout: 10000
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
      let errorMessage = 'Failed to complete quest';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export default new ProfileService(); 