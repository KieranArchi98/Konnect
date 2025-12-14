import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './ChatInterface.jsx';
import MetricCard from './MetricCard.jsx';
import DeadlinesCard from './DeadlinesCard.jsx';
import TodoCard from './TodoCard.jsx';
import HabitsCard from './HabitsCard.jsx';
import HabitCalendar from './HabitCalendar.jsx';
import { Grid, Typography, Box, Paper, Container, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Assignment as AssignmentIcon,
  Storage as StorageIcon,
  EmojiEvents as EmojiEventsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Flag as FlagIcon,
  SmartToy as SmartToyIcon,
  Assessment as AssessmentIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import axios from 'axios';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext.jsx';

gsap.registerPlugin(ScrollTrigger);

function Dashboard() {
  // Use localStorage to persist metrics across navigation
  const getInitialMetrics = () => {
    const saved = localStorage.getItem('dashboard-metrics');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved metrics:', e);
      }
    }
    return {
      deadlines: "3 days",
      todo: "3 tasks", 
      habits: "2/5 completed",
      news: [],
      // Fallback values for the performance insights cards
      activeQuests: 5,
      aiAgents: 3,
      completionRate: 85,
      filesStored: 12
    };
  };

  const [metrics, setMetrics] = useState(getInitialMetrics);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [forceRender, setForceRender] = useState(0); // Force re-render counter
  const dashRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallOrMedium = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Reset loading state
    setLoading(true);
    setError("");
    
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${backendUrl}/metrics`, { headers: getAuthHeaders() });
        setMetrics(prevMetrics => {
          // Merge backend data with existing fallback values
          const newMetrics = {
            ...prevMetrics,
            ...res.data,
            // Ensure we keep the performance insights values even if backend doesn't provide them
            activeQuests: res.data.activeQuests || prevMetrics.activeQuests,
            aiAgents: res.data.aiAgents || prevMetrics.aiAgents,
            completionRate: res.data.completionRate || prevMetrics.completionRate,
            filesStored: res.data.filesStored || prevMetrics.filesStored
          };
          
          // Save to localStorage for persistence
          localStorage.setItem('dashboard-metrics', JSON.stringify(newMetrics));
          return newMetrics;
        });
        setError("");
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err.response?.data?.detail || 'Failed to fetch metrics');
        // Keep existing metrics if API fails - component will still render
      } finally {
        setLoading(false);
        // Force a re-render to ensure component is visible
        setForceRender(prev => prev + 1);
      }
    };
    
    fetchMetrics();
  }, []);

  useEffect(() => {
    // Enhanced dashboard animations with better timing and easing
    const tl = gsap.timeline();
    
    // Main dashboard entrance
    tl.fromTo(
      dashRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );

    // Stagger animation for metric cards with improved timing
    gsap.fromTo(
      '.metric-card',
      { opacity: 0, y: 30, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8, 
        ease: 'back.out(1.7)',
        stagger: 0.15,
        delay: 0.3,
        scrollTrigger: {
          trigger: '.metric-card',
          start: 'top 90%',
          end: 'bottom 10%',
          toggleActions: 'play none none reverse',
        }
      }
    );

    // Chat interface animation
    gsap.fromTo(
      '.chat-interface',
      { opacity: 0, x: -30 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.8, 
        ease: 'power2.out',
        delay: 0.2
      }
    );

    // News section animation
    gsap.fromTo(
      '.news-section',
      { opacity: 0, x: 30 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.8, 
        ease: 'power2.out',
        delay: 0.4
      }
    );

    // Habit calendar animation
    gsap.fromTo(
      '.habit-calendar',
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        ease: 'power2.out',
        delay: 0.6
      }
    );
  }, []);

  // Force re-render when metrics change to ensure Performance Insights is visible
  useEffect(() => {
    if (metrics && Object.keys(metrics).length > 0) {
      setForceRender(prev => prev + 1);
    }
  }, [metrics]);

  // Ensure we always have metrics data
  const displayMetrics = metrics || {
    activeQuests: 5,
    aiAgents: 3,
    completionRate: 85,
    filesStored: 12,
    news: [{ title: "No news available", url: "#" }]
  };

  // Ensure performance insights values are always available
  const performanceMetrics = {
    activeQuests: displayMetrics.activeQuests || 5,
    aiAgents: displayMetrics.aiAgents || 3,
    completionRate: displayMetrics.completionRate || 85,
    filesStored: displayMetrics.filesStored || 12
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      py: { xs: 0.2, sm: 0.4, md: 4 }, 
      pb: { xs: 2, sm: 3, md: 4 }, 
      background: 'background.primary',
      minHeight: '100vh'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 4 
      }}>
        <DashboardIcon sx={{ 
          fontSize: { xs: '32px', sm: '40px' }, 
          color: '#83c441' 
        }} />
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 600, 
            color: 'text.primary', 
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Dashboard
        </Typography>
      </Box>

      <Box ref={dashRef}>
        {/* Main Content Grid */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Left Column - Chat Interface and Quick Overview */}
          <Grid item xs={12} lg={8}>
            {/* Chat Interface Section */}
            <Box sx={{ 
              mb: { xs: 3, sm: 4, md: 5 },
              width: '100%',
              maxWidth: '100%',
              mx: 'auto'
            }} className="chat-interface">
              <ChatInterface />
            </Box>

            {/* Metrics Grid Section */}
            <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                mb: { xs: 2, sm: 3 },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <AutoAwesomeIcon sx={{ 
                  fontSize: { xs: '20px', sm: '24px' }, 
                  color: '#83c441' 
                }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary'
                  }}
                >
                  Quick Overview
                </Typography>
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box className="metric-card">
                    <DeadlinesCard />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box className="metric-card">
                    <TodoCard />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box className="metric-card">
                    <HabitsCard />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Stats Section - Always render to prevent vanishing */}
            {(() => {
              // Always render the Performance Insights section
              return (
                <Paper 
                  key={`performance-insights-${forceRender}`}
                  sx={{ 
                    p: { xs: 3, sm: 4, md: 5 }, 
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(229, 231, 235, 0.6)',
                    borderRadius: { xs: 2, sm: 3 },
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: loading ? 0.7 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                  className="fade-in"
                >
                  {/* Decorative background */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #83c441 0%, #9ed558 50%, #83c441 100%)',
                    opacity: 0.8
                  }} />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: { xs: 3, sm: 4 }
                  }}>
                    <TrendingUpIcon sx={{ 
                      fontSize: { xs: '20px', sm: '24px' }, 
                      color: '#83c441' 
                    }} />
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 600, 
                        color: 'text.primary',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Performance Insights
                    </Typography>
                    {loading && (
                      <Box sx={{ ml: 'auto' }}>
                        <CircularProgress size={20} sx={{ color: '#83c441' }} />
                      </Box>
                    )}
                  </Box>
                  
                  <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                    <Grid item xs={6} sm={6} md={3}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        background: '#F8FAFC',
                        border: '1px solid',
                        borderColor: '#E2E8F0',
                        transition: 'all 0.3s ease',
                        minHeight: { xs: '120px', sm: '140px' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        '&:hover': {
                          background: '#F1F5F9',
                          transform: 'translateY(-2px)',
                          borderColor: '#CBD5E1'
                        }
                      }}>
                        <FlagIcon sx={{ 
                          fontSize: { xs: '24px', sm: '32px' }, 
                          color: '#83c441', 
                          mb: 1 
                        }} />
                        <Typography 
                          variant={isMobile ? "h4" : "h3"} 
                          sx={{ 
                            color: '#1E293B', 
                            fontWeight: 700,
                            mb: 1
                          }}
                        >
                          {performanceMetrics.activeQuests}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#475569', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {isSmallOrMedium ? 'Quests' : 'Quests'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        background: '#F8FAFC',
                        border: '1px solid',
                        borderColor: '#E2E8F0',
                        transition: 'all 0.3s ease',
                        minHeight: { xs: '120px', sm: '140px' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        '&:hover': {
                          background: '#F1F5F9',
                          transform: 'translateY(-2px)',
                          borderColor: '#CBD5E1'
                        }
                      }}>
                        <SmartToyIcon sx={{ 
                          fontSize: { xs: '24px', sm: '32px' }, 
                          color: '#83c441', 
                          mb: 1 
                        }} />
                        <Typography 
                          variant={isMobile ? "h4" : "h3"} 
                          sx={{ 
                            color: '#1E293B', 
                            fontWeight: 700,
                            mb: 1
                          }}
                        >
                          {performanceMetrics.aiAgents}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#475569', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {isSmallOrMedium ? 'Agents' : 'Agents'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        background: '#F8FAFC',
                        border: '1px solid',
                        borderColor: '#E2E8F0',
                        transition: 'all 0.3s ease',
                        minHeight: { xs: '120px', sm: '140px' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        '&:hover': {
                          background: '#F1F5F9',
                          transform: 'translateY(-2px)',
                          borderColor: '#CBD5E1'
                        }
                      }}>
                        <AssessmentIcon sx={{ 
                          fontSize: { xs: '24px', sm: '32px' }, 
                          color: '#83c441', 
                          mb: 1 
                        }} />
                        <Typography 
                          variant={isMobile ? "h4" : "h3"} 
                          sx={{ 
                            color: '#1E293B', 
                            fontWeight: 700,
                            mb: 1
                          }}
                        >
                          {`${performanceMetrics.completionRate}%`}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#475569', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {isSmallOrMedium ? 'W/L' : 'W/L'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} md={3}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        background: '#F8FAFC',
                        border: '1px solid',
                        borderColor: '#E2E8F0',
                        transition: 'all 0.3s ease',
                        minHeight: { xs: '120px', sm: '140px' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        '&:hover': {
                          background: '#F1F5F9',
                          transform: 'translateY(-2px)',
                          borderColor: '#CBD5E1'
                        }
                      }}>
                        <FolderIcon sx={{ 
                          fontSize: { xs: '24px', sm: '32px' }, 
                          color: '#83c441', 
                          mb: 1 
                        }} />
                        <Typography 
                          variant={isMobile ? "h4" : "h3"} 
                          sx={{ 
                            color: '#1E293B', 
                            fontWeight: 700,
                            mb: 1
                          }}
                        >
                          {performanceMetrics.filesStored}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#475569', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            fontWeight: 500,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {isMobile ? 'Files' : 'Files'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })()}
            
          </Grid>

          {/* Right Column - Latest News and Habit Calendar (Large Screens Only) */}
          {isLargeScreen && (
            <Grid item xs={12} lg={4}>
              {/* Latest News Section */}
              <Box className="news-section" sx={{ 
                mb: { xs: 3, sm: 4, md: 5 }
              }}>
                <MetricCard 
                  title="Latest News" 
                  content={displayMetrics.news} 
                  color="#64748B"
                />
              </Box>

              {/* Habit Calendar Section */}
              <Box className="habit-calendar">
                <HabitCalendar />
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Latest News and Habit Calendar Section for Medium and Small Screens */}
        {!isLargeScreen && (
          <Box sx={{ mt: { xs: 4, sm: 6, md: 5 } }}>
            {/* Line break before Latest News on mobile */}
            {isMobile && (
              <Box sx={{ height: { xs: 3, sm: 0 } }} />
            )}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                mb: { xs: 2, sm: 3 },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <AssignmentIcon sx={{ 
                  fontSize: { xs: '20px', sm: '24px' }, 
                  color: '#83c441' 
                }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary'
                  }}
                >
                  Latest News
                </Typography>
              </Box>
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 4 }}>
              {metrics && metrics.news && metrics.news.slice(0, 3).map((newsItem, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Box className="metric-card">
                    <MetricCard 
                      title={newsItem.title || "News Story"}
                      content={[newsItem]}
                      singleStory={true}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Habit Calendar for Medium and Small Screens */}
            <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                mb: { xs: 2, sm: 3 },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <PsychologyIcon sx={{ 
                  fontSize: { xs: '20px', sm: '24px' }, 
                  color: '#83c441' 
                }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary'
                  }}
                >
                  Habit Tracker
                </Typography>
              </Box>
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                <Grid item xs={12}>
                  <Box className="habit-calendar">
                    <HabitCalendar />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard; 