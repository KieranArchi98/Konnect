import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  Container,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Divider
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import gsap from 'gsap';
import axios from 'axios';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  const inputRefs = useRef([]);
  const verificationRef = useRef();
  const formRef = useRef();
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  // Get email from location state or localStorage
  const email = location.state?.email || localStorage.getItem('pending_verification_email') || '';
  const displayName = location.state?.displayName || '';

  // Initial animations - only run once
  useEffect(() => {
    // GSAP Animations
    gsap.fromTo(verificationRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    gsap.fromTo(formRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 }
    );

    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []); // Empty dependency array - only run once

  // Separate countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCountdown]);

  // Store email in localStorage if not already there
  useEffect(() => {
    if (email && !localStorage.getItem('pending_verification_email')) {
      localStorage.setItem('pending_verification_email', email);
    }
  }, [email]);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Clear error when user starts typing
    if (error) setError('');
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = [...verificationCode];
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || '';
      }
      setVerificationCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${backendUrl}/auth/verify-email`, {
        email: email,
        verification_code: code
      });
      
      if (response.data.success) {
        setSuccess('Email verified successfully! Redirecting to login...');
        
        // Clear pending verification data
        localStorage.removeItem('pending_verification_email');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email verified successfully! You can now log in.',
              email: email 
            } 
          });
        }, 2000);
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || 'Verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = React.useCallback(async () => {
    if (!canResend || resendCountdown > 0) return;
    
    setResendLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${backendUrl}/auth/resend-verification`, {
        email: email
      });
      
      if (response.data.success) {
        setSuccess('Verification email sent! Please check your inbox.');
        setCanResend(false);
        setResendCountdown(300); // 5 minutes
      } else {
        setError(response.data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || 'Failed to resend verification email';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  }, [canResend, resendCountdown, email, backendUrl]);

  const formatTime = React.useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  if (!email) {
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
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#2A2A2A' }}>
                Email Required
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#6B7280' }}>
                Please register first to receive a verification email.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  bgcolor: '#5A6570',
                  '&:hover': { bgcolor: '#4A5568' },
                  px: 4,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                Go to Register
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

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
        <Box ref={verificationRef}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/register')}
            sx={{
              mb: 3,
              color: '#5A6570',
              '&:hover': {
                backgroundColor: 'rgba(90, 101, 112, 0.04)'
              }
            }}
          >
            Back to Register
          </Button>

          {/* Header */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: '#2A2A2A',
              mb: 1,
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Verify Your Email
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: '#6B7280',
              textAlign: 'center',
              mb: 4,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            We've sent a 6-digit verification code to
          </Typography>

          {/* Email Display */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 4,
              bgcolor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <EmailIcon sx={{ color: '#5A6570', fontSize: 20 }} />
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: '#2A2A2A',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {email}
              </Typography>
            </Box>
          </Paper>
        </Box>

        <Card ref={formRef} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            {/* Success/Error Messages */}
            {success && (
              <Alert 
                severity="success" 
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<CheckCircleIcon />}
              >
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<ErrorIcon />}
              >
                {error}
              </Alert>
            )}

            {/* Verification Code Input */}
            <form onSubmit={handleSubmit}>
              <Typography
                variant="body2"
                sx={{
                  color: '#6B7280',
                  mb: 2,
                  textAlign: 'center',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Enter the 6-digit code from your email
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mb: 3,
                  justifyContent: 'center'
                }}
              >
                {verificationCode.map((digit, index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 600,
                        fontFamily: 'Inter, sans-serif'
                      }
                    }}
                    sx={{
                      width: '60px',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        height: '60px',
                        '& fieldset': {
                          borderColor: '#E5E7EB',
                          borderWidth: '2px'
                        },
                        '&:hover fieldset': {
                          borderColor: '#5A6570',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#5A6570',
                          borderWidth: '2px'
                        },
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || verificationCode.join('').length !== 6}
                sx={{
                  bgcolor: '#5A6570',
                  '&:hover': { bgcolor: '#4A5568' },
                  '&:disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
                  py: 1.5,
                  borderRadius: 2,
                  mb: 3,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>

            <Divider sx={{ my: 3, borderColor: '#E5E7EB' }} />

            {/* Resend Section */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#6B7280',
                  mb: 2,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Didn't receive the code?
              </Typography>
              
              <Button
                onClick={handleResend}
                disabled={!canResend || resendLoading || resendCountdown > 0}
                startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                sx={{
                  color: canResend ? '#5A6570' : '#9CA3AF',
                  '&:hover': {
                    backgroundColor: canResend ? 'rgba(90, 101, 112, 0.04)' : 'transparent'
                  },
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500
                }}
              >
                {resendCountdown > 0 
                  ? `Resend in ${formatTime(resendCountdown)}`
                  : resendLoading 
                    ? 'Sending...' 
                    : 'Resend Code'
                }
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default EmailVerification; 