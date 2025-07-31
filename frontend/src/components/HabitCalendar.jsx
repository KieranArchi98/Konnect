import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';
import { cacheUtils, CACHE_KEYS } from '../utils/cache.js';

function HabitCalendar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [habitData, setHabitData] = useState({});
  const [currentHabits, setCurrentHabits] = useState([]);

  // Load current habits and historical habit data
  useEffect(() => {
    // Load current habits from cache
    const cachedHabits = cacheUtils.get(CACHE_KEYS.HABITS) || [];
    setCurrentHabits(cachedHabits);

    // Load historical habit data from localStorage
    const savedData = localStorage.getItem('habitCalendarData');
    if (savedData) {
      setHabitData(JSON.parse(savedData));
    }
  }, []);

  // Save habit data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('habitCalendarData', JSON.stringify(habitData));
  }, [habitData]);

  // Update habit data when current habits change (from HabitsCard)
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayKey = today;
    
    // Calculate completion for today based on current habits
    const completedCount = currentHabits.filter(habit => habit.completed).length;
    const totalCount = currentHabits.length;
    
    if (totalCount > 0) {
      setHabitData(prev => ({
        ...prev,
        [todayKey]: {
          completed: completedCount,
          total: totalCount,
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  }, [currentHabits]);

  // Listen for daily reset and save completion data before reset
  useEffect(() => {
    const checkDailyReset = () => {
      const lastResetDate = cacheUtils.get(CACHE_KEYS.HABITS_LAST_RESET);
      const today = dayjs().format('YYYY-MM-DD');
      
      // If it's a new day and we have habits, save yesterday's completion data
      if (lastResetDate && lastResetDate !== today && currentHabits.length > 0) {
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        const completedCount = currentHabits.filter(habit => habit.completed).length;
        const totalCount = currentHabits.length;
        
        setHabitData(prev => ({
          ...prev,
          [yesterday]: {
            completed: completedCount,
            total: totalCount,
            lastUpdated: new Date().toISOString()
          }
        }));
      }
    };

    // Check immediately
    checkDailyReset();

    // Set up interval to check every minute
    const interval = setInterval(checkDailyReset, 60000);

    return () => clearInterval(interval);
  }, [currentHabits]);

  // Get days in current month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    return { daysInMonth, firstDayOfMonth };
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentMonth);
    const grid = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push({ day: null, data: null });
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = habitData[dateKey] || { completed: 0, total: 0 };
      grid.push({ day, data: dayData, dateKey });
    }
    
    return grid;
  };

  // Calculate success rate and get color
  const getSuccessRateAndColor = (data) => {
    if (!data || data.total === 0) return { rate: 0, color: '#E5E7EB' }; // Gray for no data
    
    const rate = (data.completed / data.total) * 100;
    
    if (rate >= 80) return { rate, color: '#83c441' }; // Green
    if (rate >= 50) return { rate, color: '#F59E0B' }; // Orange
    return { rate, color: '#EF4444' }; // Red
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Get month name
  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Get tooltip content
  const getTooltipContent = (day, data) => {
    if (!day || !data) return 'No data';
    
    const { rate } = getSuccessRateAndColor(data);
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (data.total === 0) {
      return `${dateStr}\nNo habits tracked`;
    }
    
    return `${dateStr}\n${data.completed}/${data.total} habits completed\n${rate.toFixed(0)}% success rate`;
  };

  // Check if a day is today
  const isToday = (day) => {
    const today = dayjs();
    const dayDate = dayjs(currentMonth).date(day);
    return today.isSame(dayDate, 'day');
  };

  const calendarGrid = generateCalendarGrid();
  const monthName = getMonthName(currentMonth);

  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: { xs: 2, sm: 3 },
        border: '1px solid rgba(229, 231, 235, 0.6)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transform: 'translateY(-2px)',
        },
      }}
      className="business-card"
    >
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
        {/* Header - Hide on medium and small screens */}
        {isLargeScreen && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: { xs: 2, sm: 3 },
            pb: 2,
            borderBottom: '1px solid rgba(229, 231, 235, 0.6)'
          }}>
            <Box sx={{ 
              width: { xs: 36, sm: 40 }, 
              height: { xs: 36, sm: 40 }, 
              background: 'linear-gradient(135deg, #5A6570 0%, #9CA3AF 100%)',
              borderRadius: { xs: '8px', sm: '10px' },
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(90, 101, 112, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 6px 16px rgba(90, 101, 112, 0.6)'
              }
            }}>
              <CalendarMonthIcon />
            </Box>
            <Typography 
              variant={isMobile ? "h6" : "h6"} 
              sx={{ 
                fontWeight: 600, 
                color: '#2A2A2A',
                letterSpacing: '-0.02em',
                flex: 1
              }}
            >
              Habit Tracker
            </Typography>
          </Box>
        )}

        {/* Month Navigation */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: { xs: 2, sm: 3 }
        }}>
          <Box 
            onClick={goToPreviousMonth}
            sx={{ 
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(90, 101, 112, 0.1)',
                transform: 'translateX(-2px)'
              }
            }}
          >
            <Typography variant="h6" sx={{ color: '#5A6570', fontWeight: 600 }}>‹</Typography>
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#2A2A2A',
              textAlign: 'center'
            }}
          >
            {monthName}
          </Typography>
          
          <Box 
            onClick={goToNextMonth}
            sx={{ 
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(90, 101, 112, 0.1)',
                transform: 'translateX(2px)'
              }
            }}
          >
            <Typography variant="h6" sx={{ color: '#5A6570', fontWeight: 600 }}>›</Typography>
          </Box>
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Day headers */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5, 
            mb: 1 
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Typography 
                key={day}
                variant="caption" 
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 600, 
                  color: '#6B7280',
                  fontSize: { xs: '10px', sm: '11px' },
                  py: 0.5
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendar days */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: 0.5,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#F3F4F6',
              borderRadius: '2px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#D1D5DB',
              borderRadius: '2px',
            },
          }}>
            {calendarGrid.map((cell, index) => {
              const { rate, color } = getSuccessRateAndColor(cell.data);
              const isCurrentDay = isToday(cell.day);
              
              return (
                <Tooltip 
                  key={index}
                  title={getTooltipContent(cell.day, cell.data)}
                  arrow
                  placement="top"
                >
                  <Box
                    sx={{
                      aspectRatio: '1',
                      borderRadius: 1,
                      background: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      border: isCurrentDay ? '2px solid #5A6570' : '1px solid rgba(229, 231, 235, 0.3)',
                      position: 'relative',
                      opacity: cell.day ? 1 : 0.3
                    }}
                  >
                    {cell.day && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: color === '#E5E7EB' ? '#9CA3AF' : '#fff',
                          fontWeight: 600,
                          fontSize: { xs: '10px', sm: '11px' },
                          textShadow: color !== '#E5E7EB' ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                        }}
                      >
                        {cell.day}
                      </Typography>
                    )}
                    {/* Today indicator */}
                    {isCurrentDay && (
                      <Box sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#5A6570',
                        border: '1px solid #fff'
                      }} />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ 
          mt: { xs: 2, sm: 3 }, 
          pt: 2, 
          borderTop: '1px solid rgba(229, 231, 235, 0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 1, background: '#83c441' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: { xs: '9px', sm: '10px' } }}>
              Excellent (80%+)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 1, background: '#F59E0B' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: { xs: '9px', sm: '10px' } }}>
              Good (50%+)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: 1, background: '#EF4444' }} />
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: { xs: '9px', sm: '10px' } }}>
              Needs Work
            </Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          mt: { xs: 2, sm: 3 }, 
          pt: 2, 
          borderTop: '1px solid rgba(229, 231, 235, 0.6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#9CA3AF',
              fontSize: { xs: '10px', sm: '11px' },
              fontWeight: 500
            }}
          >
            Today: {currentHabits.filter(h => h.completed).length}/{currentHabits.length} habits
          </Typography>
          <Box sx={{ 
            background: '#83c441',
            color: '#fff',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: { xs: '9px', sm: '10px' },
            fontWeight: 600
          }}>
            Auto
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default HabitCalendar; 