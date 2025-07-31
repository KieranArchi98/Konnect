import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Typography, Box, TextField, Button, Divider, Avatar, Chip, useTheme, useMediaQuery } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import gsap from 'gsap';
import { getQueryAgentMode } from '../utils/settings.js';
import { useAuth } from '../context/AuthContext.jsx';

function ChatInterface() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryMode, setQueryMode] = useState('basic');
  const messagesEndRef = useRef(null);
  const chatRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load query mode from localStorage on component mount
  useEffect(() => {
    const mode = getQueryAgentMode();
    setQueryMode(mode);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Enhanced chat interface animation
    gsap.fromTo(
      chatRef.current,
      { opacity: 0, y: 30, scale: 0.98 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 1, 
        ease: 'power3.out',
        delay: 0.2
      }
    );
  }, []);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    const userMessage = { query, response: [], isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');

    try {
      const res = await axios.post(
        `${backendUrl}/agents/query`,
        { 
          query,
          mode: queryMode  // Include mode in request
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          } 
        }
      );
      
      // Handle different response formats
      let aiMessage;
      if (res.data.mode === "advanced") {
        aiMessage = {
          query: '',
          response: [{ 
            text: res.data.summary, 
            source: "AI Summary",
            mode: "advanced"
          }],
          isUser: false,
          timestamp: new Date()
        };
      } else {
        aiMessage = {
          query: '',
          response: res.data.results.map((r, idx) => ({
            text: r.text,
            source: r.source || 'Knowledge Base',
            mode: "basic"
          })),
          isUser: false,
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send query');
      setMessages(prev => prev.slice(0, -1)); // Remove the user message if failed
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card 
      ref={chatRef}
      sx={{ 
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(229, 231, 235, 0.6)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
        maxWidth: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
      className="fade-in"
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          background: 'linear-gradient(135deg, #5A6570 0%, #4A5568 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
            pointerEvents: 'none'
          }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
            <Avatar sx={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              width: { xs: 32, sm: 40 }, 
              height: { xs: 32, sm: 40 },
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: 'rgba(255, 255, 255, 0.5)'
              }
            }}>
              <SmartToyIcon sx={{ fontSize: { xs: '18px', sm: '24px' } }} />
            </Avatar>
            <Box>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 700, 
                  mb: 0.5,
                  fontSize: { xs: '16px', sm: '20px' },
                  letterSpacing: '-0.02em',
                  color: '#22C55E'
                }}
              >
                
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '12px', sm: '14px' },
                  fontWeight: 500
                }}
              >
                Ask me anything about your knowledge base
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={queryMode === 'advanced' ? 'Advanced Mode' : 'Basic Mode'}
            size="small"
            sx={{ 
              backgroundColor: queryMode === 'advanced' ? '#10B981' : '#6B7280',
              color: '#fff',
              fontWeight: 600,
              position: 'relative',
              zIndex: 1,
              '&:hover': {
                backgroundColor: queryMode === 'advanced' ? '#059669' : '#4B5563',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease'
            }}
          />
        </Box>

        {/* Messages Area */}
        <Box sx={{ 
          height: { xs: '300px', sm: '350px', md: '400px' }, 
          overflowY: 'auto',
          p: { xs: 2, sm: 3 },
          background: 'linear-gradient(135deg, #F8F9FA 0%, #F1F5F9 100%)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F1F5F9',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E1',
            borderRadius: '3px',
            '&:hover': {
              background: '#94A3B8'
            }
          },
        }}>
          {messages.length === 0 && (
            <Box sx={{ 
              textAlign: 'center', 
              py: { xs: 4, sm: 6 },
              color: '#9CA3AF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
              <Box sx={{
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                background: 'rgba(90, 101, 112, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  background: 'rgba(90, 101, 112, 0.15)'
                }
              }}>
                <SmartToyIcon sx={{ 
                  fontSize: { xs: '32px', sm: '40px' }, 
                  color: '#5A6570' 
                }} />
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '16px', sm: '18px' },
                  fontWeight: 600,
                  color: '#2A2A2A'
                }}
              >
                Welcome! I'm your AI assistant.
              </Typography>
              <Typography 
                variant="body2"
                sx={{ 
                  fontSize: { xs: '13px', sm: '14px' },
                  color: '#6B7280',
                  maxWidth: '300px',
                  lineHeight: 1.6
                }}
              >
                Ask me about your personal notes and knowledge base to get started.
              </Typography>
            </Box>
          )}
          
          {messages.map((msg, idx) => (
            <Box key={idx} sx={{ mb: { xs: 2, sm: 3 } }}>
              {msg.isUser ? (
                // User Message
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Box sx={{ 
                    maxWidth: '70%',
                    background: 'linear-gradient(135deg, #5A6570 0%, #4A5568 100%)',
                    color: '#fff',
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: '16px 16px 4px 16px',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(90, 101, 112, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 16px rgba(90, 101, 112, 0.4)'
                    }
                  }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        lineHeight: 1.5,
                        fontSize: { xs: '13px', sm: '14px' },
                        fontWeight: 500
                      }}
                    >
                      {msg.query}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        mt: 1,
                        fontSize: { xs: '10px', sm: '11px' }
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                // AI Message
                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 2 }}>
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)', 
                    color: '#5A6570',
                    width: { xs: 28, sm: 36 }, 
                    height: { xs: 28, sm: 36 },
                    border: '2px solid rgba(90, 101, 112, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      borderColor: 'rgba(90, 101, 112, 0.2)'
                    }
                  }}>
                    <SmartToyIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    {msg.response.map((res, i) => (
                      <Card key={i} sx={{ 
                        mb: 1, 
                        background: '#fff',
                        border: '1px solid rgba(229, 231, 235, 0.6)',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                          transform: 'translateY(-1px)'
                        }
                      }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 1, 
                              lineHeight: 1.6,
                              color: '#2A2A2A',
                              fontSize: { xs: '12px', sm: '14px' },
                              fontWeight: 500
                            }}
                          >
                            {res.text}
                          </Typography>
                          <Chip 
                            label={res.source} 
                            size="small" 
                            sx={{ 
                              background: 'rgba(243, 244, 246, 0.8)',
                              color: '#5A6570',
                              fontSize: { xs: '10px', sm: '11px' },
                              fontWeight: 600,
                              border: '1px solid rgba(229, 231, 235, 0.5)'
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#9CA3AF',
                        fontSize: { xs: '10px', sm: '11px' },
                        fontWeight: 500
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ))}
          
          {isLoading && (
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 2 }}>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)', 
                color: '#5A6570',
                width: { xs: 28, sm: 36 }, 
                height: { xs: 28, sm: 36 } 
              }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
              <Box sx={{ 
                background: '#fff',
                p: { xs: 1.5, sm: 2 },
                borderRadius: '12px',
                border: '1px solid rgba(229, 231, 235, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div className="loading-spinner" style={{ 
                  width: '16px', 
                  height: '16px',
                  border: '2px solid #E5E7EB',
                  borderTop: '2px solid #5A6570',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6B7280',
                    fontSize: { xs: '12px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {queryMode === 'advanced' ? 'Generating AI summary...' : 'Searching knowledge base...'}
                </Typography>
              </Box>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        <Divider sx={{ borderColor: 'rgba(229, 231, 235, 0.6)' }} />

        {/* Input Area */}
        <Box sx={{ p: { xs: 2, sm: 3 }, background: '#fff' }}>
          {error && (
            <Typography 
              color="error" 
              variant="body2" 
              sx={{ 
                mb: 2,
                fontSize: { xs: '12px', sm: '14px' },
                fontWeight: 500,
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              {error}
            </Typography>
          )}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            alignItems: 'flex-end' 
          }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask me about your knowledge base..."
              variant="outlined"
              size="small"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: '#F8F9FA',
                  fontSize: { xs: '13px', sm: '14px' },
                  fontWeight: 500,
                  '& fieldset': {
                    borderColor: 'rgba(229, 231, 235, 0.6)',
                    transition: 'all 0.2s ease'
                  },
                  '&:hover fieldset': {
                    borderColor: '#5A6570',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5A6570',
                    borderWidth: '2px'
                  },
                  '&.Mui-disabled': {
                    background: '#F1F5F9'
                  }
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!query.trim() || isLoading}
              className="haptic-feedback"
              sx={{
                minWidth: { xs: '44px', sm: '48px' },
                height: { xs: '40px', sm: '44px' },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #5A6570 0%, #4A5568 100%)',
                boxShadow: '0 4px 12px rgba(90, 101, 112, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4A5568 0%, #374151 100%)',
                  boxShadow: '0 6px 16px rgba(90, 101, 112, 0.4)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  background: '#E5E7EB',
                  color: '#9CA3AF',
                  boxShadow: 'none',
                  transform: 'none'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <SendIcon sx={{ fontSize: { xs: '18px', sm: '20px' } }} />
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ChatInterface; 