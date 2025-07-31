import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Button
} from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { oauthLogin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        if (error) {
          setError(`OAuth error: ${error}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setLoading(false);
          return;
        }

        // Determine provider from URL or state
        const provider = window.location.pathname.includes('google') ? 'google' : 'github';
        const redirectUri = `${window.location.origin}/auth/callback`;

        // Exchange code for tokens
        const result = await oauthLogin(provider, code, redirectUri);
        
        if (result.success) {
          // Redirect to dashboard on success
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.error || 'OAuth login failed');
          setLoading(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred during OAuth login');
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, oauthLogin, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F5F3EF 0%, #E8E6E1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card
          sx={{
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            p: 4,
            textAlign: 'center'
          }}
        >
          <CircularProgress sx={{ mb: 2, color: '#5A6570' }} />
          <Typography variant="h6" sx={{ color: '#2A2A2A', mb: 1 }}>
            Completing Login...
          </Typography>
          <Typography variant="body2" sx={{ color: '#5A6570' }}>
            Please wait while we complete your authentication
          </Typography>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F5F3EF 0%, #E8E6E1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card
          sx={{
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            p: 4,
            maxWidth: 400
          }}
        >
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
          
          <Typography variant="h6" sx={{ color: '#2A2A2A', mb: 2, textAlign: 'center' }}>
            OAuth Login Failed
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#5A6570', mb: 3, textAlign: 'center' }}>
            There was an issue completing your OAuth login. Please try again or use email/password login.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                borderColor: '#5A6570',
                color: '#5A6570',
                '&:hover': {
                  borderColor: '#4A5568',
                  backgroundColor: 'rgba(90, 101, 112, 0.04)'
                }
              }}
            >
              Try Again
            </Button>
            
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                background: 'linear-gradient(135deg, #5A6570 0%, #7A8A9A 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4A5568 0%, #5A6570 100%)',
                }
              }}
            >
              Email Login
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return null;
};

export default OAuthCallback; 