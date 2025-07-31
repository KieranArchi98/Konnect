import React, { useState } from 'react';
import axios from 'axios';

const BackendTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setTestResult(null);
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    try {
      console.log('[BackendTest] Testing backend connectivity...');
      
      // Test ping endpoint
      const pingResponse = await axios.get(`${backendUrl}/auth/ping`, {
        timeout: 5000
      });
      console.log('[BackendTest] Ping successful:', pingResponse.data);
      
      // Test auth test endpoint
      const testResponse = await axios.get(`${backendUrl}/auth/test`, {
        timeout: 5000
      });
      console.log('[BackendTest] Auth test successful:', testResponse.data);
      
      setTestResult({
        success: true,
        ping: pingResponse.data,
        authTest: testResponse.data,
        backendUrl
      });
    } catch (error) {
      console.error('[BackendTest] Backend test failed:', error);
      setTestResult({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data
        },
        backendUrl
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px' }}>
      <h3>Backend Connectivity Test</h3>
      <button 
        onClick={testBackend} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      
      {testResult && (
        <div style={{ marginTop: '20px' }}>
          <h4>Test Results:</h4>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default BackendTest; 