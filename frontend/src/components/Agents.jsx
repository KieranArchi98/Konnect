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
  Divider,
  Grid,
  Avatar,
  Fade,
  Zoom,
  Slide,
  Grow
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
  TrendingUp as TrendingIcon,
  Lightbulb as IdeasIcon,
  FormatQuote as QuoteIcon,
  Send as SendIcon,
  Close as CloseIcon,
  FlashOn,
  LocalFireDepartment,
  Star
} from '@mui/icons-material';
import axios from 'axios';
import AgentControl from './AgentControl.jsx';
import gsap from 'gsap';
import { getAgentName } from '../utils/agentConstants.js';
import { useAuth } from '../context/AuthContext.jsx';

// Agent configurations with modern styling
const AGENT_CONFIGS = {
  1: {
    id: 1,
    name: 'Email Agent',
    description: 'Compose and send professional emails',
    color: '#83c441',
    gradient: 'linear-gradient(135deg, #83c441 0%, #6ba336 100%)',
    icon: 'Email',
    avatar: 'Email',
    capabilities: ['Email Composition', 'Tone Control', 'Professional Writing']
  },
  8: {
    id: 8,
    name: 'Ideas Agent',
    description: 'Generate innovative app and website ideas',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    icon: 'Lightbulb',
    avatar: 'Lightbulb',
    capabilities: ['Idea Generation', 'Innovation', 'Creative Thinking']
  },
  5: {
    id: 5,
    name: 'Quote Agent',
    description: 'Generate inspirational quotes',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    icon: 'FormatQuote',
    avatar: 'FormatQuote',
    capabilities: ['Quote Generation', 'Inspiration', 'Motivation']
  },
  X: {
    id: 'X',
    name: 'Agent X',
    description: 'Placeholder agent for future development',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    icon: 'FlashOn',
    avatar: 'FlashOn',
    capabilities: ['Placeholder', 'Future Feature', 'Coming Soon']
  },
  Y: {
    id: 'Y',
    name: 'Agent Y',
    description: 'Placeholder agent for future development',
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    icon: 'LocalFireDepartment',
    avatar: 'LocalFireDepartment',
    capabilities: ['Placeholder', 'Future Feature', 'Coming Soon']
  },
  Z: {
    id: 'Z',
    name: 'Agent Z',
    description: 'Placeholder agent for future development',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    icon: 'Star',
    avatar: 'Star',
    capabilities: ['Placeholder', 'Future Feature', 'Coming Soon']
  }
};

