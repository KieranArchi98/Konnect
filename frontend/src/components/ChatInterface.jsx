import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, TextField, Button, Divider } from '@mui/material';
import axios from 'axios';

function ChatInterface() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const handleSend = async () => {
    if (!query.trim()) return;
    try {
      const res = await axios.post(
        `${backendUrl}/agents/query`,
        { query }, // send as JSON object with 'query' key
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessages([
        ...messages,
        {
          query,
          response: Array.isArray(res.data.results)
            ? res.data.results.map((r, idx) => ({
                text: r.text,
                source: r.source || 'Unknown file'
              }))
            : []
        }
      ]);
      setQuery('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send query');
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          LLM Chat
        </Typography>
        <Box sx={{ minHeight: 120, background: '#f5f5f5', borderRadius: 1, p: 2, mb: 2 }}>
          {messages.length === 0 && <Typography variant="body2" color="text.secondary">Interact with your knowledge base here...</Typography>}
          {messages.map((msg, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="body2"><b>You:</b> {msg.query}</Typography>
              <Box sx={{ ml: 2 }}>
                {msg.response.map((res, i) => (
                  <Card key={i} sx={{ mb: 1, p: 1, background: '#fffbe6', borderLeft: '4px solid #1976d2' }} elevation={1}>
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-line' }}>{res.text}</Typography>
                      <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>Source: {res.source}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          ))}
          {error && <Typography color="error">{error}</Typography>}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField fullWidth placeholder="Type your query..." variant="outlined" size="small" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} />
          <Button variant="contained" color="primary" onClick={handleSend}>Send</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ChatInterface; 