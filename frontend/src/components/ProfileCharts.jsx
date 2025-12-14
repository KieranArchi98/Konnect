import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Tune } from '@mui/icons-material';

const ProfileCharts = () => {
  const [chartType, setChartType] = useState('productivity');
  const [anchorEl, setAnchorEl] = useState(null);

  // Mock data for charts (will be replaced with real data later)
  const mockData = [
    { date: '2024-01-01', tasksCompleted: 5, questsCompleted: 2, hoursLearned: 2.5, eloEarned: 25 },
    { date: '2024-01-02', tasksCompleted: 7, questsCompleted: 1, hoursLearned: 3.0, eloEarned: 30 },
    { date: '2024-01-03', tasksCompleted: 4, questsCompleted: 3, hoursLearned: 1.5, eloEarned: 35 },
    { date: '2024-01-04', tasksCompleted: 6, questsCompleted: 2, hoursLearned: 2.0, eloEarned: 20 },
    { date: '2024-01-05', tasksCompleted: 8, questsCompleted: 1, hoursLearned: 4.0, eloEarned: 40 },
    { date: '2024-01-06', tasksCompleted: 3, questsCompleted: 2, hoursLearned: 1.0, eloEarned: 15 },
    { date: '2024-01-07', tasksCompleted: 9, questsCompleted: 3, hoursLearned: 3.5, eloEarned: 45 }
  ];

  const activityData = [
    { name: 'Tasks', value: 42, fill: '#83c441' },
    { name: 'Quests', value: 14, fill: '#9ed558' },
    { name: 'Learning', value: 17.5, fill: '#6ba336' }
  ];

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleChartChange = (newChartType) => {
    setChartType(newChartType);
    handleFilterClose();
  };

  const renderChart = () => {
    try {
      switch (chartType) {
        case 'productivity':
          return (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('en-US', { weekday: 'short' });
                    } catch (error) {
                      return value;
                    }
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="tasksCompleted" fill="#83c441" />
                <Bar dataKey="questsCompleted" fill="#9ed558" />
              </BarChart>
            </ResponsiveContainer>
          );

        case 'learning':
          return (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mockData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('en-US', { weekday: 'short' });
                    } catch (error) {
                      return value;
                    }
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="hoursLearned" stroke="#83c441" fill="#83c441" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          );

        case 'activity':
          return (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={activityData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 11 }} />
                <Radar name="Activity" dataKey="value" stroke="#83c441" fill="#83c441" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          );

        case 'progress':
          return (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('en-US', { weekday: 'short' });
                    } catch (error) {
                      return value;
                    }
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="eloEarned" stroke="#83c441" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          );

        default:
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
              <Typography variant="body2" color="text.secondary">
                Chart not available
              </Typography>
            </Box>
          );
      }
    } catch (error) {
      console.error('[ProfileCharts] Error rendering chart:', error);
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
          <Typography variant="body2" color="text.secondary">
            Chart loading error
          </Typography>
        </Box>
      );
    }
  };

  const getChartTitle = () => {
    switch (chartType) {
      case 'productivity': return 'Productivity Overview';
      case 'learning': return 'Learning Progress';
      case 'activity': return 'Activity Distribution';
      case 'progress': return 'ELO Progress';
      default: return 'Analytics';
    }
  };

  return (
    <Card sx={{ 
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      height: '100%'
    }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2A2A2A' }}>
            {getChartTitle()}
          </Typography>
          
          <IconButton
            onClick={handleFilterClick}
            sx={{
              border: '1px solid #E5E7EB',
              color: '#5A6570',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                borderColor: '#D1D5DB'
              }
            }}
          >
            <Tune />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFilterClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleChartChange('productivity')}>Productivity</MenuItem>
            <MenuItem onClick={() => handleChartChange('learning')}>Learning</MenuItem>
            <MenuItem onClick={() => handleChartChange('activity')}>Activity</MenuItem>
            <MenuItem onClick={() => handleChartChange('progress')}>Progress</MenuItem>
          </Menu>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {renderChart()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileCharts; 