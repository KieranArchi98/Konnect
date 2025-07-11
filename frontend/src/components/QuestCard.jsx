import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import axios from 'axios';

function QuestCard({ title, description, status, questId, elo_reward }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/quests/accept/${questId}`);
      setAccepted(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept quest');
    }
    setLoading(false);
  };

  return (
    <Card sx={{ minWidth: 220, mb: 2 }} elevation={2}>
      <CardContent>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>{description}</Typography>
        <Typography variant="caption" color={currentStatus === 'Available' ? 'success.main' : 'warning.main'} sx={{ mb: 1, display: 'block' }}>
          Status: {currentStatus}
        </Typography>
        <Typography variant="caption" color="primary" sx={{ mb: 2, display: 'block' }}>
          Elo Reward: {elo_reward}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" color="success" size="small" disabled={currentStatus !== 'available'} onClick={handleAccept}>Accept</Button>
        </Box>
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </CardContent>
    </Card>
  );
}

export default QuestCard;
