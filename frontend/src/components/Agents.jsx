import React from 'react';
import AgentControl from './AgentControl.jsx';
import { Box, Typography, Card, CardContent } from '@mui/material';

function Agents() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>Agents</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Manage LangChain Agents</Typography>
          <AgentControl />
        </CardContent>
      </Card>
      {/* Placeholder for agent task list/report */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" color="text.secondary">Task reports and agent monitoring will appear here...</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Agents;
