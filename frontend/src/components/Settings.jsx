import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Grid, 
  Divider, 
  FormHelperText,
  Chip,
  IconButton
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  IntegrationInstructions as IntegrationIcon
} from '@mui/icons-material';
import { SiGithub, SiDiscord, SiGoogle } from 'react-icons/si';
import { Cloud } from '@mui/icons-material';
import gsap from 'gsap';
import { getQueryAgentMode, setQueryAgentMode, getAllSettings, saveAllSettings } from '../utils/settings.js';
import { useAuth } from '../context/AuthContext.jsx';

const LLM_MODELS = [
  { value: 'grok', label: 'Grok' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'llama', label: 'Llama' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'PST', label: 'PST' },
  { value: 'EST', label: 'EST' },
  { value: 'CET', label: 'CET' },
  { value: 'IST', label: 'IST' },
];

const SOCIALS = [
  { name: 'GitHub', icon: <SiGithub size={32} /> },
  { name: 'Discord', icon: <SiDiscord size={32} /> },
  { name: 'Google', icon: <SiGoogle size={32} /> },
  { name: 'Microsoft', icon: <Cloud sx={{ color: '#5A6570', fontSize: 32 }} /> },
];

function Settings() {
  const [llmModel, setLlmModel] = useState('chatgpt');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [pineconeApiKey, setPineconeApiKey] = useState('');
  const [pineconeEnv, setPineconeEnv] = useState('');
  const [pineconeIndex, setPineconeIndex] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [gmailClientId, setGmailClientId] = useState('');
  const [gmailClientSecret, setGmailClientSecret] = useState('');
  const [gmailRefreshToken, setGmailRefreshToken] = useState('');
  const [gmailSender, setGmailSender] = useState('');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [queryAgentMode, setQueryAgentModeState] = useState('basic');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const settingsRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Load all settings from localStorage
      const settings = getAllSettings();
      setQueryAgentModeState(settings.queryAgentMode || 'basic');
      setLlmModel(settings.llmModel || 'chatgpt');
      setLanguage(settings.language || 'en');
      setTimezone(settings.timezone || 'UTC');
      setSettingsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    gsap.fromTo(
      settingsRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, []);

  const handleQueryAgentModeChange = (newMode) => {
    setQueryAgentModeState(newMode);
    setQueryAgentMode(newMode);
    
    // Update all settings
    const currentSettings = getAllSettings();
    const updatedSettings = { ...currentSettings, queryAgentMode: newMode };
    saveAllSettings(updatedSettings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const allSettings = {
        queryAgentMode,
        llmModel,
        language,
        timezone,
        // ... other settings
      };
      
      const success = saveAllSettings(allSettings);
      if (success) {
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = () => {
    const settings = getAllSettings();
    setQueryAgentModeState(settings.queryAgentMode || 'basic');
    setLlmModel(settings.llmModel || 'chatgpt');
    setLanguage(settings.language || 'en');
    setTimezone(settings.timezone || 'UTC');
  };

  return (
    <Box ref={settingsRef} sx={{ 
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
          <SettingsIcon sx={{ fontSize: 32, color: '#5A6570' }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 600, 
              color: '#2A2A2A', 
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Settings
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<SecurityIcon />}
            label="Configuration"
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E5E7EB',
              fontWeight: 500,
              color: '#5A6570'
            }}
          />
          <IconButton
            onClick={handleRefresh}
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
            <RefreshIcon sx={{ color: '#5A6570' }} />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LLM Configuration Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '12px', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StorageIcon sx={{ color: '#83c441', fontSize: 28 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  LLM Configuration
                </Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="llm-model-label">Model</InputLabel>
                <Select 
                  labelId="llm-model-label" 
                  value={llmModel} 
                  label="Model" 
                  onChange={e => setLlmModel(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
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
                >
                  {LLM_MODELS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
              
              <TextField 
                label="API Key" 
                type="password" 
                fullWidth 
                value={llmApiKey} 
                onChange={e => setLlmApiKey(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
            </CardContent>
          </Card>
        </Grid>

        {/* Query Agent Setup Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '12px', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IntegrationIcon sx={{ color: '#EF4444', fontSize: 28 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Query Agent Setup
                </Typography>
              </Box>
              
              <TextField 
                label="Pinecone API Key" 
                fullWidth 
                value={pineconeApiKey} 
                onChange={e => setPineconeApiKey(e.target.value)}
                sx={{ mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Query Agent Mode</InputLabel>
                <Select
                  value={queryAgentMode}
                  onChange={(e) => handleQueryAgentModeChange(e.target.value)}
                  label="Query Agent Mode"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
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
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
                <FormHelperText>
                  Basic: Show all chunks. Advanced: AI-generated summary.
                </FormHelperText>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Database Configuration Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '12px', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <StorageIcon sx={{ color: '#06B6D4', fontSize: 28 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Database Configuration
                </Typography>
              </Box>
              
              <TextField 
                label="Pinecone Environment" 
                fullWidth 
                value={pineconeEnv} 
                onChange={e => setPineconeEnv(e.target.value)}
                sx={{ mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
              
              <TextField 
                label="Pinecone Index Name" 
                fullWidth 
                value={pineconeIndex} 
                onChange={e => setPineconeIndex(e.target.value)}
                sx={{ mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
              
              <TextField 
                label="Supabase URL" 
                fullWidth 
                value={supabaseUrl} 
                onChange={e => setSupabaseUrl(e.target.value)}
                sx={{ mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
              
              <TextField 
                label="Supabase Key" 
                fullWidth 
                value={supabaseKey} 
                onChange={e => setSupabaseKey(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
            </CardContent>
          </Card>
        </Grid>

        {/* Gmail Integration Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '12px', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <EmailIcon sx={{ color: '#F97316', fontSize: 28 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Gmail Integration
                </Typography>
              </Box>
              
              <TextField 
                label="Client ID" 
                fullWidth 
                value={gmailClientId} 
                onChange={e => setGmailClientId(e.target.value)}
                sx={{ mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
              
              <TextField 
                label="Client Secret" 
                fullWidth 
                value={gmailClientSecret} 
                onChange={e => setGmailClientSecret(e.target.value)}
                sx={{ mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
              
              <TextField 
                label="Refresh Token" 
                fullWidth 
                value={gmailRefreshToken} 
                onChange={e => setGmailRefreshToken(e.target.value)}
                sx={{ mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
              
              <TextField 
                label="Sender Email" 
                fullWidth 
                value={gmailSender} 
                onChange={e => setGmailSender(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
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
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '12px', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <LanguageIcon sx={{ color: '#8B5CF6', fontSize: 28 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Preferences
                </Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="language-label">Language</InputLabel>
                <Select 
                  labelId="language-label" 
                  value={language} 
                  label="Language" 
                  onChange={e => setLanguage(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
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
                >
                  {LANGUAGES.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel id="timezone-label">Timezone</InputLabel>
                <Select 
                  labelId="timezone-label" 
                  value={timezone} 
                  label="Timezone" 
                  onChange={e => setTimezone(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
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
                >
                  {TIMEZONES.map(tz => <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>)}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* 3rd Party Integrations Card */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IntegrationIcon sx={{ color: '#5A6570', fontSize: 28 }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  3rd Party Integrations
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                justifyContent: 'center', 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                {SOCIALS.map(s => (
                  <Button 
                    key={s.name} 
                    variant="outlined" 
                    className="haptic-feedback"
                    sx={{ 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px', 
                      minWidth: 80, 
                      minHeight: 80, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: '#5A6570', 
                      background: '#fff',
                      p: 2,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: '#5A6570',
                        background: '#F8F9FA',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(90, 101, 112, 0.15)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      background: '#fff', 
                      borderRadius: '8px', 
                      p: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#5A6570'
                    }}>
                      {s.icon}
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 1,
                        color: '#5A6570',
                        fontWeight: 500
                      }}
                    >
                      {s.name}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={isSaving}
          startIcon={<SaveIcon />}
          className="haptic-feedback"
          sx={{ 
            px: 6, 
            py: 1.5, 
            fontWeight: 500, 
            fontSize: 16,
            borderRadius: '8px',
            background: '#5A6570',
            '&:hover': {
              background: '#4A5568',
              transform: 'scale(1.02)',
              boxShadow: '0 4px 12px rgba(90, 101, 112, 0.3)',
            },
            '&:disabled': {
              background: '#9CA3AF',
              transform: 'none'
            }
          }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
}

export default Settings;
