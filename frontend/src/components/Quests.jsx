import React, { useState, useEffect } from 'react';
import QuestCard from './QuestCard.jsx';
import { Box, Typography, Grid, Card, CardContent, TextField, Button } from '@mui/material';
import axios from 'axios';

function Quests() {
  const [quests, setQuests] = useState([]);
  const [report, setReport] = useState('');
  const [error, setError] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    axios.get(`${backendUrl}/quests/active`)
      .then(res => setQuests(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to fetch quests'));
  }, []);

  const handleReportSubmit = async () => {
    if (!report.trim()) return;
    try {
      await axios.post(`${backendUrl}/quests/submit`, { report: { text: report } });
      setReport('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>Quests</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={2}>
        {quests.map((q, idx) => (
          <Grid item xs={12} md={4} key={q.id}>
            <QuestCard title={q.title} description={q.description} status={q.status} questId={q.id} elo_reward={q.elo_reward} />
          </Grid>
        ))}
      </Grid>
      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Submit Daily Report</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              value={report}
              onChange={e => setReport(e.target.value)}
              placeholder="Describe your day..."
              fullWidth
              size="small"
            />
            <Button variant="contained" onClick={handleReportSubmit}>Send</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Quests;
