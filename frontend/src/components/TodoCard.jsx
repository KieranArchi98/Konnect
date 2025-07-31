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
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { cacheUtils, CACHE_KEYS } from '../utils/cache.js';

function TodoCard() {
  const [todos, setTodos] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [editText, setEditText] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load cached todos on mount and check for daily reset
  useEffect(() => {
    const cachedTodos = cacheUtils.get(CACHE_KEYS.TODOS) || [];
    const lastResetDate = cacheUtils.get(CACHE_KEYS.TODOS_LAST_RESET);
    const today = dayjs().format('YYYY-MM-DD');

    // Clear todos if it's a new day
    if (lastResetDate !== today) {
      cacheUtils.set(CACHE_KEYS.TODOS, []);
      cacheUtils.set(CACHE_KEYS.TODOS_LAST_RESET, today);
      setTodos([]);
    } else {
      setTodos(cachedTodos);
    }
  }, []);

  // Save todos to cache whenever they change
  useEffect(() => {
    cacheUtils.set(CACHE_KEYS.TODOS, todos);
  }, [todos]);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const newTodo = {
        id: Date.now(),
        text: newTodoText.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTodos([...todos, newTodo]);
      setNewTodoText('');
      setDialogOpen(false);
    }
  };

  const handleToggleComplete = (todoId) => {
    setTodos(todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  };

  const handleDeleteTodo = (todoId) => {
    setTodos(todos.filter(todo => todo.id !== todoId));
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setEditText(todo.text);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingTodo) {
      setTodos(todos.map(todo => 
        todo.id === editingTodo.id 
          ? { ...todo, text: editText.trim() }
          : todo
      ));
      setEditDialogOpen(false);
      setEditingTodo(null);
      setEditText('');
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;
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
              <AssignmentIcon sx={{ 
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
                To-Do
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
                {completedCount} of {totalCount} completed
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
          {todos.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              textAlign: 'center',
              minHeight: { xs: '120px', sm: '140px' }
            }}>
              <AssignmentIcon sx={{ 
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
                No tasks yet
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ color: '#9CA3AF' }}
              >
                Click the button below to add your first task
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
              {todos.map((todo) => (
                <ListItem
                  key={todo.id}
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
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo.id)}
                    icon={<CheckCircleIcon sx={{ color: '#D1D5DB' }} />}
                                         checkedIcon={<CheckCircleIcon sx={{ color: '#83c441' }} />}
                    sx={{ mr: 1 }}
                  />
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          color: todo.completed ? '#9CA3AF' : '#2A2A2A',
                          cursor: 'pointer',
                          fontWeight: todo.completed ? 400 : 500,
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            color: todo.completed ? '#9CA3AF' : '#5A6570'
                          }
                        }}
                        onClick={() => handleEditTodo(todo)}
                      >
                        {todo.text}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteTodo(todo.id)}
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

      {/* Add Todo Dialog */}
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
          <AssignmentIcon sx={{ color: '#83c441' }} />
          Add New Task
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Task description"
            fullWidth
            variant="outlined"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
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
            onClick={handleAddTodo} 
            variant="contained"
            disabled={!newTodoText.trim()}
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
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Todo Dialog */}
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
          <EditIcon sx={{ color: '#8B5CF6' }} />
          Edit Task
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Task description"
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
              bgcolor: '#83c441',
              '&:hover': { bgcolor: '#6ba336' },
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

export default TodoCard; 