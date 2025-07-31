import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  MenuItem, 
  Select, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Grid
} from '@mui/material';
import PropTypes from 'prop-types';
import axios from 'axios';
import ToneSlider from './ToneSlider.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  EMAIL_AGENT_ID, 
  EMAIL_AGENT_NAME,
  IDEAS_AGENT_ID,
  IDEAS_AGENT_NAME,
  isEmailAgent,
  isIdeasAgent
} from '../utils/agentConstants';

// Extended agent definitions with placeholder agents
const AGENT_CONFIGS = {
  1: {
    id: 1,
    name: 'Email Agent',
    description: 'Compose and send professional emails with customizable tone',
    color: '#83c441',
    icon: '📧',
    inputType: 'email',
    fields: ['email', 'subject', 'content', 'tone']
  },
  8: {
    id: 8,
    name: 'Ideas Agent',
    description: 'Generate innovative app and website ideas based on your input',
    color: '#8B5CF6',
    icon: '💡',
    inputType: 'ideas',
    fields: ['command']
  },
  5: {
    id: 5,
    name: 'Quote Agent',
    description: 'Generate inspirational quotes from influential people throughout history',
    color: '#06B6D4',
    icon: '💭',
    inputType: 'quote',
    fields: ['quote_type']
  }
};

function AgentControl({ onTaskAssigned, onTaskConfirmed }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [status, setStatus] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [emailPreview, setEmailPreview] = useState(null);
  const [previewEmail, setPreviewEmail] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewAgentId, setPreviewAgentId] = useState(null);
  const [previewUserInput, setPreviewUserInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState(null);
  const [toneLevel, setToneLevel] = useState(3);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Dynamic form fields based on agent type
  const [formFields, setFormFields] = useState({});
  
  // Quote Agent specific state
  const [currentQuote, setCurrentQuote] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [previousQuote, setPreviousQuote] = useState('');
  const [previousQuoteAuthor, setPreviousQuoteAuthor] = useState('');
  
  // Ideas Agent specific state
  const [currentIdeas, setCurrentIdeas] = useState([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [lastGeneratedInput, setLastGeneratedInput] = useState('');
  
  const { user } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (user) {
      // Create extended agents list with placeholder agents
      const extendedAgents = [
        { id: 1, name: 'Email Agent', user_selectable: true },
        { id: 8, name: 'Ideas Agent', user_selectable: true },
        { id: 5, name: 'Quote Agent', user_selectable: true }
      ];
      setAgents(extendedAgents);
      if (extendedAgents.length > 0) {
        setSelectedAgent(extendedAgents[0].id);
      }
    }
  }, [user]);

  // Generate quote when Quote Agent is selected
  useEffect(() => {
    if (selectedAgent === 5) {
      generateQuote();
    }
  }, [selectedAgent]);

  // Generate quote when quote type changes
  useEffect(() => {
    if (selectedAgent === 5 && formFields.quote_type) {
      generateQuote();
    }
  }, [formFields.quote_type]);

  // Clear ideas when switching away from Ideas Agent
  useEffect(() => {
    if (selectedAgent !== 8) {
      setCurrentIdeas([]);
      setLastGeneratedInput('');
    }
    if (selectedAgent !== 5) {
      setCurrentQuote('');
      setQuoteAuthor('');
      setPreviousQuote('');
      setPreviousQuoteAuthor('');
    }
  }, [selectedAgent]);

  const selectedAgentConfig = AGENT_CONFIGS[selectedAgent];

  const getInputPlaceholder = (agentId) => {
    switch (agentId) {
      case 1: return "Enter command (e.g. 'Send an email to john@example.com: Let's meet tomorrow') OR leave blank to use specific fields below";
      case 8: return "Enter a topic or area to generate innovative app/website ideas (e.g. 'productivity tools', 'health and wellness', 'education')";
      case 5: return "Select quote type to generate inspirational quotes";
      default: return "Enter command for this agent";
    }
  };

  const generateQuote = async () => {
    setIsGeneratingQuote(true);
    setError('');
    
    try {
      // Store current quote as previous quote before generating new one
      if (currentQuote) {
        setPreviousQuote(currentQuote);
        setPreviousQuoteAuthor(quoteAuthor);
      }
      
      const quoteType = formFields.quote_type || 'motivation';
      const res = await axios.post(`${backendUrl}/agents/generate_quote`, {
        quote_type: quoteType
      }, { headers: getAuthHeaders() });
      
      if (res.data.status === 'success' && res.data.quote && res.data.author) {
        setCurrentQuote(res.data.quote);
        setQuoteAuthor(res.data.author);
      } else {
        setError(res.data.error || 'Failed to generate quote. Please try again.');
      }
    } catch (err) {
      setError('Failed to generate quote. Please try again.');
      console.error('Error generating quote:', err);
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const generateIdeas = async () => {
    setIsGeneratingIdeas(true);
    setError('');
    
    try {
      const res = await axios.post(`${backendUrl}/agents/generate_ideas`, {
        command: taskInput
      }, { headers: getAuthHeaders() });
      
      if (res.data && Array.isArray(res.data)) {
        setCurrentIdeas(res.data);
        setLastGeneratedInput(taskInput.trim());
      } else {
        setError('Failed to generate ideas. Please try again.');
      }
    } catch (err) {
      setError('Failed to generate ideas. Please try again.');
      console.error('Error generating ideas:', err);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleGenerateNewQuote = () => {
    generateQuote();
  };

  const renderDynamicFields = () => {
    if (!selectedAgentConfig) return null;

    switch (selectedAgentConfig.inputType) {
      case 'email':
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Option 1: Use the command box above for AI to parse email details
                <br />
                Option 2: Use the specific fields below for more control
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                placeholder="recipient@example.com"
                size="small"
                value={formFields.email || ''}
                onChange={(e) => setFormFields({...formFields, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject Line"
                placeholder="Email subject (optional - will be auto-generated if blank)"
                size="small"
                value={formFields.subject || ''}
                onChange={(e) => setFormFields({...formFields, subject: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Content"
                placeholder="Enter email content here (optional - will use command input if blank)"
                multiline
                rows={4}
                size="small"
                value={formFields.content || ''}
                onChange={(e) => setFormFields({...formFields, content: e.target.value})}
              />
            </Grid>
          </Grid>
        );

      case 'ideas':
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Enter a command to generate innovative app and website ideas
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                textAlign: 'center', 
                py: 4, 
                px: 3,
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {isGeneratingIdeas ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={40} sx={{ color: '#8B5CF6' }} />
                    <Typography variant="body1" sx={{ color: '#6B7280' }}>
                      Generating innovative ideas...
                    </Typography>
                  </Box>
                ) : currentIdeas.length > 0 ? (
                  <Box sx={{ width: '100%' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#8B5CF6',
                        mb: 3,
                        textAlign: 'center'
                      }}
                    >
                      Generated Ideas
                    </Typography>
                    <Grid container spacing={2}>
                      {currentIdeas.map((ideaObj, index) => {
                        const idea = typeof ideaObj === 'string' ? ideaObj : ideaObj.idea || ideaObj;
                        const difficulty = typeof ideaObj === 'object' ? ideaObj.difficulty || 3 : 3;
                        const value = typeof ideaObj === 'object' ? ideaObj.value || 3 : 3;
                        
                        // Dynamic color functions
                        const getDifficultyColor = (score) => {
                          if (score <= 1) return '#22C55E'; // Green
                          if (score <= 2) return '#4ADE80'; // Light green
                          if (score <= 3) return '#F59E0B'; // Orange
                          if (score <= 4) return '#EF4444'; // Red
                          return '#DC2626'; // Dark red
                        };
                        
                        const getValueColor = (score) => {
                          if (score <= 1) return '#DC2626'; // Red
                          if (score <= 2) return '#EF4444'; // Light red
                          if (score <= 3) return '#F59E0B'; // Orange
                          if (score <= 4) return '#4ADE80'; // Light green
                          return '#22C55E'; // Green
                        };
                        
                        return (
                          <Grid item xs={12} md={6} key={index}>
                            <Box sx={{
                              p: 2,
                              background: 'rgba(139, 92, 246, 0.1)',
                              borderRadius: '8px',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              minHeight: '120px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#1F2937',
                                  fontWeight: 500,
                                  lineHeight: 1.4,
                                  mb: 2
                                }}
                              >
                                • {idea}
                              </Typography>
                              
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}>
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: '4px',
                                  border: `2px solid ${getDifficultyColor(difficulty)}`,
                                  background: `${getDifficultyColor(difficulty)}15`
                                }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: getDifficultyColor(difficulty),
                                      fontWeight: 600,
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    D: {difficulty}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: '4px',
                                  border: `2px solid ${getValueColor(value)}`,
                                  background: `${getValueColor(value)}15`
                                }}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: getValueColor(value),
                                      fontWeight: 600,
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    V: {value}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ color: '#6B7280' }}>
                    Enter a command above to generate innovative ideas
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        );

      case 'quote':
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Box sx={{ 
                textAlign: 'center', 
                py: 4, 
                px: 3,
                background: 'rgba(6, 182, 212, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {isGeneratingQuote ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={40} sx={{ color: '#06B6D4' }} />
                    <Typography variant="body1" sx={{ color: '#6B7280' }}>
                      Generating inspirational quote...
                    </Typography>
                  </Box>
                ) : currentQuote ? (
                  <Box sx={{ width: '100%' }}>
                    {/* Current Quote */}
                    <Box sx={{ mb: previousQuote ? 4 : 0 }}>
                    <Typography 
                        variant="h5" 
                      sx={{ 
                        fontWeight: 300,
                        fontStyle: 'italic',
                        color: '#1F2937',
                        lineHeight: 1.4,
                          mb: 2,
                        textAlign: 'center'
                      }}
                    >
                      "{currentQuote}"
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#06B6D4',
                          textAlign: 'center',
                          mb: 1
                      }}
                    >
                      — {quoteAuthor}
                    </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#6B7280',
                          textAlign: 'center',
                          display: 'block'
                        }}
                      >
                        Current Quote
                      </Typography>
                    </Box>
                    
                    {/* Previous Quote (if exists) */}
                    {previousQuote && (
                      <Box sx={{ 
                        pt: 3, 
                        borderTop: '1px solid rgba(6, 182, 212, 0.2)',
                        opacity: 0.7
                      }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 300,
                            fontStyle: 'italic',
                            color: '#6B7280',
                            lineHeight: 1.4,
                            mb: 2,
                            textAlign: 'center'
                          }}
                        >
                          "{previousQuote}"
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#6B7280',
                            textAlign: 'center',
                            mb: 1
                          }}
                        >
                          — {previousQuoteAuthor}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#9CA3AF',
                            textAlign: 'center',
                            display: 'block'
                          }}
                        >
                          Previous Quote
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ color: '#6B7280' }}>
                    Select a quote type to generate an inspirational quote
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        );

      case 'social':
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Platform</InputLabel>
                <Select
                  value={formFields.platform || ''}
                  onChange={(e) => setFormFields({...formFields, platform: e.target.value})}
                  label="Platform"
                >
                  <MenuItem value="linkedin">LinkedIn</MenuItem>
                  <MenuItem value="twitter">Twitter</MenuItem>
                  <MenuItem value="instagram">Instagram</MenuItem>
                  <MenuItem value="facebook">Facebook</MenuItem>
                  <MenuItem value="tiktok">TikTok</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Post Type</InputLabel>
                <Select
                  value={formFields.post_type || ''}
                  onChange={(e) => setFormFields({...formFields, post_type: e.target.value})}
                  label="Post Type"
                >
                  <MenuItem value="educational">Educational</MenuItem>
                  <MenuItem value="promotional">Promotional</MenuItem>
                  <MenuItem value="story">Story</MenuItem>
                  <MenuItem value="question">Question</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hashtags"
                placeholder="#productivity #tips #business"
                size="small"
                value={formFields.hashtags || ''}
                onChange={(e) => setFormFields({...formFields, hashtags: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Engagement Goal</InputLabel>
                <Select
                  value={formFields.engagement_goal || ''}
                  onChange={(e) => setFormFields({...formFields, engagement_goal: e.target.value})}
                  label="Engagement Goal"
                >
                  <MenuItem value="likes">Likes</MenuItem>
                  <MenuItem value="comments">Comments</MenuItem>
                  <MenuItem value="shares">Shares</MenuItem>
                  <MenuItem value="clicks">Clicks</MenuItem>
                  <MenuItem value="followers">Followers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  const handleAssign = async () => {
    setLoading(true);
    setError('');
    
    // Check if we have the required input based on agent type
    if (selectedAgent === 1) { // Email Agent
      // For email agent, we need either command input OR specific fields filled
      const hasCommand = taskInput.trim();
      const hasSpecificFields = formFields.email && formFields.content;
      
      if (!hasCommand && !hasSpecificFields) {
        setError('Please enter a command OR fill in the email address and content fields.');
        setLoading(false);
        return;
      }
    } else if (selectedAgent === 8) { // Ideas Agent
      if (!taskInput.trim()) {
        setError('Please enter a command to generate ideas.');
        setLoading(false);
        return;
      }
    } else {
      if (!taskInput.trim()) {
        setError('Please enter a command.');
        setLoading(false);
        return;
      }
    }

    try {
      // For email agent, prioritize specific fields over command input
      let finalInput = taskInput;
      let finalEmail = formFields.email;
      let finalSubject = formFields.subject;
      let finalContent = formFields.content;

      if (selectedAgent === 1) { // Email Agent
        // If specific fields are filled, use them; otherwise use command input
        if (formFields.email && formFields.content) {
          // Use specific fields - construct a proper input for the backend
          finalInput = `Send email to ${formFields.email}${formFields.subject ? ` with subject "${formFields.subject}"` : ''}: ${formFields.content}`;
          finalEmail = formFields.email;
          finalSubject = formFields.subject;
          finalContent = formFields.content;
        } else {
          // Use command input - extract email and content from it
          finalInput = taskInput;
          finalEmail = formFields.email || '';
          finalSubject = formFields.subject || '';
          finalContent = formFields.content || taskInput;
        }
      } else if (selectedAgent === 8) { // Ideas Agent
        finalInput = taskInput;
      }

      // For Ideas Agent, use the direct generate_ideas endpoint
      if (selectedAgent === 8) {
        const res = await axios.post(`${backendUrl}/agents/generate_ideas`, {
          command: finalInput
        }, { headers: getAuthHeaders() });
        
        if (res.data && Array.isArray(res.data)) {
          setCurrentIdeas(res.data);
          setStatus('assigned');
          setError('');
          if (onTaskAssigned) {
            onTaskAssigned({ ideas: res.data, agent_id: selectedAgent, input: finalInput });
          }
        } else {
          setError('Failed to generate ideas. Please try again.');
        }
        setLoading(false);
        return;
      }

      // For other agents, use the assign endpoint
      const res = await axios.post(`${backendUrl}/agents/assign`, { 
        agent_id: selectedAgent, 
        input: finalInput,
        form_fields: {
          ...formFields,
          email: finalEmail,
          subject: finalSubject,
          content: finalContent,
          command: finalInput // For Ideas Agent
        }
      }, { headers: getAuthHeaders() });
      if (res.data.status === 'failed') {
        setError(res.data.error || 'Task assignment failed.');
        setStatus('failed');
        setTaskId(null);
      } else if (res.data.preview) {
        // Email agent: add to list immediately with preview/output
        setEmailPreview(res.data.preview);
        setPreviewEmail(res.data.email || finalEmail);
        setPreviewSubject(res.data.subject || finalSubject);
        setPreviewAgentId(selectedAgent);
        setPreviewUserInput(finalInput);
        setToneLevel(res.data.tone_level || 3);
        setShowPreview(true);
        setStatus('assigned');
        setTaskId(res.data.task_id);
        setPendingTaskId(res.data.task_id);
        if (onTaskAssigned) {
          onTaskAssigned({
            task_id: res.data.task_id,
            agent_id: selectedAgent,
            input: finalInput,
            output: res.data.preview,
            status: 'assigned',
            email: res.data.email || finalEmail,
            subject: res.data.subject || finalSubject,
            tone_level: res.data.tone_level
          });
        }
      } else if (res.data.ideas) {
        // Ideas agent: update the ideas display
        setCurrentIdeas(res.data.ideas);
        setStatus('assigned');
        setTaskId(res.data.task_id);
        setError('');
        if (onTaskAssigned) {
          onTaskAssigned({ ...res.data, agent_id: selectedAgent, input: finalInput });
        }
      } else {
        setTaskId(res.data.task_id);
        setStatus(res.data.status);
        setError('');
        if (onTaskAssigned) {
          onTaskAssigned({ ...res.data, agent_id: selectedAgent, input: finalInput });
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign task');
    }
    setLoading(false);
  };

  const handleConfirmSend = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${backendUrl}/agents/send_email`, {
        email: previewEmail,
        preview: emailPreview,
        agent_id: previewAgentId,
        user_input: previewUserInput,
        task_id: pendingTaskId
      }, { headers: getAuthHeaders() });
      if (res.data.status === 'failed') {
        setError(res.data.error || 'Failed to send email.');
        setStatus('failed');
      } else {
        setTaskId(res.data.task_id);
        setStatus(res.data.status);
        setError('');
        if (onTaskConfirmed) {
          onTaskConfirmed({
            task_id: res.data.task_id,
            agent_id: previewAgentId,
            input: previewUserInput,
            output: emailPreview,
            status: 'completed',
            email: previewEmail
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send email');
    }
    setShowPreview(false);
    setLoading(false);
    setPendingTaskId(null);
  };

  const handleToneChange = async (newToneLevel) => {
    if (newToneLevel === toneLevel) return;
    
    setIsRegenerating(true);
    try {
      const res = await axios.post(`${backendUrl}/agents/regenerate_email`, {
        user_input: previewUserInput,
        tone_level: newToneLevel
      }, { headers: getAuthHeaders() });
      
      if (res.data.status === 'success') {
        setEmailPreview(res.data.preview);
        setPreviewSubject(res.data.subject || '');
        setToneLevel(newToneLevel);
      } else {
        setError('Failed to regenerate email with new tone');
      }
    } catch (err) {
      setError('Failed to regenerate email with new tone');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCancelSend = () => {
    setShowPreview(false);
    setEmailPreview(null);
    setPreviewEmail('');
    setPreviewSubject('');
    setPreviewAgentId(null);
    setPreviewUserInput('');
    setStatus('');
    setToneLevel(3);
  };

  return (
    <Card sx={{ 
      mb: 3, 
      borderRadius: '12px', 
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(229, 231, 235, 0.5)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h4" sx={{ color: selectedAgentConfig?.color || '#83c441' }}>
            {selectedAgentConfig?.icon}
          </Typography>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                color: selectedAgentConfig?.color || '#83c441'
              }}
            >
              {selectedAgentConfig?.name || 'Assign Task'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {selectedAgentConfig?.description}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          <Select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            size="small"
            sx={{ 
              minWidth: { xs: '100%', md: 200 },
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }
            }}
            disabled={loading || agents.length === 0}
          >
            {agents.map(agent => (
              <MenuItem key={agent.id} value={agent.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ color: AGENT_CONFIGS[agent.id]?.color }}>
                    {AGENT_CONFIGS[agent.id]?.icon}
                  </Typography>
                  {agent.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
          
          {selectedAgent === 5 ? (
            // Quote Agent: Show quote type dropdown instead of input
            <FormControl fullWidth size="small">
              <InputLabel>Quote Type</InputLabel>
              <Select
                value={formFields.quote_type || 'motivation'}
                onChange={(e) => {
                  setFormFields({...formFields, quote_type: e.target.value});
                }}
                label="Quote Type"
                disabled={loading}
              >
                <MenuItem value="motivation">Motivation & Success</MenuItem>
                <MenuItem value="leadership">Leadership & Vision</MenuItem>
                <MenuItem value="wisdom">Wisdom & Philosophy</MenuItem>
                <MenuItem value="creativity">Creativity & Innovation</MenuItem>
                <MenuItem value="perseverance">Perseverance & Resilience</MenuItem>
                <MenuItem value="success">Success & Achievement</MenuItem>
                <MenuItem value="courage">Courage & Bravery</MenuItem>
                <MenuItem value="love">Love & Relationships</MenuItem>
                <MenuItem value="happiness">Happiness & Joy</MenuItem>
                <MenuItem value="dreams">Dreams & Aspirations</MenuItem>
              </Select>
            </FormControl>
          ) : (
            // Other agents: Show regular input field
            <TextField
              fullWidth
              placeholder={getInputPlaceholder(selectedAgent)}
              variant="outlined"
              size="small"
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              disabled={loading}
            />
          )}
          
          {selectedAgent === 5 ? (
            // Quote Agent: Show Generate button
            <Button 
              variant="contained" 
              onClick={handleGenerateNewQuote} 
              disabled={isGeneratingQuote}
              sx={{ 
                minWidth: { xs: '100%', md: 'auto' },
                background: selectedAgentConfig?.color || '#06B6D4',
                '&:hover': {
                  background: selectedAgentConfig?.color || '#06B6D4',
                  opacity: 0.9
                }
              }}
            >
              {isGeneratingQuote ? 'Generating...' : 'Refresh'}
            </Button>
          ) : (
            // Other agents: Show Assign button
            <Button 
              variant="contained" 
              onClick={handleAssign} 
              disabled={!taskInput || loading}
              sx={{ 
                minWidth: { xs: '100%', md: 'auto' },
                background: selectedAgentConfig?.color || '#83c441',
                '&:hover': {
                  background: selectedAgentConfig?.color || '#83c441',
                  opacity: 0.9
                }
              }}
            >
              {loading ? (selectedAgent === 8 ? 'Thinking...' : 'Assigning...') : (selectedAgent === 8 ? 'Think' : 'Assign')}
            </Button>
          )}
        </Box>
        
        {/* Dynamic Fields */}
        {renderDynamicFields()}
        
        {error && (
          <Typography 
            color="error" 
            sx={{ 
              mt: 2, 
              p: 2, 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: 1,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            {error}
          </Typography>
        )}
        
        <Dialog 
          open={showPreview} 
          onClose={handleCancelSend} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ 
            color: 'primary.main',
            fontWeight: 600
          }}>
            Email Preview
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box>
              {/* Email Preview */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: 'text.primary',
                    fontWeight: 600
                  }}
                >
                  Email Content
                </Typography>
                <Box sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace', 
                  fontSize: 14, 
                  mb: 2, 
                  background: '#F8F9FA',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  minHeight: '200px',
                  position: 'relative'
                }}>
                  {isRegenerating ? (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      gap: 2
                    }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">
                        Regenerating email...
                      </Typography>
                    </Box>
                  ) : (
                    emailPreview
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500,
                      p: 1,
                      background: '#F3F4F6',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}
                  >
                    <strong>To:</strong> {previewEmail}
                  </Typography>
                  {previewSubject && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        p: 1,
                        background: '#E3F2FD',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <strong>Subject:</strong> {previewSubject}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Tone Slider at Bottom */}
              <ToneSlider 
                value={toneLevel} 
                onChange={handleToneChange}
                disabled={isRegenerating}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={handleCancelSend}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSend}
              variant="contained"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

AgentControl.propTypes = {
  onTaskAssigned: PropTypes.func,
  onTaskConfirmed: PropTypes.func,
};

export default AgentControl;