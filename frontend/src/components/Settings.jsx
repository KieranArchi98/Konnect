import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button } from '@mui/material';
import axios from 'axios';

function Settings() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const handleSave = async () => {
    setSaving(true);
    if (!email.trim()) return;
    try {
      await axios.put(`${backendUrl}/users/settings`, { email });
      setSuccess('Settings updated');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update settings');
      setSuccess('');
    }
    setSaving(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>Settings</Typography>
      <Card sx={{ maxWidth: 500, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>User Preferences</Typography>
          <TextField label="Email" type="email" fullWidth sx={{ mb: 2 }} placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {success && <Typography color="success.main" sx={{ mt: 2 }}>{success}</Typography>}
          {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Settings;
