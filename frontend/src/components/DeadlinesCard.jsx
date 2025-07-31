import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Add as AddIcon, Clear as ClearIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { cacheUtils, CACHE_KEYS } from '../utils/cache.js';

function DeadlinesCard() {
  const [deadline, setDeadline] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [percentage, setPercentage] = useState(100);
  const [initialTimeRemaining, setInitialTimeRemaining] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load cached deadline on mount
  useEffect(() => {
    const cachedDeadline = cacheUtils.get(CACHE_KEYS.DEADLINE);
    if (cachedDeadline) {
      const deadlineDate = dayjs(cachedDeadline);
      setDeadline(deadlineDate);
      
      // Calculate initial time remaining when loading from cache
      const now = dayjs();
      const initialDiff = deadlineDate.diff(now);
      if (initialDiff > 0) {
        setInitialTimeRemaining(initialDiff);
      }
    }
  }, []);

  // Countdown timer with gauge calculation
  useEffect(() => {
    if (!deadline) {
      setCountdown('');
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setPercentage(100);
      setInitialTimeRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const now = dayjs();
      const diff = deadline.diff(now);

      if (diff <= 0) {
        setCountdown('EXPIRED');
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setPercentage(0);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });

      // Format countdown based on time remaining
      if (days > 0) {
        setCountdown(`${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      } else if (hours > 0) {
        setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      } else {
        setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }

      // Calculate percentage based on initial time remaining
      if (initialTimeRemaining > 0) {
        const calculatedPercentage = Math.max((diff / initialTimeRemaining) * 100, 0);
        setPercentage(calculatedPercentage);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline, initialTimeRemaining]);

  const handleSetDeadline = () => {
    const now = dayjs();
    const initialDiff = selectedDate.diff(now);
    
    setDeadline(selectedDate);
    setInitialTimeRemaining(initialDiff);
    setPercentage(100); // Start at 100%
    
    cacheUtils.set(CACHE_KEYS.DEADLINE, selectedDate.toISOString());
    setDialogOpen(false);
  };

  const handleClearDeadline = () => {
    setDeadline(null);
    setInitialTimeRemaining(0);
    setPercentage(100);
    cacheUtils.remove(CACHE_KEYS.DEADLINE);
  };

  const getTimeRemainingColor = () => {
    if (!deadline || countdown === 'EXPIRED') return '#EF4444';
    const now = dayjs();
    const diff = deadline.diff(now);
    const hoursRemaining = diff / (1000 * 60 * 60);
    
    if (hoursRemaining < 1) return '#EF4444'; // Red for less than 1 hour
    if (hoursRemaining < 24) return '#F97316'; // Orange for less than 24 hours
    if (hoursRemaining < 72) return '#EAB308'; // Yellow for less than 3 days
    return '#83c441'; // Green for more than 3 days
  };

  const getGaugeColor = () => {
    if (percentage <= 10) return '#EF4444'; // Red
    if (percentage <= 30) return '#F97316'; // Orange
    if (percentage <= 60) return '#EAB308'; // Yellow
    return '#83c441'; // Green
  };

  // Gauge chart data
  const gaugeData = [
    { value: percentage, color: getGaugeColor() },
    { value: 100 - percentage, color: '#F3F4F6' }
  ];

  return (
    <Card sx={{ 
      width: '100%', 
      height: '100%', 
      borderRadius: { xs: 2, sm: 3 }, 
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(229, 231, 235, 0.6)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      position: 'relative',
      '&:hover': {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transform: 'translateY(-2px)',
      },
    }} elevation={0}>
      
      {/* Decorative accent */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #83c441 0%, #9ed558 50%, #83c441 100%)',
        opacity: 0.8
      }} />

      <CardContent sx={{ 
        p: { xs: 2.5, sm: 3 }, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: { xs: 2, sm: 3 }
        }}>
          <TimeIcon sx={{ 
            color: '#83c441', 
            fontSize: { xs: '20px', sm: '24px' } 
          }} />
          <Typography 
            variant={isMobile ? "h6" : "h6"} 
            sx={{ 
              fontWeight: 700, 
              color: '#2A2A2A',
              letterSpacing: '-0.02em'
            }}
          >
            Deadlines
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          gap: 1
        }}>
          {deadline ? (
            <>
              {/* Gauge Chart */}
              <Box sx={{ 
                width: '100%', 
                height: { xs: '100px', sm: '120px' }, 
                position: 'relative'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="gaugeGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={gaugeData}
                      startAngle={180}
                      endAngle={0}
                      innerRadius={isMobile ? "60%" : "65%"}
                      outerRadius="100%"
                      dataKey="value"
                      stroke="none"
                      paddingAngle={1}
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          filter={index === 0 ? "url(#gaugeGlow)" : "none"}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Centered Countdown Timer */}
                <Box sx={{
                  position: 'absolute',
                  top: { xs: '55%', sm: '55%', md: '50%' },
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ 
                      fontWeight: 800, 
                      color: getTimeRemainingColor(),
                      fontFamily: 'monospace',
                      letterSpacing: { xs: 0.5, sm: 1 },
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {countdown === 'EXPIRED' ? 'EXPIRED' : countdown}
                  </Typography>
                </Box>

                {/* Clear Deadline Button - Overlaid */}
                <Box sx={{
                  position: 'absolute',
                  bottom: { xs: '-10px', sm: '-15px' },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1,
                  width: '100%'
                }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearDeadline}
                    fullWidth
                    sx={{ 
                      color: '#EF4444',
                      borderColor: '#EF4444',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      py: 0.5,
                      fontSize: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(4px)',
                      '&:hover': {
                        borderColor: '#DC2626',
                        backgroundColor: 'rgba(239, 68, 68, 0.04)'
                      }
                    }}
                  >
                    Clear Deadline
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <TimeIcon sx={{ 
                fontSize: { xs: '48px', sm: '56px' }, 
                color: '#D1D5DB', 
                mb: 2 
              }} />
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  mb: 1,
                  fontWeight: 500,
                  color: '#6B7280'
                }}
              >
                No deadline set
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ color: '#9CA3AF' }}
              >
                Click the button below to add a deadline
              </Typography>
            </Box>
          )}
        </Box>

        {/* Add Button - Bottom */}
        <Button
          onClick={() => setDialogOpen(true)}
          variant="contained"
          fullWidth
          sx={{ 
            bgcolor: '#5A6570',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: { xs: 1.5, sm: 1.75, md: 2 },
            mt: { xs: 1, sm: 2 },
            '&:hover': { 
              bgcolor: '#4A5568',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(90, 101, 112, 0.3)'
            },
            transition: 'all 0.2s ease',
            fontSize: { xs: '14px', sm: '15px', md: '16px' },
            whiteSpace: 'nowrap',
            minHeight: { xs: '44px', sm: '48px', md: '52px' },
            maxHeight: { xs: '44px', sm: '48px', md: '52px' }
          }}
        >
          Edit
        </Button>
      </CardContent>

      {/* Set Deadline Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          color: '#2A2A2A',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <TimeIcon sx={{ color: '#83c441' }} />
          Set Deadline
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Deadline Date & Time"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  sx={{ 
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#E5E7EB',
                      },
                                       '&:hover fieldset': {
                                    borderColor: '#83c441',
               },
               '&.Mui-focused fieldset': {
                 borderColor: '#83c441',
               },
                    },
                  }} 
                />
              )}
              minDateTime={dayjs()}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: '#6B7280'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSetDeadline} 
            variant="contained"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              bgcolor: '#83c441',
              '&:hover': { bgcolor: '#6ba336' },
              borderRadius: 2,
              px: 3
            }}
          >
            Set Deadline
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default DeadlinesCard; 