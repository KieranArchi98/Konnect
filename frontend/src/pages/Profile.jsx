import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Badge,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fade,
  Zoom,
  Chip,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  LocalFireDepartment,
  Psychology,
  AutoAwesome,
  Timeline,
  Star,
  Bolt,
  School,
  Work,
  Person,
  CheckCircle,
  PlayArrow,
  Pause,
  Stop,
  Refresh as RefreshIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { gsap } from 'gsap';
import profileService from '../services/profileService';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileCharts from '../components/ProfileCharts';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const profileRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      profileRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileService.getProfile();
      
      if (response.success) {
        setProfileData(response.data);
      } else {
        setError('Failed to load profile data');
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfileData();
    setIsRefreshing(false);
  };

  const getLevelColor = (level) => {
    if (level >= 8) return '#FFD700'; // Gold
    if (level >= 6) return '#C0C0C0'; // Silver
    if (level >= 4) return '#CD7F32'; // Bronze
    return '#5A6570'; // Default
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'normal': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#5A6570';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} sx={{ color: '#5A6570' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box p={3}>
        <Alert severity="info">No profile data available</Alert>
      </Box>
    );
  }

  const { user: userData, agent_stats, weekly_stats, achievements, story_progress } = profileData;
  const experiencePercentage = (userData.experience / userData.experience_to_next_level) * 100;

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

      {/* Profile Header Card and Charts Row */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Left Column - Profile Card and Story Progression */}
        <Grid item xs={12} md={6}>
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
                        {userData.display_name || 'User'}
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
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(90, 101, 112, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                    

                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Story Progression - Below Profile Card on medium+ screens */}
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
                      backgroundColor: '#FFD700',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <AutoAwesome sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        Story Progression
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Chapter {story_progress.current_chapter} of {story_progress.total_chapters}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {Math.round((story_progress.completed_chapters / story_progress.total_chapters) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(story_progress.completed_chapters / story_progress.total_chapters) * 100}
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
                    Story Points: {story_progress.story_points}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column - Charts */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            display: { xs: 'none', md: 'block' },
            height: '100%',
            mt: { md: 6 }
          }}>
            <ProfileCharts />
          </Box>
        </Grid>
      </Grid>

      {/* Stats Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
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
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                        Consecutive days
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#FF6B35', mb: 1 }}>
                    {profileData.current_streak}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Longest: {profileData.longest_streak} days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Quests */}
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                      <EmojiEvents sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        Active Quests
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        In progress
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4CAF50', mb: 1 }}>
                    {profileData.active_quests}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Ready to complete
                  </Typography>
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
                      <Psychology sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                        AI Agent Workforce
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Your AI team stats
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                          {agent_stats.total_agents_used}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Total Used
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                          {agent_stats.active_agents}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Active
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                          {agent_stats.completed_tasks}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Completed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                          {Math.round(agent_stats.total_efficiency * 100)}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Efficiency
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
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                          {weekly_stats.quests_completed || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Quests
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                          {weekly_stats.tasks_completed || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Tasks
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                          {weekly_stats.hours_learned || 0}h
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Learning
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                          {weekly_stats.total_points || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Points
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
        <Grid item xs={12} md={4}>
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
                  
                  {achievements && achievements.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {achievements
                        .filter(achievement => achievement.unlocked)
                        .slice(0, 5)
                        .map((achievement, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box sx={{ fontSize: 24 }}>{achievement.icon}</Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
                                {achievement.name}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {achievement.description}
                              </Typography>
                            }
                          />
                          <Chip
                            label={`+${achievement.reward_points}`}
                            size="small"
                            sx={{
                              backgroundColor: '#E91E63',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 2 }}>
                      No achievements unlocked yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Analytics Charts - Only visible on small screens */}
      <Box sx={{ mt: 4, display: { xs: 'block', md: 'none' } }}>
        <ProfileCharts />
      </Box>
    </Box>
  );
};

export default Profile; 