import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Card, CardContent, MenuItem, Select, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';

function AgentControl() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [status, setStatus] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [emailPreview, setEmailPreview] = useState(null);
  const [previewEmail, setPreviewEmail] = useState('');
  const [previewAgentId, setPreviewAgentId] = useState(null);
  const [previewUserInput, setPreviewUserInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    axios.get(`${backendUrl}/agents/`).then(res => {
      setAgents(res.data || []);
      if (res.data && res.data.length > 0) setSelectedAgent(res.data[0].id);
    });
  }, [backendUrl]);

  const handleAssign = async () => {
    setLoading(true);
    setError('');
    if (!taskInput.trim() || !selectedAgent) {
      setError('Please select an agent and enter a command.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.post(`${backendUrl}/agents/assign`, { agent_id: selectedAgent, input: taskInput });
      if (res.data.status === 'failed') {
        setError(res.data.error || 'Task assignment failed.');
        setStatus('failed');
        setTaskId(null);
      } else if (res.data.status === 'preview') {
        setEmailPreview(res.data.preview);
        setPreviewEmail(res.data.email);
        setPreviewAgentId(selectedAgent);
        setPreviewUserInput(taskInput);
        setShowPreview(true);
        setStatus('preview');
        setTaskId(null);
      } else {
        setTaskId(res.data.task_id);
        setStatus(res.data.status);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign task');
    }
    setLoading(false);
  };

  const handleCheckStatus = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/agents/status/${taskId}`);
      setStatus(res.data.status);
      setTaskDetails(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch status');
    }
    setLoading(false);
  };

  const handleShowDetails = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/agents/status/${taskId}`);
      setTaskDetails(res.data);
      setShowDetails(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch details');
    }
    setLoading(false);
  };

  const handleCloseDetails = () => setShowDetails(false);

  const handleConfirmSend = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${backendUrl}/agents/send_email`, {
        email: previewEmail,
        preview: emailPreview,
        agent_id: previewAgentId,
        user_input: previewUserInput
      });
      if (res.data.status === 'failed') {
        setError(res.data.error || 'Failed to send email.');
        setStatus('failed');
      } else {
        setTaskId(res.data.task_id);
        setStatus(res.data.status);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send email');
    }
    setShowPreview(false);
    setLoading(false);
  };

  const handleCancelSend = () => {
    setShowPreview(false);
    setEmailPreview(null);
    setPreviewEmail('');
    setPreviewAgentId(null);
    setPreviewUserInput('');
    setStatus('');
  };

  return (
    <Card elevation={1} sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Assign Task</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
            disabled={loading || agents.length === 0}
          >
            {agents.map(agent => (
              <MenuItem key={agent.id} value={agent.id}>{agent.name}</MenuItem>
            ))}
          </Select>
          <TextField
            fullWidth
            placeholder="Enter command (e.g. 'Send an email to john@example.com: Let's meet tomorrow')"
            variant="outlined"
            size="small"
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            disabled={loading}
          />
          <Button variant="contained" color="primary" onClick={handleAssign} disabled={!taskInput || loading}>
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </Box>
        {taskId && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Task ID: {taskId}</Typography>
            <Typography variant="body2">Status: {status}</Typography>
            <Button variant="outlined" size="small" onClick={handleCheckStatus} sx={{ mt: 1, mr: 1 }} disabled={loading}>
              {loading ? 'Checking...' : 'Check Status'}
            </Button>
            <Button variant="outlined" size="small" onClick={handleShowDetails} sx={{ mt: 1 }} disabled={loading}>
              View Details
            </Button>
          </Box>
        )}
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
        <Dialog open={showDetails} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
          <DialogTitle>Task Report</DialogTitle>
          <DialogContent>
            {taskDetails ? (
              <Box>
                <Typography variant="body2"><b>Status:</b> {taskDetails.status}</Typography>
                <Typography variant="body2"><b>Input:</b> {taskDetails.input}</Typography>
                <Typography variant="body2"><b>Output:</b> {taskDetails.output}</Typography>
                {taskDetails.error && <Typography variant="body2" color="error"><b>Error:</b> {taskDetails.error}</Typography>}
                <Typography variant="body2"><b>Created:</b> {taskDetails.created_at}</Typography>
                {taskDetails.started_at && <Typography variant="body2"><b>Started:</b> {taskDetails.started_at}</Typography>}
                {taskDetails.completed_at && <Typography variant="body2"><b>Completed:</b> {taskDetails.completed_at}</Typography>}
              </Box>
            ) : <Typography>Loading...</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Close</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={showPreview} onClose={handleCancelSend} maxWidth="sm" fullWidth>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogContent>
            <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 16, mb: 2 }}>
              {emailPreview}
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}><b>To:</b> {previewEmail}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelSend} color="error" variant="outlined">❌ Cancel</Button>
            <Button onClick={handleConfirmSend} color="success" variant="contained">✅ Send</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default AgentControl;
