import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  Container,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, oauthLogin, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [oauthLoading, setOauthLoading] = useState('');
  
  const loginRef = useRef();
  const formRef = useRef();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    // GSAP Animations
    gsap.fromTo(loginRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    gsap.fromTo(formRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 }
    );

    // Check for redirect message
    const from = location.state?.from?.pathname || '/dashboard';
    if (from !== '/dashboard') {
      setError('Please log in to access that page');
    }

    // Check for verification message
    if (location.state?.message) {
      // Check if it's a success message (email verification)
      if (location.state.message.includes('verified successfully') || 
          location.state.message.includes('Email verified')) {
        setSuccess(location.state.message);
      } else {
        setError(location.state.message);
      }
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error and success when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setOauthLoading(provider);
    setError('');
    
    try {
      // For development, we'll simulate OAuth flow
      // In production, this would redirect to OAuth provider
      const redirectUri = `${window.location.origin}/auth/callback`;
      const authUrl = provider === 'google' 
        ? `https://accounts.google.com/oauth/authorize?client_id=${process.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`
        : `https://github.com/login/oauth/authorize?client_id=${process.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
      
      // For now, show a message about OAuth setup
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured yet. Please use email/password login.`);
      setOauthLoading('');
    } catch (err) {
      setError(`Failed to connect to ${provider}. Please try again.`);
      setOauthLoading('');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F5F3EF 0%, #E8E6E1 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Box ref={loginRef}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/splash')}
            sx={{
              mb: 3,
              color: '#5A6570',
              '&:hover': {
                backgroundColor: 'rgba(90, 101, 112, 0.04)'
              }
            }}
          >
            Back to Home
          </Button>

          {/* Login Card */}
          <Card
            ref={formRef}
            sx={{
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: '#2A2A2A',
                    mb: 1,
                    fontSize: { xs: '1.8rem', md: '2.2rem' }
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#5A6570',
                    fontSize: '1.1rem'
                  }}
                >
                  Sign in to your account to continue
                </Typography>
              </Box>

              {/* Success Alert */}
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => setSuccess('')}
                >
                  {success}
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#5A6570' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#5A6570' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#5A6570' }}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{
                          color: '#5A6570',
                          '&.Mui-checked': {
                            color: '#5A6570',
                          },
                        }}
                      />
                    }
                    label="Remember me"
                    sx={{ color: '#5A6570' }}
                  />
                  
                  <Typography
                    component={Link}
                    to="/forgot-password"
                    sx={{
                      color: '#5A6570',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      '&:hover': {
                        color: '#4A5568',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Forgot password?
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #83c441 0%, #9ed558 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6ba336 0%, #83c441 100%)',
                    },
                    '&:disabled': {
                      background: '#E5E7EB',
                      color: '#9CA3AF'
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Box>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography sx={{ px: 2, color: '#5A6570', fontSize: '0.9rem' }}>
                  OR
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {/* OAuth Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={oauthLoading === 'google'}
                  startIcon={
                    oauthLoading === 'google' ? (
                      <CircularProgress size={20} />
                    ) : (
                      <GoogleIcon />
                    )
                  }
                  sx={{
                    py: 1.5,
                    borderColor: '#E5E7EB',
                    color: '#2A2A2A',
                    '&:hover': {
                      borderColor: '#5A6570',
                      backgroundColor: 'rgba(90, 101, 112, 0.04)'
                    }
                  }}
                >
                  Google
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={oauthLoading === 'github'}
                  startIcon={
                    oauthLoading === 'github' ? (
                      <CircularProgress size={20} />
                    ) : (
                      <GitHubIcon />
                    )
                  }
                  sx={{
                    py: 1.5,
                    borderColor: '#E5E7EB',
                    color: '#2A2A2A',
                    '&:hover': {
                      borderColor: '#5A6570',
                      backgroundColor: 'rgba(90, 101, 112, 0.04)'
                    }
                  }}
                >
                  GitHub
                </Button>
              </Box>

              {/* Sign Up Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: '#5A6570', mb: 1 }}>
                  Don't have an account?{' '}
                  <Typography
                    component={Link}
                    to="/register"
                    sx={{
                      color: '#5A6570',
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        color: '#4A5568',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Sign up
                  </Typography>
                </Typography>
                

              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default Login; 