import React, { useState, useEffect, useRef } from 'react';
import QuestCard from './QuestCard.jsx';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  LinearProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  PlayArrow as PlayArrowIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import { cacheUtils, CACHE_KEYS } from '../utils/cache.js';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext.jsx';

function Quests() {
  const [availableQuests, setAvailableQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  const [reportLocked, setReportLocked] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, quest: null });
  const [inProgressQuests, setInProgressQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [timeToMidnight, setTimeToMidnight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { user, refreshUser } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Load cached data on component mount
  const loadCachedData = () => {
    const cachedAvailable = cacheUtils.get(CACHE_KEYS.AVAILABLE_QUESTS) || [];
    const cachedInProgress = cacheUtils.get(CACHE_KEYS.IN_PROGRESS_QUESTS) || [];
    const cachedCompleted = cacheUtils.get(CACHE_KEYS.COMPLETED_QUESTS) || [];
    const cachedReportStatus = cacheUtils.get(CACHE_KEYS.REPORT_STATUS);

    setAvailableQuests(cachedAvailable);
    setInProgressQuests(cachedInProgress);
    setCompletedQuests(cachedCompleted);
    
    if (cachedReportStatus) {
      setReportLocked(cachedReportStatus.locked);
    }

    return { cachedAvailable, cachedInProgress, cachedCompleted };
  };

  const fetchAllQuests = async (showLoading = false) => {
    if (!user) return;
    
    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      setFetchError(null);
      console.log('Fetching all quests...');
      
      // Clear cache before fetching to ensure fresh data
      cacheUtils.remove(CACHE_KEYS.AVAILABLE_QUESTS);
      cacheUtils.remove(CACHE_KEYS.IN_PROGRESS_QUESTS);
      cacheUtils.remove(CACHE_KEYS.COMPLETED_QUESTS);
      
      const res = await axios.get(`${backendUrl}/quests/all`, { headers: getAuthHeaders() });
      console.log('Quest data received:', res.data);
      console.log('Available quests count:', res.data.available?.length || 0);
      console.log('Available quests:', res.data.available);
      console.log('In progress quests count:', res.data.in_progress?.length || 0);
      console.log('In progress quests:', res.data.in_progress);
      console.log('Completed quests count:', res.data.completed?.length || 0);
      console.log('Completed quests:', res.data.completed);
      
      const available = res.data.available || [];
      const inProgress = res.data.in_progress || [];
      const completed = res.data.completed || [];
      
      // Update state
      setAvailableQuests(available);
      setInProgressQuests(inProgress);
      setCompletedQuests(completed);
      
      // Cache the fresh data
      cacheUtils.set(CACHE_KEYS.AVAILABLE_QUESTS, available);
      cacheUtils.set(CACHE_KEYS.IN_PROGRESS_QUESTS, inProgress);
      cacheUtils.set(CACHE_KEYS.COMPLETED_QUESTS, completed);
      
      console.log(`Loaded: ${available.length} available, ${inProgress.length} in-progress, ${completed.length} completed quests`);
      
      // If no available quests, try to force a reset to generate new quests
      if (available.length === 0) {
        console.log('No available quests found - attempting to force quest generation...');
        try {
          // Force a reset to generate new quests
          await axios.post(`${backendUrl}/quests/reset`, {}, { headers: getAuthHeaders() });
          console.log('Forced quest reset completed');
          
          // Fetch again after reset
          const newRes = await axios.get(`${backendUrl}/quests/all`, { headers: getAuthHeaders() });
          const newAvailable = newRes.data.available || [];
          console.log('After reset - available quests:', newAvailable);
          
          if (newAvailable.length > 0) {
            setAvailableQuests(newAvailable);
            cacheUtils.set(CACHE_KEYS.AVAILABLE_QUESTS, newAvailable);
            console.log(`Successfully generated ${newAvailable.length} quests`);
          } else {
            console.error('Still no quests after reset - backend issue');
          }
        } catch (generateErr) {
          console.error('Failed to generate quests:', generateErr);
        }
      }
    } catch (err) {
      console.error('Error fetching quests:', err);
      setFetchError('Failed to load quests. Please try refreshing.');
      
      // Try individual endpoints as fallback
      try {
        console.log('Trying individual endpoints as fallback...');
        const [availableRes, inProgressRes, completedRes] = await Promise.allSettled([
          axios.get(`${backendUrl}/quests/available`, { headers: getAuthHeaders() }),
          axios.get(`${backendUrl}/quests/in_progress`, { headers: getAuthHeaders() }),
          axios.get(`${backendUrl}/quests/completed`, { headers: getAuthHeaders() })
        ]);
        
        const available = availableRes.status === 'fulfilled' ? availableRes.value.data || [] : [];
        const inProgress = inProgressRes.status === 'fulfilled' ? inProgressRes.value.data || [] : [];
        const completed = completedRes.status === 'fulfilled' ? completedRes.value.data || [] : [];
        
        setAvailableQuests(available);
        setInProgressQuests(inProgress);
        setCompletedQuests(completed);
        setFetchError(null);
        
        // Cache the fallback data
        cacheUtils.set(CACHE_KEYS.AVAILABLE_QUESTS, available);
        cacheUtils.set(CACHE_KEYS.IN_PROGRESS_QUESTS, inProgress);
        cacheUtils.set(CACHE_KEYS.COMPLETED_QUESTS, completed);
        
        console.log('Fallback fetch completed');
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
        setFetchError('Unable to load quests. Please check your connection and try again.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch report status
  const fetchReportStatus = async () => {
    try {
      const res = await axios.get(`${backendUrl}/quests/report_status`, { headers: getAuthHeaders() });
      setReportLocked(res.data.locked);
      cacheUtils.set(CACHE_KEYS.REPORT_STATUS, res.data);
    } catch (err) {
      console.warn('Failed to fetch report status:', err);
    }
  };

  // Add retry mechanism for failed requests
  const fetchWithRetry = async (fetchFunction, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fetchFunction();
        return;
      } catch (err) {
        console.error(`Attempt ${i + 1} failed:`, err);
        if (i === maxRetries - 1) {
          console.error('All retry attempts failed');
          throw err;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  };

  // Keep individual fetch functions for optimistic updates
  const fetchAvailableQuests = async () => {
    try {
      const res = await axios.get(`${backendUrl}/quests/available`, { headers: getAuthHeaders() });
      const data = res.data || [];
      setAvailableQuests(data);
      cacheUtils.set(CACHE_KEYS.AVAILABLE_QUESTS, data);
    } catch {
      setAvailableQuests([]);
    }
  };
  
  const fetchInProgressQuests = async () => {
    try {
      const res = await axios.get(`${backendUrl}/quests/in_progress`, { headers: getAuthHeaders() });
      const data = res.data || [];
      setInProgressQuests(data);
      cacheUtils.set(CACHE_KEYS.IN_PROGRESS_QUESTS, data);
    } catch {
      setInProgressQuests([]);
    }
  };
  
  const fetchCompletedQuests = async () => {
    try {
      const res = await axios.get(`${backendUrl}/quests/completed`, { headers: getAuthHeaders() });
      const data = res.data || [];
      setCompletedQuests(data);
      cacheUtils.set(CACHE_KEYS.COMPLETED_QUESTS, data);
    } catch {
      setCompletedQuests([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    console.log('Quests component mounted, checking for daily reset...');
    
    // Check if we need to reset quests for a new day
    const checkAndResetForNewDay = async () => {
      try {
        // Check if it's a new day locally first
        const shouldReset = isNewDay();
        
        if (shouldReset) {
          console.log('New day detected, resetting quests...');
          // Call the backend reset endpoint to generate new quests
          const res = await axios.post(`${backendUrl}/quests/reset`, {}, { headers: getAuthHeaders() });
          console.log('Daily reset completed:', res.data);
        } else {
          console.log('Same day, checking for existing quests...');
        }
        
        // Clear cache to ensure fresh data
        cacheUtils.remove(CACHE_KEYS.AVAILABLE_QUESTS);
        cacheUtils.remove(CACHE_KEYS.IN_PROGRESS_QUESTS);
        cacheUtils.remove(CACHE_KEYS.COMPLETED_QUESTS);
        cacheUtils.remove(CACHE_KEYS.REPORT_STATUS);
        
        // Fetch fresh quests
        await fetchAllQuests(false);
        
      } catch (err) {
        console.error('Error checking for daily reset:', err);
        // Fallback to normal fetch if reset fails
        fetchAllQuests(false);
      }
    };
    
    // Always check for daily reset on component mount
    checkAndResetForNewDay();
    
    // Fetch report status
    fetchReportStatus();
  }, [user]);

  // Add periodic refresh to ensure data stays current (less frequent)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('Periodic quest refresh...');
      fetchAllQuests(false);
    }, 60000); // Refresh every 60 seconds instead of 30

    return () => clearInterval(interval);
  }, [user]);

  // Timer logic for midnight GMT+1 (UK time) using only dayjs and native JS
  function getTimeToNextUKMidnight() {
    const now = dayjs();
    // UK time is GMT+1 (BST) during summer, GMT otherwise. For simplicity, use +1 always.
    const nowUK = now.add(1, 'hour');
    const nextMidnightUK = nowUK.hour() < 24 ? nowUK.startOf('day').add(1, 'day') : nowUK.startOf('day');
    const diff = nextMidnightUK.diff(nowUK);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  // Check if it's a new day since last quest reset
  const isNewDay = () => {
    const lastResetDate = localStorage.getItem('lastQuestResetDate');
    const today = dayjs().format('YYYY-MM-DD');
    
    if (!lastResetDate || lastResetDate !== today) {
      localStorage.setItem('lastQuestResetDate', today);
      return true;
    }
    return false;
  };
  
  useEffect(() => {
    const updateTimer = () => {
      const newTime = getTimeToNextUKMidnight();
      setTimeToMidnight(newTime);
      
      // If it's midnight (00:00:00), reset quests
      if (newTime === '00:00:00') {
        console.log('Midnight reached, resetting quests...');
        handleQuestReset();
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuestReset = async () => {
    try {
      console.log('Resetting quests...');
      await axios.post(`${backendUrl}/quests/reset`, {}, { headers: getAuthHeaders() });
      
      // Clear cache and fetch fresh quests
      cacheUtils.remove(CACHE_KEYS.AVAILABLE_QUESTS);
      cacheUtils.remove(CACHE_KEYS.IN_PROGRESS_QUESTS);
      cacheUtils.remove(CACHE_KEYS.COMPLETED_QUESTS);
      
      // Fetch fresh quests
      setTimeout(() => {
        fetchAllQuests(false);
      }, 1000);
      
      console.log('Quests reset successfully');
    } catch (err) {
      console.error('Error resetting quests:', err);
    }
  };

  const handleReportSubmit = async () => {
    if (reportLocked) {
      setError('You have already submitted a report today. Please try again tomorrow.');
      return;
    }
    if (!report.trim()) return;
    
    setIsSubmittingReport(true);
    try {
      console.log('Submitting daily report...');
      const res = await axios.post(`${backendUrl}/quests/report`, { report: { text: report } }, { headers: getAuthHeaders() });
      if (res.data && res.data.error) {
        setError(res.data.error);
        return;
      }
      console.log('Report submitted successfully, refreshing quests...');
      setReport('');
      setError('');
      setReportLocked(true);
      
      // Update cache
      cacheUtils.set(CACHE_KEYS.REPORT_STATUS, { locked: true });
      
      // Clear quest cache to force fresh fetch
      cacheUtils.remove(CACHE_KEYS.AVAILABLE_QUESTS);
      cacheUtils.remove(CACHE_KEYS.IN_PROGRESS_QUESTS);
      cacheUtils.remove(CACHE_KEYS.COMPLETED_QUESTS);
      
      // Wait a moment for backend to process, then refresh
      setTimeout(() => {
        fetchWithRetry(() => fetchAllQuests(false));
      }, 1000);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleAcceptQuest = async (questId) => {
    try {
      // Optimistic update - immediately move quest to in-progress
      const questToAccept = availableQuests.find(q => (q.quest_id || q.id) === questId);
      if (questToAccept) {
        setAvailableQuests(prev => prev.filter(q => (q.quest_id || q.id) !== questId));
        setInProgressQuests(prev => [...prev, { ...questToAccept, status: 'in_progress' }]);
        
        // Update cache immediately
        cacheUtils.set(CACHE_KEYS.AVAILABLE_QUESTS, availableQuests.filter(q => (q.quest_id || q.id) !== questId));
        cacheUtils.set(CACHE_KEYS.IN_PROGRESS_QUESTS, [...inProgressQuests, { ...questToAccept, status: 'in_progress' }]);
      }
      
      await axios.post(`${backendUrl}/quests/accept/${questId}`, {}, { headers: getAuthHeaders() });
      // Refresh to ensure consistency
      fetchAllQuests(false);
    } catch (err) {
      // Revert optimistic update on error
      fetchAllQuests(false);
      setError(err.response?.data?.detail || 'Failed to accept quest');
    }
  };

  const handleCompleteQuest = async (questId) => {
    try {
      // Optimistic update - immediately move quest to completed
      const questToComplete = inProgressQuests.find(q => (q.quest_id || q.id) === questId);
      if (questToComplete) {
        setInProgressQuests(prev => prev.filter(q => (q.quest_id || q.id) !== questId));
        setCompletedQuests(prev => [{ ...questToComplete, status: 'completed', date_completed: new Date().toISOString().split('T')[0] }, ...prev]);
        
        // Update cache immediately
        cacheUtils.set(CACHE_KEYS.IN_PROGRESS_QUESTS, inProgressQuests.filter(q => (q.quest_id || q.id) !== questId));
        cacheUtils.set(CACHE_KEYS.COMPLETED_QUESTS, [{ ...questToComplete, status: 'completed', date_completed: new Date().toISOString().split('T')[0] }, ...completedQuests]);
      }
      
      // Complete the quest
      const res = await axios.post(`${backendUrl}/quests/complete/${questId}`, {}, { headers: getAuthHeaders() });
      
      // Also call the profile service to update ELO
      try {
        await axios.post(`${backendUrl}/profile/complete-quest/${questId}`, {}, { headers: getAuthHeaders() });
        console.log('[Quests] Profile ELO updated successfully');
        refreshUser(); // Update user ELO display
      } catch (profileErr) {
        console.warn('[Quests] Failed to update profile ELO:', profileErr);
        // Don't fail the quest completion if profile update fails
      }
      
      // Show ELO reward notification if available
      if (res.data && res.data.elo_reward) {
        setError(`Quest completed! You earned ${res.data.elo_reward} ELO points!`);
        setTimeout(() => setError(''), 5000); // Clear after 5 seconds
      }
      
      // Refresh to ensure consistency
      fetchAllQuests(false);
    } catch (err) {
      // Revert optimistic update on error
      fetchAllQuests(false);
      setError(err.response?.data?.detail || 'Failed to complete quest');
    }
  };

  const handleAbandonQuest = async (questId) => {
    try {
      // Optimistic update - immediately remove quest from in-progress
      setInProgressQuests(prev => prev.filter(q => (q.quest_id || q.id) !== questId));
      
      // Update cache immediately
      cacheUtils.set(CACHE_KEYS.IN_PROGRESS_QUESTS, inProgressQuests.filter(q => (q.quest_id || q.id) !== questId));
      
      await axios.post(`${backendUrl}/quests/abandon/${questId}`, {}, { headers: getAuthHeaders() });
      // Refresh to ensure consistency
      fetchAllQuests(false);
    } catch (err) {
      // Revert optimistic update on error
      fetchAllQuests(false);
      setError(err.response?.data?.detail || 'Failed to abandon quest');
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError('');
      
      // Clear all cache first
      cacheUtils.remove(CACHE_KEYS.AVAILABLE_QUESTS);
      cacheUtils.remove(CACHE_KEYS.IN_PROGRESS_QUESTS);
      cacheUtils.remove(CACHE_KEYS.COMPLETED_QUESTS);
      cacheUtils.remove(CACHE_KEYS.REPORT_STATUS);
      
      // Force a reset to ensure fresh quests
      try {
        await axios.post(`${backendUrl}/quests/reset`, {}, { headers: getAuthHeaders() });
        console.log('Forced quest reset completed');
      } catch (resetErr) {
        console.warn('Reset failed, continuing with normal fetch:', resetErr);
      }
      
      // Fetch fresh data
      await fetchAllQuests(false);
      
    } catch (err) {
      console.error('Error during refresh:', err);
      setError('Failed to refresh quests. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Common card styling for consistent appearance
  const cardStyles = {
    width: '100%',
    height: '100%',
    minHeight: 200,
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transform: 'translateY(-2px)',
    }
  };

  // Common grid item styling for responsive layout
  const gridItemStyles = {
    display: 'flex',
    flexDirection: 'column'
  };

  const questsRef = useRef();
  useEffect(() => {
    gsap.fromTo(
      questsRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, []);

  return (
    <Box ref={questsRef} sx={{ 
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
          <AssignmentIcon sx={{ fontSize: 32, color: '#5A6570' }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 600, 
              color: '#2A2A2A', 
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Quests
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<ScheduleIcon />}
            label={`Refresh in: ${timeToMidnight}`}
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
      
      {fetchError && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: '8px' }}>
          {fetchError}
        </Alert>
      )}
      
      {/* Always show content - no loading splash screen */}
      <>
        {/* Available Quests Section */}
        {availableQuests.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <PlayArrowIcon sx={{ color: '#FFD700', fontSize: 28 }} />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#2A2A2A',
                  letterSpacing: '-0.02em'
                }}
              >
                Available Quests
              </Typography>
              <Chip 
                label={availableQuests.length} 
                sx={{ 
                  background: '#FFD700', 
                  color: 'white',
                  fontWeight: 600
                }} 
              />
            </Box>
            <Grid container spacing={3}>
              {availableQuests.slice(0, 3).map((q, idx) => (
                <Grid item xs={12} sm={6} md={4} key={q.quest_id || q.id} sx={gridItemStyles}>
                  <Card sx={cardStyles}>
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      p: 3 
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 2,
                            color: '#2A2A2A',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {q.quests?.title || q.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 3, 
                            flexGrow: 1, 
                            lineHeight: 1.6,
                            color: '#5A6570'
                          }}
                        >
                          {q.quests?.description || q.description}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 'auto' }}>
                        <Chip 
                          label={`${q.quests?.elo_reward || q.elo_reward} ELO`}
                          sx={{ 
                            background: 'rgba(255, 215, 0, 0.15)',
                            color: '#FFD700',
                            fontWeight: 600,
                            mb: 2
                          }}
                        />
                        <Button 
                          variant="contained" 
                          onClick={() => handleAcceptQuest(q.quest_id || q.id)} 
                          fullWidth
                          className="haptic-feedback"
                          sx={{ 
                            borderRadius: '8px', 
                            fontWeight: 500,
                            background: '#5A6570',
                            '&:hover': {
                              background: '#4A5568',
                              transform: 'scale(1.02)',
                              boxShadow: '0 4px 12px rgba(90, 101, 112, 0.3)',
                            }
                          }}
                        >
                          Accept
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* Report submission */}
        <Card sx={{ 
          mb: 5, 
          borderRadius: '12px', 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(229, 231, 235, 0.5)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <CheckCircleIcon sx={{ color: '#83c441', fontSize: 28 }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#2A2A2A',
                  letterSpacing: '-0.02em'
                }}
              >
                Submit Daily Report
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              <TextField
                value={report}
                onChange={e => setReport(e.target.value)}
                placeholder="Describe your day..."
                fullWidth
                size="small"
                disabled={reportLocked || isSubmittingReport}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    background: '#F8F9FA',
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
                }}
              />
              <Button 
                variant="contained" 
                onClick={handleReportSubmit} 
                disabled={reportLocked || isSubmittingReport}
                className="haptic-feedback"
                sx={{ 
                  fontWeight: 500, 
                  borderRadius: '8px', 
                  px: 4, 
                  py: 1,
                  background: '#83c441',
                  '&:hover': {
                    background: '#6ba336',
                    transform: 'scale(1.02)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  },
                  '&:disabled': {
                    background: '#E5E7EB',
                    color: '#9CA3AF',
                  }
                }}
              >
                {isSubmittingReport ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Send'
                )}
              </Button>
            </Box>
            {reportLocked && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: '8px' }}>
                You've already submitted your report for today. Come back tomorrow for new quests!
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {/* In-progress quests */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <TrendingUpIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                color: '#2A2A2A',
                letterSpacing: '-0.02em'
              }}
            >
              In Progress
            </Typography>
            <Chip 
              label={inProgressQuests.length} 
              sx={{ 
                background: '#F59E0B', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Box>
          {inProgressQuests.length > 0 ? (
            <Grid container spacing={3}>
              {inProgressQuests.map((q, idx) => (
                <Grid item xs={12} sm={6} md={4} key={q.quest_id || q.id} sx={gridItemStyles}>
                  <Card sx={cardStyles}>
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      p: 3 
                    }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 2,
                            color: '#2A2A2A',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {q.quests?.title || q.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 3, 
                            flexGrow: 1, 
                            lineHeight: 1.6,
                            color: '#5A6570'
                          }}
                        >
                          {q.quests?.description || q.description}
                        </Typography>
                        <Chip 
                          label={`${q.quests?.elo_reward || q.elo_reward} ELO`}
                          sx={{ 
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#F59E0B',
                            fontWeight: 600
                          }}
                        />
                        <LinearProgress 
                          variant="determinate" 
                          value={q.progress * 100} 
                          sx={{ 
                            height: 8, 
                            borderRadius: '4px', 
                            mb: 3,
                            mt: 2,
                            '& .MuiLinearProgress-bar': {
                              background: '#F59E0B'
                            }
                          }} 
                        />
                      </Box>
                      <Box sx={{ mt: 'auto' }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button 
                            variant="contained" 
                            onClick={() => handleCompleteQuest(q.quest_id || q.id)} 
                            sx={{ 
                              flex: 1, 
                              borderRadius: '8px', 
                              fontWeight: 500,
                              background: '#83c441',
                              '&:hover': {
                                background: '#6ba336',
                                transform: 'scale(1.02)',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                              }
                            }}
                          >
                            Complete
                          </Button>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleAbandonQuest(q.quest_id || q.id)} 
                            sx={{ 
                              flex: 1, 
                              borderRadius: '8px', 
                              fontWeight: 500,
                              borderColor: '#EF4444',
                              color: '#EF4444',
                              '&:hover': {
                                background: '#EF4444',
                                color: '#fff',
                                borderColor: '#EF4444',
                              }
                            }}
                          >
                            Abandon
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: '2px dashed #E5E7EB'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <PlayArrowIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
                  No Active Quests
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  Accept a quest from the available section to get started on your journey!
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
        
        {/* Completed quests */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <TrophyIcon sx={{ color: '#83c441', fontSize: 28 }} />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                color: '#2A2A2A',
                letterSpacing: '-0.02em'
              }}
            >
              Completed Quests
            </Typography>
            <Chip 
              label={completedQuests.length} 
              sx={{ 
                background: '#83c441', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Box>
          {completedQuests.length > 0 ? (
            <Grid container spacing={3}>
              {completedQuests.map((q, idx) => (
                <Grid item xs={12} sm={6} md={4} key={q.quest_id || q.id} sx={gridItemStyles}>
                  <Card sx={{ ...cardStyles, opacity: 0.8 }}>
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      p: 3 
                    }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <CheckCircleIcon sx={{ color: '#83c441', fontSize: 20 }} />
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#2A2A2A',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {q.quests?.title || q.title}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 3, 
                            flexGrow: 1, 
                            lineHeight: 1.6,
                            color: '#5A6570'
                          }}
                        >
                          {q.quests?.description || q.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={`${q.quests?.elo_reward || q.elo_reward} ELO`}
                            size="small"
                            sx={{ 
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#83c441',
                              fontWeight: 600
                            }}
                          />
                          {q.date_completed && (
                            <Chip 
                              label={q.date_completed}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderColor: '#E5E7EB',
                                color: '#6B7280'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.5)',
              border: '2px dashed #E5E7EB'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#6B7280', mb: 1 }}>
                  No Completed Quests Yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  Complete your first quest to start building your achievement history!
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </>
    </Box>
  );
}

export default Quests;
