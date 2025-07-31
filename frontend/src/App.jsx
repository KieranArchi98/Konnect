import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Agents from './components/Agents.jsx';
import Quests from './components/Quests.jsx';
import Database from './components/Database.jsx';
import Settings from './components/Settings.jsx';
import Profile from './pages/Profile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Splash from './pages/Splash.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import OAuthCallback from './components/OAuthCallback.jsx';
import EmailVerification from './pages/EmailVerification.jsx';
import BackendTest from './components/BackendTest.jsx';
import { CssBaseline, Box, ThemeProvider, createTheme } from '@mui/material';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { 
      main: '#64748B', // Updated primary
      contrastText: '#fff',
      light: '#94A3B8',
      dark: '#475569'
    },
    secondary: { 
      main: '#9CA3AF', 
      contrastText: '#1E293B' 
    },
    success: {
      main: '#22C55E',
      light: '#4ADE80',
      dark: '#16A34A',
      contrastText: '#fff',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#fff',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
      contrastText: '#fff',
    },
    info: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#fff',
    },
    background: {
      default: '#F8FAFC',
      paper: '#fff',
    },
    text: {
      primary: '#1E293B',
      secondary: '#475569',
    },
    divider: '#E2E8F0',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { 
      fontWeight: 600, 
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h2: { 
      fontWeight: 600, 
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h3: { 
      fontWeight: 600, 
      fontSize: '1.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h4: { 
      fontWeight: 600, 
      fontSize: '1.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h5: { 
      fontWeight: 600, 
      fontSize: '1.125rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h6: { 
      fontWeight: 600, 
      fontSize: '1rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    button: { 
      fontWeight: 500, 
      textTransform: 'none',
      letterSpacing: '0.025em'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.025em'
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.025em'
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #5A6570 0%, #7A8A9A 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4A5568 0%, #5A6570 100%)',
          },
        },
        outlined: {
          borderColor: '#5A6570',
          color: '#5A6570',
          '&:hover': {
            borderColor: '#4A5568',
            backgroundColor: 'rgba(90, 101, 112, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#E5E7EB',
            },
            '&:hover fieldset': {
              borderColor: '#5A6570',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5A6570',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#fff',
          color: '#2A2A2A',
          borderRight: '1px solid #E5E7EB',
          boxShadow: '2px 0 16px rgba(0, 0, 0, 0.1)',
          borderRadius: 0,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E5E7EB',
        },
      },
    },
  },
});

// Main layout component with sidebar
const MainLayout = () => {
  const appRef = useRef();

  useEffect(() => {
    // Initialize GSAP animations
    gsap.fromTo(
      appRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'power2.out' }
    );

    // Scroll-triggered animations
    gsap.utils.toArray('.fade-in').forEach(element => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            end: 'bottom 15%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <Box
      ref={appRef}
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: '#F5F3EF',
        transition: 'background 0.4s',
        position: 'relative',
      }}
      className="linen-texture"
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          ml: 0,
          width: '100%',
          minHeight: '100vh',
          transition: 'background 0.4s',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Routes>
          <Route path='/' element={<Navigate to="/dashboard" replace />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/quests' element={<Quests />} />
          <Route path='/agents' element={<Agents />} />
          <Route path='/database' element={<Database />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/profile' element={<Profile />} />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          {/* Public routes */}
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/backend-test" element={<BackendTest />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
