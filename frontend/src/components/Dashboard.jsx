import React, { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface.jsx';
import MetricCard from './MetricCard.jsx';
import { Grid, Typography, Box } from '@mui/material';
import axios from 'axios';

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    setLoading(true);
    axios.get(`${backendUrl}/metrics`)
      .then(res => {
        setMetrics(res.data);
        setError("");
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to fetch metrics'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>Dashboard</Typography>
      <ChatInterface />
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Deadlines" content={metrics ? metrics.deadlines : (loading ? 'Loading...' : '')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="To-Do" content={metrics ? metrics.todo : (loading ? 'Loading...' : '')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Habits" content={metrics ? metrics.habits : (loading ? 'Loading...' : '')} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="News" content={metrics ? metrics.news : (loading ? [] : [])} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
