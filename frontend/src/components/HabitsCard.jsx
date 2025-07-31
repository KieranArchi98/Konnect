import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Checkbox,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { cacheUtils, CACHE_KEYS } from '../utils/cache.js';

function HabitsCard() {
  const [habits, setHabits] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newHabitText, setNewHabitText] = useState('');
  const [editingHabit, setEditingHabit] = useState(null);
  const [editText, setEditText] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load cached habits on mount and check for daily reset
  useEffect(() => {
    const cachedHabits = cacheUtils.get(CACHE_KEYS.HABITS) || [];
    const lastResetDate = cacheUtils.get(CACHE_KEYS.HABITS_LAST_RESET);
    const today = dayjs().format('YYYY-MM-DD');

    // Reset completion status if it's a new day
    if (lastResetDate !== today) {
      const resetHabits = cachedHabits.map(habit => ({
        ...habit,
        completed: false
      }));
      cacheUtils.set(CACHE_KEYS.HABITS, resetHabits);
      cacheUtils.set(CACHE_KEYS.HABITS_LAST_RESET, today);
      setHabits(resetHabits);
    } else {
      setHabits(cachedHabits);
    }
  }, []);

  // Save habits to cache whenever they change
  useEffect(() => {
    cacheUtils.set(CACHE_KEYS.HABITS, habits);
  }, [habits]);

  const handleAddHabit = () => {
    if (newHabitText.trim()) {
      const newHabit = {
        id: Date.now(),
        text: newHabitText.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setHabits([...habits, newHabit]);
      setNewHabitText('');
      setDialogOpen(false);
    }
  };

  const handleToggleComplete = (habitId) => {
    setHabits(habits.map(habit => 
      habit.id === habitId 
        ? { ...habit, completed: !habit.completed }
        : habit
    ));
  };

  const handleDeleteHabit = (habitId) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setEditText(habit.text);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingHabit) {
      setHabits(habits.map(habit => 
        habit.id === editingHabit.id 
          ? { ...habit, text: editText.trim() }
          : habit
      ));
      setEditDialogOpen(false);
      setEditingHabit(null);
      setEditText('');
    }
  };

  const completedCount = habits.filter(habit => habit.completed).length;
  const totalCount = habits.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
          alignItems: 'flex-start', 
          mb: { xs: 2, sm: 3 }
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <PsychologyIcon sx={{ 
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
                Habits
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6B7280',
                  fontWeight: 500
                }}
              >
                {completedCount} of {totalCount} completed today
              </Typography>
              {totalCount > 0 && (
                <Chip 
                  label={`${Math.round(progressPercentage)}%`}
                  size="small"
                  sx={{ 
                                         bgcolor: progressPercentage === 100 ? '#83c441' : '#F3F4F6',
                    color: progressPercentage === 100 ? '#fff' : '#6B7280',
                    fontSize: '10px',
                    height: '20px',
                    fontWeight: 600
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Progress bar */}
        {totalCount > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{
              width: '100%',
              height: '4px',
              bgcolor: '#F3F4F6',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <Box sx={{
                width: `${progressPercentage}%`,
                height: '100%',
                                 bgcolor: progressPercentage === 100 ? '#83c441' : '#6B7280',
                transition: 'width 0.3s ease',
                borderRadius: 2
              }} />
            </Box>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {habits.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              textAlign: 'center',
              minHeight: { xs: '120px', sm: '140px' }
            }}>
              <PsychologyIcon sx={{ 
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
                No habits yet
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ color: '#9CA3AF' }}
              >
                Click the button below to add your first habit
              </Typography>
            </Box>
          ) : (
            <List sx={{ 
              maxHeight: '100%', 
              overflow: 'auto', 
              py: 0,
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
              {habits.map((habit) => (
                <ListItem
                  key={habit.id}
                  sx={{
                    px: 0,
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(90, 101, 112, 0.02)',
                      borderRadius: 1
                    }
                  }}
                >
                  <Checkbox
                    checked={habit.completed}
                    onChange={() => handleToggleComplete(habit.id)}
                    icon={<CheckCircleIcon sx={{ color: '#D1D5DB' }} />}
                                         checkedIcon={<CheckCircleIcon sx={{ color: '#83c441' }} />}
                    sx={{ mr: 1 }}
                  />
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: habit.completed ? 'line-through' : 'none',
                          color: habit.completed ? '#9CA3AF' : '#2A2A2A',
                          cursor: 'pointer',
                          fontWeight: habit.completed ? 400 : 500,
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            color: habit.completed ? '#9CA3AF' : '#5A6570'
                          }
                        }}
                        onClick={() => handleEditHabit(habit)}
                      >
                        {habit.text}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteHabit(habit.id)}
                      sx={{ 
                        color: '#EF4444',
                        '&:hover': {
                          bgcolor: 'rgba(239, 68, 68, 0.1)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

                 {/* Add Button - Bottom */}
         <Button
           onClick={() => setDialogOpen(true)}
           variant="contained"
           fullWidth
           sx={{ 
             bgcolor: '#83c441',
             color: 'white',
             textTransform: 'none',
             fontWeight: 600,
             borderRadius: 2,
             py: { xs: 1.5, sm: 1.75, md: 2 },
             mt: { xs: 2, sm: 3 },
             '&:hover': { 
               bgcolor: '#6ba336',
               transform: 'translateY(-1px)',
               boxShadow: '0 4px 8px rgba(131, 196, 65, 0.3)'
             },
             transition: 'all 0.2s ease',
             fontSize: { xs: '14px', sm: '15px', md: '16px' },
             whiteSpace: 'nowrap',
             minHeight: { xs: '44px', sm: '48px', md: '52px' },
             maxHeight: { xs: '44px', sm: '48px', md: '52px' }
           }}
         >
           Add
         </Button>
      </CardContent>

      {/* Add Habit Dialog */}
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
           <PsychologyIcon sx={{ color: '#83c441' }} />
           Add New Habit
         </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Habit description"
            fullWidth
            variant="outlined"
            value={newHabitText}
            onChange={(e) => setNewHabitText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
            sx={{ 
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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
            onClick={handleAddHabit} 
            variant="contained"
            disabled={!newHabitText.trim()}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              bgcolor: '#83c441',
              '&:hover': { bgcolor: '#6ba336' },
              '&:disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
              borderRadius: 2,
              px: 3
            }}
          >
            Add Habit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Habit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
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
          <PsychologyIcon sx={{ color: '#5A6570' }} />
          Edit Habit
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Habit description"
            fullWidth
            variant="outlined"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
            sx={{ 
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: '#6B7280'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={!editText.trim()}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              bgcolor: '#5A6570',
              '&:hover': { bgcolor: '#4A5568' },
              '&:disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
              borderRadius: 2,
              px: 3
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default HabitsCard; 