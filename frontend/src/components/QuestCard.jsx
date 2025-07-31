import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import axios from 'axios';

function QuestCard({ title, description, status, questId, elo_reward }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/quests/accept/${questId}`, {}, { headers: getAuthHeaders() });
      setAccepted(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept quest');
    }
    setLoading(false);
  };

  return (
    <Card sx={{ 
      minWidth: 220, 
      mb: 3, 
      borderRadius: '12px', 
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transform: 'translateY(-2px)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#2A2A2A',
            mb: 2,
            letterSpacing: '-0.02em'
          }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3, 
            lineHeight: 1.6,
            color: '#5A6570'
          }}
        >
          {description}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2, 
            display: 'inline-block', 
            fontWeight: 600, 
            color: currentStatus === 'Available' ? '#5A6570' : '#10B981',
            background: currentStatus === 'Available' ? 'rgba(90, 101, 112, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            px: 2,
            py: 1,
            borderRadius: '6px'
          }}
        >
          Status: {currentStatus}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3, 
            display: 'inline-block', 
            fontWeight: 600, 
            color: '#5A6570',
            background: 'rgba(90, 101, 112, 0.1)',
            px: 2,
            py: 1,
            borderRadius: '6px'
          }}
        >
          ELO Reward: {elo_reward}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            size="small" 
            disabled={currentStatus !== 'available' || loading}
            onClick={handleAccept}
            className="haptic-feedback"
            sx={{ 
              background: '#5A6570',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 500,
              '&:hover': {
                background: '#4A5568',
                transform: 'scale(1.02)',
                boxShadow: '0 4px 12px rgba(90, 101, 112, 0.3)',
              },
              '&:disabled': {
                background: '#E5E7EB',
                color: '#9CA3AF',
              }
            }}
          >
            {loading ? 'Accepting...' : 'Accept'}
          </Button>
        </Box>
        
        {error && (
          <Typography 
            color="error" 
            sx={{ 
              mt: 2, 
              p: 1, 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '12px'
            }}
          >
            {error}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default QuestCard;
