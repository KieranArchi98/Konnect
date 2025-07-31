import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Email as EmailIcon,
  CheckCircle as ConfirmIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  SmartToy as AgentIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import axios from 'axios';
import AgentControl from './AgentControl.jsx';
import gsap from 'gsap';
import { getAgentName } from '../utils/agentConstants.js';
import { useAuth } from '../context/AuthContext.jsx';

function Agents() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const tasksRef = useRef();
  const { user } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
    
    // GSAP animations
    if (tasksRef.current) {
      gsap.fromTo(tasksRef.current.children, 
        { 
          opacity: 0, 
          y: 30,
          scale: 0.95
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${backendUrl}/agents/tasks`, { headers: getAuthHeaders() });
      setTasks(response.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const handleTaskAssigned = (taskData) => {
    // Ensure status is lowercase for consistency
    const normalizedTaskData = {
      ...taskData,
      status: taskData.status?.toLowerCase() || 'assigned'
    };
    setTasks(prev => [...prev, normalizedTaskData]);
  };

  const handleTaskConfirmed = (taskData) => {
    // Ensure status is lowercase for consistency
    const normalizedTaskData = {
      ...taskData,
      status: taskData.status?.toLowerCase() || 'completed'
    };
    setTasks(prev => prev.map(task => 
      task.task_id === taskData.task_id ? { ...task, ...normalizedTaskData } : task
    ));
  };

  const handleConfirmTask = async (taskId) => {
    try {
      // Find the task to get its details
      const task = tasks.find(t => t.task_id === taskId);
      if (!task) return;

      // Call the send email endpoint
      const res = await axios.post(`${backendUrl}/agents/send_email`, {
        email: task.email,
        preview: task.output,
        agent_id: task.agent_id,
        user_input: task.input,
        task_id: task.task_id,
        tone_level: task.tone_level || 3
      }, { headers: getAuthHeaders() });

      if (res.data.status === 'completed') {
        // Update task status
        setTasks(prev => prev.map(t => 
          t.task_id === taskId ? { ...t, status: 'completed' } : t
        ));
      }
    } catch (err) {
      console.error('Error confirming task:', err);
    }
  };

  const handleCancelTask = async (taskId) => {
    try {
      // Update task status to cancelled
      setTasks(prev => prev.map(t => 
        t.task_id === taskId ? { ...t, status: 'cancelled' } : t
      ));
    } catch (err) {
      console.error('Error cancelling task:', err);
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTask(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'assigned': return 'warning';
      case 'cancelled': return 'error';
      case 'running': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'assigned': return 'Assigned';
      case 'cancelled': return 'Cancelled';
      case 'running': return 'Running';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const getToneLabel = (toneLevel) => {
    switch (toneLevel) {
      case 1: return 'Very Informal';
      case 2: return 'Informal';
      case 3: return 'Neutral';
      case 4: return 'Professional';
      case 5: return 'Very Professional';
      default: return 'Unknown';
    }
  };

  const getAgentIcon = (agentId) => {
    switch (agentId) {
      case 1: return <EmailIcon sx={{ fontSize: 16, mr: 1, color: '#83c441' }} />;
      case 4: return <StartIcon sx={{ fontSize: 16, mr: 1, color: '#EF4444' }} />;
      case 5: return <TrendingIcon sx={{ fontSize: 16, mr: 1, color: '#06B6D4' }} />;
      case 6: return <AgentIcon sx={{ fontSize: 16, mr: 1, color: '#84CC16' }} />;
      case 7: return <TaskIcon sx={{ fontSize: 16, mr: 1, color: '#F97316' }} />;
      default: return <AgentIcon sx={{ fontSize: 16, mr: 1, color: '#6B7280' }} />;
    }
  };

  const getAgentColor = (agentId) => {
    switch (agentId) {
      case 1: return '#83c441'; // Email Agent - Green
      case 4: return '#EF4444'; // Oracle Agent - Red
      case 5: return '#06B6D4'; // Quote Agent - Cyan
      case 6: return '#84CC16'; // Research Agent - Lime
      case 7: return '#F97316'; // Assistant Agent - Orange
      default: return '#6B7280'; // Default - Gray
    }
  };

  return (
    <Box sx={{ 
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
          <AgentIcon sx={{ fontSize: 32, color: '#5A6570' }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 600, 
              color: '#2A2A2A', 
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            AI Agents
          </Typography>
        </Box>
        
        <Chip
          icon={<TaskIcon />}
          label={`${tasks.length} Active Tasks`}
          sx={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #E5E7EB',
            fontWeight: 500,
            color: '#5A6570'
          }}
        />
      </Box>
      
      <AgentControl 
        onTaskAssigned={handleTaskAssigned}
        onTaskConfirmed={handleTaskConfirmed}
      />

      <Card sx={{ 
        borderRadius: '12px', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(229, 231, 235, 0.5)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <TaskIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: '#2A2A2A',
                letterSpacing: '-0.02em'
              }}
            >
              Task List
            </Typography>
            <Chip 
              label={tasks.length} 
              sx={{ 
                background: '#F59E0B', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Box>
          
          {tasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AgentIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#6B7280', 
                  mb: 1 
                }}
              >
                No Active Tasks
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#9CA3AF'
                }}
              >
                Use the form above to assign a task to an agent.
              </Typography>
            </Box>
          ) : (
            <List ref={tasksRef}>
              {tasks.map((task) => (
                <ListItem 
                  key={task.task_id} 
                  sx={{ 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    mb: 1,
                    background: '#fff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }}
                >
                  {/* Main Content */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    width: '100%',
                    mb: 1
                  }}>
                    {/* Left Side - Task Info */}
                    <Box sx={{ flex: 1, mr: 2 }}>
                      {/* Agent Type */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getAgentIcon(task.agent_id)}
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: getAgentColor(task.agent_id)
                        }}>
                          {getAgentName(task.agent_id)}
                        </Typography>
                      </Box>
                      
                      {/* Email Address */}
                      {task.email && (
                        <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                          📧 {task.email}
                        </Typography>
                      )}
                      
                      {/* Email Subject */}
                      {task.subject && (
                        <Typography variant="body2" sx={{ mb: 0.5, color: 'text.primary', fontWeight: 500 }}>
                          📝 {task.subject}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Right Side - Status and Actions */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      {/* Status */}
                      <Chip 
                        label={getStatusLabel(task.status)} 
                        color={getStatusColor(task.status)}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          background: task.status === 'assigned' 
                            ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                            : task.status === 'completed'
                            ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                            : task.status === 'cancelled'
                            ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                            : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                          color: 'white',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          '& .MuiChip-label': {
                            color: 'white',
                            fontWeight: 600
                          }
                        }}
                      />
                      
                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {task.status === 'assigned' && (
                          <>
                            <IconButton 
                              onClick={() => handleConfirmTask(task.task_id)}
                              size="small"
                              sx={{ 
                                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                  background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                                }
                              }}
                              title="Send Email"
                            >
                              <ConfirmIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleCancelTask(task.task_id)}
                              size="small"
                              sx={{ 
                                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                  background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)'
                                }
                              }}
                              title="Cancel Task"
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        <IconButton 
                          onClick={() => handleViewTask(task)}
                          size="small"
                          sx={{ 
                            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                            transition: 'all 0.3s ease',
                            '&:hover': { 
                              background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
                            }
                          }}
                          title="View Details"
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          color: 'primary.main'
        }}>
          Task Details
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, background: '#F8F9FA' }}>
          {selectedTask && (
            <Box>
              {/* Email Agent Specific Layout */}
              {selectedTask.agent_id === 1 ? (
                <>
                  {/* Email and Subject */}
                  <Box sx={{ mb: 3 }}>
                    {selectedTask.email && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                          📧 Email Address
                        </Typography>
                        <Typography variant="body1" sx={{ p: 2, background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                          {selectedTask.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedTask.subject && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                          📝 Subject
                        </Typography>
                        <Typography variant="body1" sx={{ p: 2, background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                          {selectedTask.subject}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {/* Formatted Email Content */}
                  {selectedTask.output && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                        ✉️ Email Content
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          p: 2, 
                          background: '#fff', 
                          borderRadius: '8px', 
                          border: '1px solid #E5E7EB',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '14px'
                        }}
                      >
                        {selectedTask.output}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Tone Information */}
                  {selectedTask.tone_level && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                        🎨 Tone Level
                      </Typography>
                      <Typography variant="body1" sx={{ p: 2, background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        Level {selectedTask.tone_level} - {getToneLabel(selectedTask.tone_level)}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                /* Default Layout for Other Agents */
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Input:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, p: 2, background: '#F8F9FA', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    {selectedTask.input}
                  </Typography>
                  
                  {selectedTask.output && (
                    <>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Output:
                      </Typography>
                      <Typography variant="body1" sx={{ p: 2, background: '#F8F9FA', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        {selectedTask.output}
                      </Typography>
                    </>
                  )}
                </>
              )}
              
              {/* Standard Task Details */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E5E7EB' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Agent:</strong> {getAgentName(selectedTask.agent_id)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {selectedTask.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Task ID:</strong> {selectedTask.task_id}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Agents;
