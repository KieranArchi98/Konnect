import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Link, useTheme, useMediaQuery } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArticleIcon from '@mui/icons-material/Article';

function MetricCard({ title, content, icon, color = 'primary.main', singleStory = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getIcon = () => {
    if (icon) return icon;
    switch (title?.toLowerCase()) {
      case 'latest news':
        console.log('Returning ArticleIcon for Latest News');
        return <ArticleIcon />;
      default:
        console.log('Returning TrendingUpIcon for:', title);
        return <TrendingUpIcon />;
    }
  };

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
        {/* Header - Hide for single story mode */}
        {!singleStory && (
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
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              borderRadius: { xs: '8px', sm: '10px' },
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              boxShadow: `0 4px 12px ${color}40`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 6px 16px ${color}60`
              }
            }}>
              {getIcon() || <TrendingUpIcon />}
            </Box>
            <Typography 
              variant={isMobile ? "h6" : "h6"} 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                letterSpacing: '-0.02em',
                flex: 1
              }}
            >
              {title}
            </Typography>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {Array.isArray(content) && content.length > 0 ? (
            <Box sx={{ 
              maxHeight: '100%', 
              overflow: 'auto',
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
              {content.map((item, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: singleStory ? 0 : 2,
                    p: singleStory ? { xs: 1.5, sm: 2 } : 2,
                    borderRadius: 2,
                    background: 'rgba(243, 244, 246, 0.5)',
                    border: '1px solid rgba(229, 231, 235, 0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'rgba(243, 244, 246, 0.8)',
                      transform: singleStory ? 'scale(1.02)' : 'translateX(4px)'
                    },
                    '&:last-child': { mb: 0 }
                  }}
                >
                  {item.title && (
                    <Typography 
                      variant={singleStory ? "body2" : "body2"} 
                      sx={{ 
                        fontWeight: 500, 
                        color: 'text.primary',
                        mb: 1,
                        lineHeight: 1.4,
                        fontSize: singleStory ? { xs: '12px', sm: '13px' } : { xs: '13px', sm: '14px' },
                        display: '-webkit-box',
                        WebkitLineClamp: singleStory ? 3 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.title}
                    </Typography>
                  )}
                  {item.url && (
                    <Link 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        color: color,
                        textDecoration: 'none',
                        fontSize: { xs: '10px', sm: '11px' },
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: `${color}dd`,
                          textDecoration: 'underline',
                          transform: 'translateX(2px)'
                        }
                      }}
                    >
                      Read more →
                    </Link>
                  )}
                  {item.source && (
                    <Chip 
                      label={item.source} 
                      size="small" 
                      sx={{ 
                        mt: 1,
                        background: 'rgba(243, 244, 246, 0.8)',
                        color: 'text.secondary',
                        fontSize: { xs: '8px', sm: '9px' },
                        height: { xs: '16px', sm: '18px' },
                        fontWeight: 500,
                        border: '1px solid rgba(229, 231, 235, 0.5)'
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: { xs: 3, sm: 4 },
              color: 'text.disabled',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: { xs: '120px', sm: '140px' }
            }}>
              <Box sx={{
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                background: 'rgba(209, 213, 219, 0.3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}>
                {getIcon()}
              </Box>
              <Typography 
                variant="body2"
                sx={{ 
                  fontWeight: 500,
                  color: 'text.secondary'
                }}
              >
                No data available
              </Typography>
              <Typography 
                variant="caption"
                sx={{ 
                  color: 'text.disabled',
                  mt: 0.5
                }}
              >
                Check back later for updates
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer - Hide for single story mode */}
        {!singleStory && (
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
                color: 'text.disabled',
                fontSize: { xs: '10px', sm: '11px' },
                fontWeight: 500
              }}
            >
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
            <Chip 
              label="Live" 
              size="small" 
              sx={{ 
                background: '#83c441',
                color: '#fff',
                fontSize: { xs: '9px', sm: '10px' },
                height: { xs: '16px', sm: '18px' },
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCard;
