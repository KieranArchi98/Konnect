import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Checkbox,
  LinearProgress
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { register, oauthLogin, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const registerRef = useRef();
  const formRef = useRef();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    // GSAP Animations
    gsap.fromTo(registerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    gsap.fromTo(formRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 }
    );
  }, [isAuthenticated, navigate]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 50) return '#ef4444';
    if (strength < 75) return '#f59e0b';
    return '#83c441';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Fair';
    if (strength < 100) return 'Good';
    return 'Strong';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return false;
    }
    if (formData.displayName.length < 2) {
      setError('Display name must be at least 2 characters');
      return false;
    }
    if (formData.displayName.length > 50) {
      setError('Display name must be less than 50 characters');
      return false;
    }
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
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (passwordStrength < 50) {
      setError('Password is too weak. Please use a stronger password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!acceptTerms) {
      setError('You must accept the Terms of Service');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    console.log('🚀 Starting form submission...');
    setLoading(true);
    setError('');
    
    try {
      console.log('📞 Calling register function...');
      const result = await register(formData.email, formData.password, formData.displayName);
      console.log('📋 Register result:', result);
      
      if (result.success) {
        if (result.requiresVerification) {
          console.log('📧 Redirecting to verification page...');
          // Redirect to email verification page
          navigate('/verify-email', { 
            state: { 
              email: formData.email,
              displayName: formData.displayName,
              message: result.message
            } 
          });
        } else if (result.requiresManualLogin) {
          console.log('🔑 Registration succeeded, manual login required...');
          // Registration succeeded but user needs to log in manually
          setError(result.message || 'Registration successful! Please log in with your new account.');
          // Optionally redirect to login page after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          console.log('🎉 Registration and auto-login succeeded, redirecting to dashboard...');
          // Auto-login succeeded - redirect to dashboard
          navigate('/dashboard');
        }
      } else {
        console.log('❌ Registration failed:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('💥 Unexpected error in handleSubmit:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      console.log('🏁 Form submission completed, setting loading to false');
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
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured yet. Please use email/password registration.`);
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
        <Box ref={registerRef}>
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

          {/* Register Card */}
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
                  Create Account
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#5A6570',
                    fontSize: '1.1rem'
                  }}
                >
                  Join thousands of users boosting their productivity
                </Typography>
              </Box>

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

              {/* Register Form */}
              <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  label="Display Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#5A6570' }} />
                      </InputAdornment>
                    ),
                  }}
                />

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
                  sx={{ mb: 1 }}
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#5A6570' }}>
                        Password Strength
                      </Typography>
                      <Typography variant="caption" sx={{ color: getPasswordStrengthColor(passwordStrength) }}>
                        {getPasswordStrengthText(passwordStrength)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getPasswordStrengthColor(passwordStrength)
                        }
                      }}
                    />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#5A6570' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: '#5A6570' }}
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    {formData.password === formData.confirmPassword ? (
                      <CheckCircleIcon sx={{ color: '#83c441', mr: 1, fontSize: 20 }} />
                    ) : (
                      <Box sx={{ width: 20, height: 20, mr: 1 }} />
                    )}
                    <Typography variant="caption" sx={{ color: formData.password === formData.confirmPassword ? '#83c441' : '#5A6570' }}>
                      {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </Typography>
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      sx={{
                        color: '#5A6570',
                        '&.Mui-checked': {
                          color: '#5A6570',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: '#5A6570', fontSize: '0.9rem' }}>
                      I agree to the{' '}
                      <Typography
                        component="span"
                        sx={{
                          color: '#5A6570',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#4A5568'
                          }
                        }}
                      >
                        Terms of Service
                      </Typography>
                      {' '}and{' '}
                      <Typography
                        component="span"
                        sx={{
                          color: '#5A6570',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#4A5568'
                          }
                        }}
                      >
                        Privacy Policy
                      </Typography>
                    </Typography>
                  }
                  sx={{ mb: 3 }}
                />

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
                    'Create Account'
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

              {/* Sign In Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: '#5A6570', mb: 1 }}>
                  Already have an account?{' '}
                  <Typography
                    component={Link}
                    to="/login"
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
                    Sign in
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

export default Register; 