function Agents() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAgentControl, setShowAgentControl] = useState(false);
  const tasksRef = useRef();
  const agentsRef = useRef();
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
    
    // GSAP animations for agents grid
    if (agentsRef.current) {
      gsap.fromTo(agentsRef.current.children, 
        { 
          opacity: 0, 
          y: 20,
          scale: 0.9
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "back.out(1.4)"
        }
      );
    }

    // GSAP animations for tasks
    if (tasksRef.current) {
      gsap.fromTo(tasksRef.current.children, 
        { 
          opacity: 0, 
          x: -30,
          scale: 0.95
        },
        { 
          opacity: 1, 
          x: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
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

  const handleAgentSelect = (agentId) => {
    setSelectedAgent(agentId);
    setShowAgentControl(true);
    
    // Smooth scroll to agent control
    setTimeout(() => {
      const agentControlElement = document.getElementById('agent-control');
      if (agentControlElement) {
        agentControlElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const handleTaskAssigned = (taskData) => {
    console.log(`[AGENTS] Task assigned:`, taskData);
    const normalizedTaskData = {
      ...taskData,
      status: taskData.status?.toLowerCase() || 'assigned'
    };
    console.log(`[AGENTS] Normalized task data:`, normalizedTaskData);
    setTasks(prev => [...prev, normalizedTaskData]);
    
    // Animate the new task
    setTimeout(() => {
      const newTaskElement = document.querySelector(`[data-task-id="${taskData.task_id}"]`);
      if (newTaskElement) {
        gsap.fromTo(newTaskElement,
          { 
            opacity: 0, 
            scale: 0.8,
            y: -20
          },
          { 
            opacity: 1, 
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
          }
        );
      }
    }, 100);
  };

  const handleTaskConfirmed = (taskData) => {
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
      const task = tasks.find(t => t.task_id === taskId);
      if (!task) return;

      const res = await axios.post(`${backendUrl}/agents/send_email`, {
        email: task.email,
        preview: task.output,
        agent_id: task.agent_id,
        user_input: task.input,
        task_id: task.task_id,
        tone_level: task.tone_level || 3
      }, { headers: getAuthHeaders() });

      if (res.data.status === 'completed') {
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
      case 'completed': return '#10B981';
      case 'assigned': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      case 'running': return '#3B82F6';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
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

  const getAgentIcon = (iconName) => {
    switch (iconName) {
      case 'Email':
        return <EmailIcon />;
      case 'Lightbulb':
        return <IdeasIcon />;
      case 'FormatQuote':
        return <QuoteIcon />;
      case 'FlashOn':
        return <FlashOn />;
      case 'LocalFireDepartment':
        return <LocalFireDepartment />;
      case 'Star':
        return <Star />;
      default:
        return <AgentIcon />;
    }
  };

  const getAgentConfig = (agentId) => {
    return AGENT_CONFIGS[agentId] || {
      name: 'Unknown Agent',
      color: '#6B7280',
      gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      icon: '🤖'
    };
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

      {/* Agent Control with Integrated Agent Selection */}
      <AgentControl 
        onTaskAssigned={handleTaskAssigned}
        onTaskConfirmed={handleTaskConfirmed}
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        agentConfigs={AGENT_CONFIGS}
        agentsRef={agentsRef}
      />

      {/* Task List */}
      <Card sx={{ 
        borderRadius: '16px', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(229, 231, 235, 0.5)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
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
              label={`${tasks.filter(task => task.agent_id !== 5 && task.agent_id !== 8).length} Tasks`} 
              sx={{ 
                background: '#F59E0B', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Box>
          
          {tasks.filter(task => task.agent_id !== 5 && task.agent_id !== 8).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AgentIcon sx={{ fontSize: 64, color: '#9CA3AF', mb: 3 }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#6B7280', 
                  mb: 2 
                }}
              >
                No Active Tasks
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#9CA3AF',
                  maxWidth: 400,
                  mx: 'auto'
                }}
              >
                Select an agent above to start creating tasks and managing your AI workforce.
              </Typography>
            </Box>
          ) : (
            <List ref={tasksRef} sx={{ p: 0 }}>
              {tasks
                .filter(task => task.agent_id !== 5 && task.agent_id !== 8) // Exclude Quote Agent (5) and Ideas Agent (8)
                .sort((a, b) => {
                  // Sort by status priority: assigned > in_progress > completed > cancelled
                  const statusPriority = { 'assigned': 0, 'in_progress': 1, 'completed': 2, 'cancelled': 3 };
                  const aPriority = statusPriority[a.status] || 4;
                  const bPriority = statusPriority[b.status] || 4;
                  
                  if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                  }
                  
                  // Within same status, sort by creation date (most recent first)
                  const aDate = new Date(a.created_at || a.date_created || 0);
                  const bDate = new Date(b.created_at || b.date_created || 0);
                  return bDate - aDate;
                })
                .slice(0, 10) // Show only 10 most recent tasks
                .map((task) => {
                const agentConfig = getAgentConfig(task.agent_id);
                return (
                  <ListItem 
                    key={task.task_id}
                    data-task-id={task.task_id}
                    sx={{ 
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      mb: 2,
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {/* Main Content */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      width: '100%',
                      mb: 2
                    }}>
                      {/* Left Side - Task Info */}
                      <Box sx={{ flex: 1, mr: 3 }}>
                        {/* Agent Type */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              background: agentConfig.gradient,
                              mr: 1.5,
                              fontSize: '14px',
                              '& .MuiSvgIcon-root': {
                                color: 'white',
                                fontSize: '16px'
                              }
                            }}
                          >
                            {getAgentIcon(agentConfig.icon)}
                          </Avatar>
                          <Typography variant="body1" sx={{ 
                            fontWeight: 600, 
                            color: agentConfig.color
                          }}>
                            {agentConfig.name}
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                        {/* Status */}
                        <Chip 
                          label={getStatusLabel(task.status)} 
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            background: getStatusColor(task.status),
                            color: 'white',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            '& .MuiChip-label': {
                              color: 'white',
                              fontWeight: 600
                            }
                          }}
                        />
                        
                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {task.status === 'assigned' && (
                            <>
                              <IconButton 
                                onClick={() => handleConfirmTask(task.task_id)}
                                size="small"
                                sx={{ 
                                  background: '#10B981',
                                  color: 'white',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': { 
                                    background: '#059669',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                                  }
                                }}
                                title="Send Email"
                              >
                                <SendIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                onClick={() => handleCancelTask(task.task_id)}
                                size="small"
                                sx={{ 
                                  background: '#EF4444',
                                  color: 'white',
                                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': { 
                                    background: '#DC2626',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                                  }
                                }}
                                title="Cancel Task"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          <IconButton 
                            onClick={() => handleViewTask(task)}
                            size="small"
                            sx={{ 
                              background: '#3B82F6',
                              color: 'white',
                              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                              transition: 'all 0.3s ease',
                              '&:hover': { 
                                background: '#2563EB',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                              }
                            }}
                            title="View Details"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
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
        TransitionComponent={Slide}
        transitionDuration={300}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <TaskIcon sx={{ color: 'primary.main' }} />
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
                  <strong>Agent:</strong> {getAgentConfig(selectedTask.agent_id).name}
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
