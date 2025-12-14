import React, { useEffect, useRef } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Box, Divider, Avatar, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import ExploreIcon from '@mui/icons-material/Explore';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardDoubleArrowUpSharpIcon from '@mui/icons-material/KeyboardDoubleArrowUpSharp';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';



const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Quests', icon: <ExploreIcon />, path: '/quests' },
  { text: 'Agents', icon: <GroupIcon />, path: '/agents' },
  { text: 'Database', icon: <StorageIcon />, path: '/database' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function Sidebar() {
  const sidebarRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerWidth, setDrawerWidth] = React.useState(280);

  // Handle responsive drawer width
  React.useEffect(() => {
    const updateDrawerWidth = () => {
      if (window.innerWidth < 480) {
        setDrawerWidth(200); // Mobile
      } else if (window.innerWidth < 768) {
        setDrawerWidth(240); // Tablet
      } else {
        setDrawerWidth(280); // Desktop
      }
    };

    // Set initial width
    updateDrawerWidth();

    // Add resize listener
    window.addEventListener('resize', updateDrawerWidth);

    // Cleanup
    return () => window.removeEventListener('resize', updateDrawerWidth);
  }, []);

  useEffect(() => {
    // Stagger animation for sidebar items
    gsap.fromTo(
      sidebarRef.current,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );

    // Animate nav items with stagger
    gsap.fromTo(
      '.nav-item',
      { x: -30, opacity: 0 },
      { 
        x: 0, 
        opacity: 1, 
        duration: 0.6, 
        ease: 'power2.out',
        stagger: 0.1,
        delay: 0.2
      }
    );
  }, []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        overflowX: 'hidden',
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#2A2A2A',
          borderRight: '1px solid #E5E7EB',
          boxShadow: '2px 0 16px rgba(0, 0, 0, 0.1)',
          borderRadius: 0,
          overflowX: 'hidden',
        },
      }}
    >
      <Box ref={sidebarRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Toolbar sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 3,
          borderBottom: '1px solid #E5E7EB'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%' 
          }}>
            <img 
              src="/Logo4.png" 
              alt="Logo" 
              style={{
                width: drawerWidth < 240 ? '120px' : '160px',
                height: 'auto',
                maxHeight: '40px',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Toolbar>

        <Divider sx={{ borderColor: '#E5E7EB' }} />

        <List sx={{ px: drawerWidth < 240 ? 1 : 2, py: 2 }}>
          {navItems.map((item, index) => (
            <ListItem
              button
              key={item.text}
              component={NavLink}
              to={item.path}
              selected={location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard')}
              className="nav-item haptic-feedback"
              sx={{
                borderRadius: item.isProfile ? '12px' : '8px',
                mx: 0.5,
                my: 0.5,
                px: 2,
                py: item.isProfile ? 2.5 : 1.5,
                fontWeight: 500,
                fontSize: '14px',
                color: (location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard')) ? '#83c441' : '#5A6570',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'none',
                letterSpacing: '0.025em',
                border: item.isProfile ? '2px solid rgba(90, 101, 112, 0.15)' : '1px solid transparent',
                background: item.isProfile 
                  ? 'linear-gradient(135deg, rgba(90, 101, 112, 0.12) 0%, rgba(90, 101, 112, 0.08) 100%)'
                  : (location.pathname === item.path ? 'rgba(90, 101, 112, 0.08)' : 'transparent'),
                boxShadow: item.isProfile 
                  ? '0 4px 16px rgba(90, 101, 112, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : (location.pathname === item.path ? '0 2px 8px rgba(90, 101, 112, 0.15)' : 'none'),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: item.isProfile ? 'relative' : 'static',
                '&:hover': {
                  background: item.isProfile 
                    ? 'linear-gradient(135deg, rgba(90, 101, 112, 0.18) 0%, rgba(90, 101, 112, 0.12) 100%)'
                    : 'rgba(90, 101, 112, 0.08)',
                  color: (location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard')) ? '#83c441' : '#4A5568',
                  borderColor: item.isProfile ? 'rgba(90, 101, 112, 0.25)' : 'rgba(90, 101, 112, 0.2)',
                  boxShadow: item.isProfile 
                    ? '0 6px 20px rgba(90, 101, 112, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    : '0 4px 12px rgba(90, 101, 112, 0.15)',
                  transform: item.isProfile ? 'translateX(4px) translateY(-1px)' : 'translateX(4px)',
                },
                '&:active': {
                  background: item.isProfile 
                    ? 'linear-gradient(135deg, rgba(90, 101, 112, 0.22) 0%, rgba(90, 101, 112, 0.16) 100%)'
                    : 'rgba(90, 101, 112, 0.12)',
                  transform: 'scale(0.98)',
                },
                '&:focus': {
                  outline: '2px solid #5A6570',
                  outlineOffset: '2px',
                },
                '&.active': {
                  background: item.isProfile 
                    ? 'linear-gradient(135deg, rgba(90, 101, 112, 0.18) 0%, rgba(90, 101, 112, 0.12) 100%)'
                    : 'rgba(90, 101, 112, 0.08)',
                  color: '#83c441',
                  borderColor: item.isProfile ? 'rgba(90, 101, 112, 0.25)' : 'rgba(90, 101, 112, 0.2)',
                },

              }}
            >
              <ListItemIcon sx={{ 
                color: (location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard')) ? '#83c441' : '#9CA3AF', 
                minWidth: 36,
                transition: 'color 0.2s ease'
              }}>
                {item.isProfile && user ? (
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: 'linear-gradient(135deg, #5A6570 0%, #7A8A9A 100%)',
                      fontSize: '16px',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(90, 101, 112, 0.3)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 20 }} />
                    )}
                  </Avatar>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              {item.isProfile && user ? (
                <>
                  <Box sx={{ flexGrow: 1, ml: 1.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: '15px',
                        color: '#2A2A2A',
                        lineHeight: 1.2,
                        mb: 0.5,
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {user.display_name || user.email?.split('@')[0] || 'User'}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: 1
                    }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: '12px',
                          color: '#5A6570',
                          textTransform: 'uppercase',
                          lineHeight: 1.2,
                          letterSpacing: '0.1em'
                        }}
                      >
                        ELO: {user.elo || 0}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minWidth: drawerWidth < 240 ? 45 : 50,
                        height: 24,
                        px: 1,
                        py: 0.5,
                        borderRadius: '50px',
                        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        border: '2px solid #D1D5DB',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          right: '2px',
                          height: '50%',
                          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)',
                          borderRadius: '50px 50px 0 0',
                          pointerEvents: 'none'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '3px',
                          height: '3px',
                          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 70%, transparent 100%)',
                          borderRadius: '50%',
                          boxShadow: '0 0 3px rgba(255, 255, 255, 0.5)'
                        }
                      }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: '9px',
                            color: '#374151',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            lineHeight: 1,
                            textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                            position: 'relative',
                            zIndex: 1
                          }}
                        >
                          {user.level || 'Novice'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </>
              ) : (
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: location.pathname === item.path ? 600 : 500,
                      fontSize: '14px',
                      letterSpacing: '0.025em',
                    }
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* User Actions Section */}
        {user && (
          <Box sx={{ p: drawerWidth < 240 ? 1 : 2, borderTop: '1px solid #E5E7EB' }}>
            {/* Profile Button */}
            <ListItem
              button
              component={NavLink}
              to="/profile"
              selected={location.pathname === '/profile'}
              className="nav-item haptic-feedback"
              sx={{
                borderRadius: '12px',
                mx: 0.5,
                mb: 2,
                px: 2,
                py: 2.5,
                fontWeight: 500,
                fontSize: '14px',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'none',
                letterSpacing: '0.025em',
                border: '2px solid rgba(90, 101, 112, 0.3)',
                background: 'linear-gradient(135deg, #5A6570 0%, #4A5568 100%)',
                boxShadow: '0 4px 16px rgba(90, 101, 112, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4A5568 0%, #374151 100%)',
                  color: '#FFFFFF',
                  borderColor: 'rgba(90, 101, 112, 0.4)',
                  boxShadow: '0 6px 20px rgba(90, 101, 112, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                  transform: 'translateX(4px) translateY(-1px)',
                },
                '&:active': {
                  background: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
                  transform: 'scale(0.98)',
                },
                '&:focus': {
                  outline: '2px solid #5A6570',
                  outlineOffset: '2px',
                },
                '&.active': {
                  background: 'linear-gradient(135deg, #4A5568 0%, #374151 100%)',
                  color: '#FFFFFF',
                  borderColor: 'rgba(90, 101, 112, 0.4)',
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: '#5A6570', 
                minWidth: 36,
                transition: 'color 0.2s ease'
              }}>
                <Avatar 
                  sx={{ 
                    width: drawerWidth < 240 ? 28 : 36, 
                    height: drawerWidth < 240 ? 28 : 36, 
                    bgcolor: 'linear-gradient(135deg, #5A6570 0%, #7A8A9A 100%)',
                    fontSize: drawerWidth < 240 ? '14px' : '16px',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(90, 101, 112, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <PersonIcon sx={{ fontSize: drawerWidth < 240 ? 16 : 20 }} />
                  )}
                </Avatar>
              </ListItemIcon>
              <Box sx={{ flexGrow: 1, ml: 1.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '15px',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                    mb: 0.5,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {user.display_name || user.email?.split('@')[0] || 'User'}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 1
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                      letterSpacing: '0.1em'
                    }}
                  >
                    ELO: {user.elo || 0}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minWidth: drawerWidth < 240 ? 45 : 50,
                    height: 24,
                    px: 1,
                    py: 0.5,
                    borderRadius: '50px',
                    background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    border: '2px solid #D1D5DB',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      right: '2px',
                      height: '50%',
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 100%)',
                      borderRadius: '50px 50px 0 0',
                      pointerEvents: 'none'
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '3px',
                      height: '3px',
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 70%, transparent 100%)',
                      borderRadius: '50%',
                      boxShadow: '0 0 3px rgba(255, 255, 255, 0.5)'
                    }
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 700, 
                        fontSize: '9px',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        lineHeight: 1,
                        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      {user.level || 'Novice'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </ListItem>

            {/* Logout Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              sx={{
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%) !important',
                color: '#FFFFFF !important',
                borderRadius: '8px',
                py: 1.5,
                px: 2,
                fontWeight: 600,
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'none',
                letterSpacing: '0.025em',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%) !important',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%) !important',
                  transform: 'translateY(0) scale(0.98)',
                },
                '&:focus': {
                  outline: '2px solid #DC2626',
                  outlineOffset: '2px',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        )}

        <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#9CA3AF', 
              textAlign: 'center',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Productivity Dashboard v1.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
