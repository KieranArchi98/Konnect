import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Container,
  Chip,
  IconButton
} from '@mui/material';
import { 
  AutoAwesome as SparkleIcon,
  Psychology as AiIcon,
  Assignment as QuestIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  ArrowForward as ArrowIcon,
  GitHub as GitHubIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext.jsx';

const Splash = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const splashRef = useRef();
  const heroRef = useRef();
  const featuresRef = useRef();
  const ctaRef = useRef();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    // GSAP Animations
    const tl = gsap.timeline();

    // Hero section animation
    tl.fromTo(heroRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    )
    .fromTo('.hero-title', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.5'
    )
    .fromTo('.hero-subtitle', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo('.hero-buttons', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.3'
    );

    // Features animation
    gsap.fromTo(featuresRef.current.children,
      { opacity: 0, y: 40, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.8, 
        stagger: 0.2, 
        ease: 'power2.out',
        delay: 1
      }
    );

    // CTA section animation
    gsap.fromTo(ctaRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 1.5 }
    );

    // Floating animation for sparkles
    gsap.to('.sparkle', {
      y: -10,
      rotation: 360,
      duration: 3,
      repeat: -1,
      ease: 'power1.inOut',
      stagger: 0.5
    });

  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: <AiIcon sx={{ fontSize: 40, color: '#5A6570' }} />,
      title: 'AI Agents',
      description: 'Intelligent agents that handle emails, queries, and task management',
      color: '#E3F2FD'
    },
    {
      icon: <QuestIcon sx={{ fontSize: 40, color: '#5A6570' }} />,
      title: 'Quest System',
      description: 'Gamified productivity with personalized challenges and rewards',
      color: '#F3E5F5'
    },
    {
      icon: <SearchIcon sx={{ fontSize: 40, color: '#5A6570' }} />,
      title: 'Smart Search',
      description: 'Advanced knowledge base search with AI-powered insights',
      color: 'rgba(131, 196, 65, 0.1)'
    },
    {
      icon: <EmailIcon sx={{ fontSize: 40, color: '#5A6570' }} />,
      title: 'Email Automation',
      description: 'Automated email handling with tone control and scheduling',
      color: '#FFF3E0'
    }
  ];

  return (
    <Box
      ref={splashRef}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F5F3EF 0%, #E8E6E1 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Sparkles */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            className="sparkle"
            sx={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3,
              color: '#5A6570'
            }}
          >
            <SparkleIcon sx={{ fontSize: 16 }} />
          </Box>
        ))}
      </Box>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          ref={heroRef}
          sx={{
            textAlign: 'center',
            pt: { xs: 8, md: 12 },
            pb: { xs: 6, md: 8 }
          }}
        >
          <Chip
            label="AI-Powered Productivity"
            sx={{
              mb: 3,
              background: 'linear-gradient(135deg, #5A6570 0%, #7A8A9A 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          />
          
          <Typography
            className="hero-title"
            variant="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '4rem' },
              color: '#2A2A2A',
              mb: 3,
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}
          >
            Your AI-Powered
            <br />
            <Box component="span" sx={{ 
              background: 'linear-gradient(135deg, #83c441 0%, #9ed558 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Productivity Hub
            </Box>
          </Typography>

          <Typography
            className="hero-subtitle"
            variant="h5"
            sx={{
              color: '#5A6570',
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6
            }}
          >
            Streamline your workflow with intelligent agents, gamified quests, and powerful automation tools.
          </Typography>

          <Box className="hero-buttons" sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #83c441 0%, #9ed558 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6ba336 0%, #83c441 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(131, 196, 65, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Get Started
              <ArrowIcon sx={{ ml: 1 }} />
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                borderColor: '#5A6570',
                color: '#5A6570',
                '&:hover': {
                  borderColor: '#4A5568',
                  backgroundColor: 'rgba(90, 101, 112, 0.04)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Create Account
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box
          ref={featuresRef}
          sx={{
            py: { xs: 6, md: 8 },
            mb: { xs: 6, md: 8 }
          }}
        >
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              color: '#2A2A2A',
              mb: 6,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Powerful Features
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                      background: feature.color
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#2A2A2A',
                        mb: 2
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#5A6570',
                        lineHeight: 1.6
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

                {/* CTA Section - Multi-Component Layout */}
        <Box
          ref={ctaRef}
          sx={{
            py: { xs: 8, md: 12 },
            mb: 6,
            position: 'relative'
          }}
        >
          {/* Background decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(ellipse at center, rgba(131, 196, 65, 0.08) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />

          {/* Main CTA Grid */}
          <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
            
            {/* Left Column - Hero Content */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                textAlign: { xs: 'center', md: 'left' },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                {/* Badge */}
                <Chip
                  label="🚀 Get Started Today"
                  sx={{
                    mb: 3,
                    background: 'linear-gradient(135deg, #83c441 0%, #9ed558 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    alignSelf: { xs: 'center', md: 'flex-start' },
                    width: 'fit-content'
                  }}
                />
                
                {/* Main Heading */}
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    fontSize: { xs: '2.2rem', md: '2.8rem' },
                    color: '#2A2A2A',
                    lineHeight: 1.2
                  }}
                >
                  Ready to Transform
                  <br />
                  <Box component="span" sx={{ 
                    background: 'linear-gradient(135deg, #83c441 0%, #9ed558 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Your Productivity?
                  </Box>
                </Typography>
                
                {/* Subtitle */}
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    color: '#5A6570',
                    fontWeight: 400,
                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                    lineHeight: 1.6
                  }}
                >
                  Join thousands of users who have already streamlined their workflow with AI-powered tools
                </Typography>

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: { xs: 'center', md: 'flex-start' }
                }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #83c441 0%, #9ed558 100%)',
                      color: 'white',
                      boxShadow: '0 8px 25px rgba(131, 196, 65, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6ba336 0%, #83c441 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 35px rgba(131, 196, 65, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Free Trial
                    <ArrowIcon sx={{ ml: 1, fontSize: '1.2rem' }} />
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      borderColor: '#83c441',
                      color: '#83c441',
                      borderWidth: '2px',
                      '&:hover': {
                        borderColor: '#6ba336',
                        backgroundColor: 'rgba(131, 196, 65, 0.05)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Sign In
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Stats & Trust */}
            <Grid item xs={12} md={6}>
              <Box sx={{ height: '100%' }}>
                
                {/* Stats Cards */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                  mb: 4
                }}>
                  {[
                    { number: '10K+', label: 'Active Users', icon: '👥' },
                    { number: '50K+', label: 'Tasks Done', icon: '✅' },
                    { number: '95%', label: 'Satisfaction', icon: '⭐' }
                  ].map((stat, index) => (
                    <Card
                      key={index}
                      sx={{
                        textAlign: 'center',
                        p: 3,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(131, 196, 65, 0.2)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 30px rgba(131, 196, 65, 0.15)',
                          borderColor: '#83c441'
                        }
                      }}
                    >
                      <Typography
                        variant="h3"
                        sx={{
                          fontSize: '2rem',
                          mb: 1,
                          color: '#83c441',
                          fontWeight: 700
                        }}
                      >
                        {stat.icon}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: '#2A2A2A',
                          mb: 0.5,
                          fontSize: { xs: '1.5rem', md: '1.8rem' }
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#5A6570',
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Card>
                  ))}
                </Box>

                {/* Trust Section */}
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #2A2A2A 0%, #3A3A3A 100%)',
                    color: 'white',
                    borderRadius: 4,
                    p: 4,
                    border: '1px solid rgba(131, 196, 65, 0.2)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 3,
                      textAlign: 'center',
                      color: '#FFFFFF'
                    }}
                  >
                    Trusted by Teams Worldwide
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2
                  }}>
                    {[
                      { icon: '🔒', title: 'Secure & Private', desc: 'Enterprise-grade security' },
                      { icon: '⚡', title: 'Instant Setup', desc: 'Get started in minutes' },
                      { icon: '🎯', title: 'AI-Powered', desc: 'Smart automation' }
                    ].map((feature, index) => (
                      <Box
                        key={index}
                        sx={{
                          textAlign: 'center',
                          p: 2,
                          borderRadius: 3,
                          background: 'rgba(131, 196, 65, 0.1)',
                          border: '1px solid rgba(131, 196, 65, 0.2)'
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontSize: '1.5rem',
                            mb: 1,
                            color: '#83c441'
                          }}
                        >
                          {feature.icon}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: '#FFFFFF',
                            mb: 0.5,
                            fontSize: '0.9rem'
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.75rem'
                          }}
                        >
                          {feature.desc}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Splash; 