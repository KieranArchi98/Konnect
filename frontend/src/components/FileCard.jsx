import React from 'react';
import { Card, CardContent, Typography, Button, Box, useTheme, useMediaQuery } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';

function FileCard({ file, onView, onDelete }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const getFileUrl = (file) => file && file.supabase_path ? `${supabaseUrl}/storage/v1/object/public/${file.supabase_path}` : '';
  const fileUrl = getFileUrl(file);
  const ext = file.name.split('.').pop().toLowerCase();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  let preview = null;
  if (ext === 'docx' && file.content) {
    preview = (
      <Box sx={{ 
        bgcolor: '#F9FAFB', 
        p: 2, 
        borderRadius: 2, 
        mb: 2,
        minHeight: { xs: 80, sm: 100 }
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#6B7280',
            lineHeight: 1.5,
            maxHeight: { xs: 60, sm: 80 },
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {file.content.slice(0, 200)}{file.content.length > 200 ? '...' : ''}
        </Typography>
      </Box>
    );
  } else {
    preview = (
      <Box sx={{ 
        height: { xs: 100, sm: 120 }, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        bgcolor: '#F9FAFB',
        borderRadius: 2,
        mb: 2
      }}>
        <InsertDriveFileIcon sx={{ 
          fontSize: { xs: 32, sm: 40 }, 
          color: '#9CA3AF' 
        }} />
      </Box>
    );
  }

  return (
    <Card sx={{ 
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
        background: 'linear-gradient(90deg, #22C55E 0%, #4ADE80 50%, #22C55E 100%)',
        opacity: 0.8
      }} />

      <CardContent sx={{ 
        p: { xs: 2.5, sm: 3 }, 
        position: 'relative'
      }}>
        {/* File Preview */}
        {preview}

        {/* File Name */}
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          sx={{ 
            fontWeight: 700, 
            color: '#2A2A2A',
            letterSpacing: '-0.02em',
            mb: 2,
            wordBreak: 'break-word',
            lineHeight: 1.3
          }}
        >
          {file.name}
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={onDelete}
            fullWidth={isMobile}
            sx={{ 
              color: '#EF4444',
              borderColor: '#EF4444',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              py: { xs: 1.25, sm: 1.5 },
              '&:hover': {
                borderColor: '#DC2626',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease',
              fontSize: { xs: '13px', sm: '14px' }
            }}
          >
            Delete
          </Button>
          <Button
            variant="contained"
            startIcon={<ViewIcon />}
            onClick={onView}
            fullWidth={isMobile}
            sx={{ 
              bgcolor: '#22C55E',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              py: { xs: 1.25, sm: 1.5 },
              '&:hover': { 
                bgcolor: '#16A34A',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(34, 197, 94, 0.3)'
              },
              transition: 'all 0.2s ease',
              fontSize: { xs: '13px', sm: '14px' }
            }}
          >
            View
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default FileCard;
