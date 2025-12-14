import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid, 
  Card,
  CardContent,
  Avatar,
  Badge,
  LinearProgress,
  Chip, 
  IconButton, 
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Person as PersonIcon,
  EmojiEvents as EmojiEvents,
  Refresh as RefreshIcon,
  LocalFireDepartment,
  Explore,
  Group,
  Timeline,
  Star
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ProfileCharts from '../components/ProfileCharts';
import gsap from 'gsap';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const profileRef = useRef();

  // Use user data from AuthContext (same as Sidebar)
  const userData = user ? {
    id: user.id,
    email: user.email,
    display_name: user.display_name || user.email?.split('@')[0] || 'User',
    elo: user.elo || 0,
    level: user.level || 1,
    experience: (user.elo || 0) % 100,
    experience_to_next_level: 100
  } : {
    id: 'unknown',
    email: 'unknown@example.com',
    display_name: 'User',
    elo: 0,
    level: 1,
    experience: 0,
    experience_to_next_level: 100
  };

  // Dummy data for other components (keeping the same structure)
  const current_streak = 5;
  const longest_streak = 12;
  const active_quests = 3;
  
  const experiencePercentage = Math.min(100, Math.max(0, (userData.experience / userData.experience_to_next_level) * 100));
  
  console.log('[Profile] Rendered with data:', {
    user: userData,
    current_streak,
    longest_streak,
    active_quests
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh user data from AuthContext
      await refreshUser();
      console.log('[Profile] User data refreshed successfully');
    } catch (err) {
      console.error('[Profile] Refresh error:', err);
      setError('Failed to refresh profile data');
    } finally {
    setIsRefreshing(false);
    }
  };

  const getLevelColor = (level) => {
    if (level >= 10) return '#FFD700'; // Gold
    if (level >= 7) return '#C0C0C0';  // Silver
    if (level >= 4) return '#CD7F32';  // Bronze
    return '#83c441'; // Green
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  useEffect(() => {
    if (profileRef.current) {
      gsap.fromTo(
        profileRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }
  }, [userData]);

  return (
    <Box ref={profileRef} sx={{ 
      width: '100%', 
      py: { xs: 3, md: 4 }, 
      background: '#F5F3EF',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: 32, color: '#5A6570' }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 600, 
              color: '#2A2A2A', 
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Profile
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<EmojiEvents />}
            label={`Level ${userData.level}`}
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E5E7EB',
              fontWeight: 500,
              color: '#5A6570'
            }}
          />
          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E5E7EB',
              '&:hover': {
                background: 'rgba(255, 255, 255, 1)',
                transform: 'rotate(180deg)',
                transition: 'transform 0.3s ease'
              }
            }}
          >
            <RefreshIcon sx={{ 
              color: '#5A6570',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }} />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {/* Profile Header Card and Charts Row */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Left Column - Profile Card and Story Progression */}
        <Grid item xs={12} md={5} sx={{ order: { xs: 1, md: 1 } }}>
          <Grid container spacing={3}>
            {/* Profile Card - Takes half the vertical space */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: '12px', 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box sx={{ 
                            backgroundColor: getLevelColor(userData.level),
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white'
                          }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                              {userData.level}
                            </Typography>
                          </Box>
                        }
                      >
                        <Avatar
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            backgroundColor: '#5A6570',
                            fontSize: '1.5rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {userData.display_name ? userData.display_name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                      </Badge>
                    </Grid>
                    
                    <Grid item xs>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5, letterSpacing: '0.5px' }}>
                        {userData.display_name}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#5A6570', mb: 1, fontWeight: 500 }}>
                        Level {userData.level} • {userData.elo} ELO
                      </Typography>
                      
                      {/* Experience Bar */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#5A6570' }}>
                            XP: {userData.experience} / {userData.experience_to_next_level}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#5A6570' }}>
                            {Math.round(experiencePercentage)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={experiencePercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #83c441, #6ba336)',
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Story Progression Card */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      backgroundColor: '#FFD700',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <Explore sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        Story Progression
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Your journey continues
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        20%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={20}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #FFD700, #FFA000)',
                          borderRadius: 3
                        }
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Chapter 3: Air
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column - Charts */}
        <Grid item xs={12} md={7} sx={{ order: { xs: 5, md: 2 } }}>
          <Box sx={{ 
            height: '100%'
          }}>
            <ProfileCharts />
          </Box>
        </Grid>
      </Grid>

      {/* Stats Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={7} sx={{ order: { xs: 2, md: 1 } }}>
          <Grid container spacing={3}>
            {/* Daily Streak */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      backgroundColor: '#FF6B35',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <LocalFireDepartment sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        Daily Streak
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Current & Longest
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end', 
                    flex: 1,
                    px: { xs: 0.5, sm: 1, md: 2 },
                    gap: { xs: 0.5, sm: 1, md: 2 }
                  }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#FF6B35', 
                          mb: 0.5,
                          fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                        }}
                      >
                    {current_streak}
                  </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666', 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        Current
                  </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: 1, 
                      textAlign: 'center',
                      display: { xs: 'none', lg: 'block' }
                    }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#FF9800', 
                          mb: 0.5,
                          fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                        }}
                      >
                        {longest_streak}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666', 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        Longest
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quest Component */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      backgroundColor: '#4CAF50',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <Explore sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        Quest
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Completed & Abandoned
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end', 
                    flex: 1,
                    px: { xs: 0.5, sm: 1, md: 2 },
                    gap: { xs: 0.5, sm: 1, md: 2 }
                  }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#4CAF50', 
                          mb: 0.5,
                          fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                        }}
                      >
                        12
                  </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666', 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        Completed
                  </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: 1, 
                      textAlign: 'center',
                      display: { xs: 'none', xl: 'block' }
                    }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#F44336', 
                          mb: 0.5,
                          fontSize: { xs: '1.25rem', sm: '1.75rem', md: '3rem' }
                        }}
                      >
                        3
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666', 
                          fontSize: { xs: '0.7rem', sm: '0.875rem' }
                        }}
                      >
                        Abandoned
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: 1, 
                      textAlign: 'center',
                      display: { xs: 'none', xl: 'block' }
                    }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#2196F3', 
                          mb: 0.5,
                          fontSize: { xs: '1.25rem', sm: '1.75rem', md: '3rem' }
                        }}
                      >
                        4:1
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666', 
                          fontSize: { xs: '0.7rem', sm: '0.875rem' }
                        }}
                      >
                        Ratio
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* AI Agent Workforce */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      backgroundColor: '#2196F3',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <Group sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        AI Agent Workforce
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Your AI assistants
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#2196F3',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          4
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          Agents
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#4CAF50',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          23
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          Completed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#FF9800',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          30
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          Assigned
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#9C27B0',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          87%
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          Productivity
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Weekly Stats */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      backgroundColor: '#9C27B0',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <Timeline sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        This Week
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Your weekly progress
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#4CAF50',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          7
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          Quests
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#FF9800',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          15
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          Tasks
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#2196F3',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          {userData.elo}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          ELO
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h3" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#9C27B0',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
                          }}
                        >
                          A
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          Grade
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5} sx={{ order: { xs: 4, md: 2 } }}>
          <Grid container spacing={3}>
            {/* Recent Achievements */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      backgroundColor: '#E91E63',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <Star sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        Recent Achievements
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Latest unlocks
                      </Typography>
                    </Box>
                  </Box>
                  
                    <List sx={{ p: 0 }}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box sx={{ fontSize: 24 }}>🎯</Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                            Welcome
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#666' }}>
                            Join the productivity journey
                              </Typography>
                            }
                          />
                          <Chip
                        label="+50"
                            size="small"
                            sx={{
                              backgroundColor: '#E91E63',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          />
                        </ListItem>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box sx={{ fontSize: 24 }}>⚡</Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                            Getting Started
                    </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Reach level 2
                          </Typography>
                        }
                      />
                      <Chip
                        label="+100"
                        size="small"
                        sx={{
                          backgroundColor: '#E91E63',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box sx={{ fontSize: 24 }}>🤖</Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                            Progress Maker
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Reach level 3
                          </Typography>
                        }
                      />
                      <Chip
                        label="+150"
                        size="small"
                        sx={{
                          backgroundColor: '#E91E63',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 