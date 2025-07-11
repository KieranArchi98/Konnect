import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Agents from './components/Agents.jsx';
import Quests from './components/Quests.jsx';
import Database from './components/Database.jsx';
import Settings from './components/Settings.jsx';
import { CssBaseline, Box, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { default: '#f4f6fa' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, ml: 0, width: '100%' }}>
          <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route path='/quests' element={<Quests />} />
            <Route path='/agents' element={<Agents />} />
            <Route path='/database' element={<Database />} />
            <Route path='/settings' element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
