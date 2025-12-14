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
import {
  Email,
  Lightbulb,
  FormatQuote,
  FlashOn,
  LocalFireDepartment,
  Star
} from '@mui/icons-material';
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

function AgentControl({ onTaskAssigned, onTaskConfirmed, selectedAgent, onAgentSelect, agentConfigs, agentsRef }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgentState, setSelectedAgentState] = useState('');
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
    }
  }, [user]);

  // Use the selectedAgent prop if provided, otherwise use local state
  const currentSelectedAgent = selectedAgent || selectedAgentState;

  useEffect(() => {
    if (selectedAgent) {
      setSelectedAgentState(selectedAgent);
    }
  }, [selectedAgent]);

  // Generate quote when Quote Agent is selected
  useEffect(() => {
    if (currentSelectedAgent === 5) {
      generateQuote();
    }
  }, [currentSelectedAgent]);

  // Generate quote when quote type changes
  useEffect(() => {
    if (currentSelectedAgent === 5 && formFields.quote_type) {
      generateQuote();
    }
  }, [formFields.quote_type]);

  // Clear ideas when switching away from Ideas Agent
  useEffect(() => {
    if (currentSelectedAgent !== 8) {
      setCurrentIdeas([]);
      setLastGeneratedInput('');
    }
    if (currentSelectedAgent !== 5) {
      setCurrentQuote('');
      setQuoteAuthor('');
      setPreviousQuote('');
      setPreviousQuoteAuthor('');
    }
  }, [currentSelectedAgent]);

  const selectedAgentConfig = AGENT_CONFIGS[currentSelectedAgent];

  const getAgentIcon = (iconName) => {
    switch (iconName) {
      case 'Email':
        return <Email />;
      case 'Lightbulb':
        return <Lightbulb />;
      case 'FormatQuote':
        return <FormatQuote />;
      case 'FlashOn':
        return <FlashOn />;
      case 'LocalFireDepartment':
        return <LocalFireDepartment />;
      case 'Star':
        return <Star />;
      default:
        return <Email />;
    }
  };

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

    switch (currentSelectedAgent) {
      case 1: // Email Agent
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Compose and send professional emails with AI assistance
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
                required
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
                placeholder="Enter your email content here..."
                multiline
                rows={4}
                size="small"
                value={formFields.content || ''}
                onChange={(e) => setFormFields({...formFields, content: e.target.value})}
                required
              />
            </Grid>
          </Grid>
        );

      case 8: // Ideas Agent
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Enter a command to generate innovative app and website ideas
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Enter a topic or area to generate innovative app/website ideas (e.g. 'productivity tools', 'health and wellness', 'education')"
                variant="outlined"
                size="small"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                disabled={loading}
              />
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

      case 5: // Quote Agent
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Select a quote type to generate inspirational quotes
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
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
            </Grid>
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

      case 'X': // Agent X - Data Analysis
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Analyze data, trends, and patterns with advanced AI algorithms
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Analysis Type</InputLabel>
                <Select
                  value={formFields.analysis_type || 'trends'}
                  onChange={(e) => setFormFields({...formFields, analysis_type: e.target.value})}
                  label="Analysis Type"
                >
                  <MenuItem value="trends">Trend Analysis</MenuItem>
                  <MenuItem value="patterns">Pattern Recognition</MenuItem>
                  <MenuItem value="correlations">Correlation Analysis</MenuItem>
                  <MenuItem value="predictions">Predictive Modeling</MenuItem>
                  <MenuItem value="anomalies">Anomaly Detection</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Source"
                placeholder="Enter data source or upload file"
                size="small"
                value={formFields.data_source || ''}
                onChange={(e) => setFormFields({...formFields, data_source: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Analysis Query"
                placeholder="Describe what you want to analyze or discover..."
                multiline
                rows={3}
                size="small"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                disabled={loading}
              />
            </Grid>
          </Grid>
        );

      case 'Y': // Agent Y - Performance Optimization
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Optimize performance, efficiency, and resource utilization
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Optimization Target</InputLabel>
                <Select
                  value={formFields.optimization_target || 'performance'}
                  onChange={(e) => setFormFields({...formFields, optimization_target: e.target.value})}
                  label="Optimization Target"
                >
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="efficiency">Efficiency</MenuItem>
                  <MenuItem value="cost">Cost Reduction</MenuItem>
                  <MenuItem value="speed">Speed</MenuItem>
                  <MenuItem value="quality">Quality</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Metrics"
                placeholder="Enter current performance metrics"
                size="small"
                value={formFields.current_metrics || ''}
                onChange={(e) => setFormFields({...formFields, current_metrics: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Optimization Goals"
                placeholder="Describe your optimization goals and constraints..."
                multiline
                rows={3}
                size="small"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                disabled={loading}
              />
            </Grid>
          </Grid>
        );

      case 'Z': // Agent Z - Content Enhancement
        return (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontStyle: 'italic' }}>
                Enhance and improve content quality, engagement, and impact
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={formFields.content_type || 'text'}
                  onChange={(e) => setFormFields({...formFields, content_type: e.target.value})}
                  label="Content Type"
                >
                  <MenuItem value="text">Text Content</MenuItem>
                  <MenuItem value="marketing">Marketing Copy</MenuItem>
                  <MenuItem value="technical">Technical Documentation</MenuItem>
                  <MenuItem value="creative">Creative Writing</MenuItem>
                  <MenuItem value="academic">Academic Content</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Enhancement Focus</InputLabel>
                <Select
                  value={formFields.enhancement_focus || 'clarity'}
                  onChange={(e) => setFormFields({...formFields, enhancement_focus: e.target.value})}
                  label="Enhancement Focus"
                >
                  <MenuItem value="clarity">Clarity & Readability</MenuItem>
                  <MenuItem value="engagement">Engagement</MenuItem>
                  <MenuItem value="seo">SEO Optimization</MenuItem>
                  <MenuItem value="tone">Tone & Style</MenuItem>
                  <MenuItem value="structure">Structure & Flow</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content to Enhance"
                placeholder="Paste or describe the content you want to enhance..."
                multiline
                rows={4}
                size="small"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                disabled={loading}
              />
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
    if (currentSelectedAgent === 1) { // Email Agent
      // For email agent, we need specific fields filled
      if (!formFields.email || !formFields.content) {
        setError('Please fill in both email address and content fields.');
        setLoading(false);
        return;
      }
    } else if (currentSelectedAgent === 8) { // Ideas Agent
      if (!taskInput.trim()) {
        setError('Please enter a command to generate ideas.');
        setLoading(false);
        return;
      }
    } else if (currentSelectedAgent === 'X' || currentSelectedAgent === 'Y' || currentSelectedAgent === 'Z') {
      if (!taskInput.trim()) {
        setError('Please enter your query or content.');
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

      if (currentSelectedAgent === 1) { // Email Agent
        // Use specific fields for email agent - keep subject separate from content
        finalInput = `Send email to ${formFields.email}: ${formFields.content}`;
        finalEmail = formFields.email;
        finalSubject = formFields.subject || '';
        finalContent = formFields.content;
      } else if (currentSelectedAgent === 8) { // Ideas Agent
        finalInput = taskInput;
      }

      // For Ideas Agent, use the direct generate_ideas endpoint
      if (currentSelectedAgent === 8) {
        const res = await axios.post(`${backendUrl}/agents/generate_ideas`, {
          command: finalInput
        }, { headers: getAuthHeaders() });
        
        if (res.data && Array.isArray(res.data)) {
          setCurrentIdeas(res.data);
          setStatus('assigned');
          setError('');
                  if (onTaskAssigned) {
          onTaskAssigned({ ideas: res.data, agent_id: currentSelectedAgent, input: finalInput });
        }
        } else {
          setError('Failed to generate ideas. Please try again.');
        }
        setLoading(false);
        return;
      }

      // For other agents, use the assign endpoint
      console.log(`[AGENT CONTROL] Assigning task for agent ${currentSelectedAgent} with input: ${finalInput}`);
      const res = await axios.post(`${backendUrl}/agents/assign`, { 
        agent_id: currentSelectedAgent, 
        input: finalInput,
        form_fields: {
          ...formFields,
          email: finalEmail,
          subject: finalSubject,
          content: finalContent,
          command: finalInput // For Ideas Agent
        }
      }, { headers: getAuthHeaders() });
      console.log(`[AGENT CONTROL] Assignment response:`, res.data);
      if (res.data.status === 'failed') {
        setError(res.data.error || 'Task assignment failed.');
        setStatus('failed');
        setTaskId(null);
      } else if (res.data.preview) {
        // Email agent: add to list immediately with preview/output
        setEmailPreview(res.data.preview);
        setPreviewEmail(res.data.email || finalEmail);
        setPreviewSubject(res.data.subject || finalSubject);
        setPreviewAgentId(currentSelectedAgent);
        setPreviewUserInput(finalInput);
        setToneLevel(res.data.tone_level || 3);
        setShowPreview(true);
        setStatus('assigned');
        setTaskId(res.data.task_id);
        setPendingTaskId(res.data.task_id);
        if (onTaskAssigned) {
          onTaskAssigned({
            task_id: res.data.task_id,
            agent_id: currentSelectedAgent,
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
          onTaskAssigned({ ...res.data, agent_id: currentSelectedAgent, input: finalInput });
        }
      } else {
        setTaskId(res.data.task_id);
        setStatus(res.data.status);
        setError('');
        // Always call onTaskAssigned for any successful task assignment
        if (onTaskAssigned) {
          onTaskAssigned({ 
            task_id: res.data.task_id,
            agent_id: currentSelectedAgent, 
            input: finalInput,
            output: res.data.output || res.data.message || 'Task assigned',
            status: res.data.status || 'assigned',
            email: res.data.email,
            subject: res.data.subject,
            tone_level: res.data.tone_level,
            ideas: res.data.ideas,
            results: res.data.results,
            quest: res.data.quest
          });
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
        task_id: pendingTaskId,
        subject: previewSubject
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
        {/* Agent Selection Portraits */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: '#2A2A2A',
              mb: 3,
              textAlign: 'center'
            }}
          >
            Select Your Agent
          </Typography>
          
          {/* Responsive Agent Grid */}
          <Box 
            ref={agentsRef}
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: { xs: 1, sm: 1.5, md: 2, lg: 3 },
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {Object.values(agentConfigs || {}).map((agent) => (
              <Box
                key={agent.id}
                onClick={() => onAgentSelect && onAgentSelect(agent.id)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  p: { xs: 1, sm: 1.5, md: 2 },
                  borderRadius: '12px',
                  background: selectedAgent === agent.id ? `${agent.color}15` : 'transparent',
                  border: `2px solid ${selectedAgent === agent.id ? agent.color : 'transparent'}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: { xs: '60px', sm: '70px', md: '80px', lg: '90px', xl: '100px' },
                  height: { xs: '80px', sm: '90px', md: '100px', lg: '110px', xl: '120px' },
                  '&:hover': {
                    background: `${agent.color}10`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${agent.color}20`
                  },
                  '&:active': {
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {/* Agent Avatar */}
                <Box
                  sx={{
                    width: { xs: 32, sm: 36, md: 40, lg: 44, xl: 48 },
                    height: { xs: 32, sm: 36, md: 40, lg: 44, xl: 48 },
                    borderRadius: '10px',
                    background: agent.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 2px 8px ${agent.color}30`,
                    flexShrink: 0,
                    '& .MuiSvgIcon-root': {
                      fontSize: { xs: '16px', sm: '18px', md: '20px', lg: '22px', xl: '24px' },
                      color: 'white'
                    }
                  }}
                >
                  {getAgentIcon(agent.avatar)}
                </Box>
                
                {/* Agent Name */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: selectedAgent === agent.id ? agent.color : '#2A2A2A',
                    textAlign: 'center',
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem', lg: '0.8rem', xl: '0.875rem' },
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    overflow: 'visible',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 0
                  }}
                >
                  {agent.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Agent Control Content */}
        {currentSelectedAgent && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  color: selectedAgentConfig?.color || '#83c441',
                  '& .MuiSvgIcon-root': {
                    fontSize: '2rem'
                  }
                }}>
                  {getAgentIcon(selectedAgentConfig?.icon)}
                </Box>
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
              
              {/* Action Button */}
              <Box>
                {currentSelectedAgent === 5 ? (
                  // Quote Agent: Show Generate button
                  <Button 
                    variant="contained" 
                    onClick={handleGenerateNewQuote} 
                    disabled={isGeneratingQuote}
                    sx={{ 
                      background: selectedAgentConfig?.color || '#06B6D4',
                      '&:hover': {
                        background: selectedAgentConfig?.color || '#06B6D4',
                        opacity: 0.9
                      }
                    }}
                  >
                    {isGeneratingQuote ? 'Generating...' : 'Generate Quote'}
                  </Button>
                ) : currentSelectedAgent === 1 ? (
                  // Email Agent: Show Send button
                  <Button 
                    variant="contained" 
                    onClick={handleAssign} 
                    disabled={!formFields.email || !formFields.content || loading}
                    sx={{ 
                      background: selectedAgentConfig?.color || '#83c441',
                      '&:hover': {
                        background: selectedAgentConfig?.color || '#83c441',
                        opacity: 0.9
                      }
                    }}
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </Button>
                ) : currentSelectedAgent === 8 ? (
                  // Ideas Agent: Show Generate button
                  <Button 
                    variant="contained" 
                    onClick={handleAssign} 
                    disabled={!taskInput || loading}
                    sx={{ 
                      background: selectedAgentConfig?.color || '#8B5CF6',
                      '&:hover': {
                        background: selectedAgentConfig?.color || '#8B5CF6',
                        opacity: 0.9
                      }
                    }}
                  >
                    {loading ? 'Thinking...' : 'Generate Ideas'}
                  </Button>
                ) : currentSelectedAgent === 'X' ? (
                  // Agent X: Show Analyze button
                  <Button 
                    variant="contained" 
                    onClick={handleAssign} 
                    disabled={!taskInput || loading}
                    sx={{ 
                      background: selectedAgentConfig?.color || '#F59E0B',
                      '&:hover': {
                        background: selectedAgentConfig?.color || '#F59E0B',
                        opacity: 0.9
                      }
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                ) : currentSelectedAgent === 'Y' ? (
                  // Agent Y: Show Optimize button
                  <Button 
                    variant="contained" 
                    onClick={handleAssign} 
                    disabled={!taskInput || loading}
                    sx={{ 
                      background: selectedAgentConfig?.color || '#EF4444',
                      '&:hover': {
                        background: selectedAgentConfig?.color || '#EF4444',
                        opacity: 0.9
                      }
                    }}
                  >
                    {loading ? 'Optimizing...' : 'Optimize'}
                  </Button>
                ) : currentSelectedAgent === 'Z' ? (
                  // Agent Z: Show Enhance button
                  <Button 
                    variant="contained" 
                    onClick={handleAssign} 
                    disabled={!taskInput || loading}
                    sx={{ 
                      background: selectedAgentConfig?.color || '#10B981',
                      '&:hover': {
                        background: selectedAgentConfig?.color || '#10B981',
                        opacity: 0.9
                      }
                    }}
                  >
                    {loading ? 'Enhancing...' : 'Enhance'}
                  </Button>
                ) : (
                  // Default: Show Assign button
                  <Button 
                    variant="contained" 
                    onClick={handleAssign} 
                    disabled={!taskInput || loading}
                    sx={{ 
                      background: selectedAgentConfig?.color || '#83c441',
                      '&:hover': {
                        background: selectedAgentConfig?.color || '#83c441',
                        opacity: 0.9
                      }
                    }}
                  >
                    {loading ? 'Processing...' : 'Process'}
                  </Button>
                )}
              </Box>
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
          </Box>
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
  selectedAgent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onAgentSelect: PropTypes.func,
  agentConfigs: PropTypes.object,
  agentsRef: PropTypes.object,
};

export default AgentControl;