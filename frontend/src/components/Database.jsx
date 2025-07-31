import React, { useRef, useState, useEffect } from 'react';
import FileCard from './FileCard.jsx';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Modal, 
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { 
  Storage as StorageIcon,
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  InsertDriveFile as InsertDriveFileIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext.jsx';
import dayjs from 'dayjs';

function Database() {
  const fileInput = useRef();
  const carouselRef = useRef();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [selectedFileIdx, setSelectedFileIdx] = useState(null);
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false);
  const [carouselScroll, setCarouselScroll] = useState(0);
  const dbRef = useRef();
  const { user } = useAuth();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await axios.get(`${backendUrl}/database/files`, { headers });
      setFiles(res.data);
      setError('');
      // Auto-select first file if none selected
      if (res.data.length > 0 && selectedFileIdx === null) {
        setSelectedFileIdx(0);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to fetch files';
      setError(`Database connection issue: ${errorMessage}. Please check your database configuration.`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  useEffect(() => {
    gsap.fromTo(
      dbRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, []);

  const onDrop = async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        await axios.post(`${backendUrl}/database/upload`, formData, { headers });
        setError('');
      } catch (err) {
        console.error('Error uploading file:', err);
        const errorMessage = err.response?.data?.detail || `Failed to upload file: ${file.name}`;
        setError(`Upload failed: ${errorMessage}. Please try again or check your file format.`);
      }
    }
    fetchFiles();
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const handleView = (idx) => {
    setCurrentFileIdx(idx);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
  };

  const handlePrevFile = () => {
    setCurrentFileIdx((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  };

  const handleNextFile = () => {
    setCurrentFileIdx((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  };

  const handleDelete = async (fileId) => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await axios.delete(`${backendUrl}/database/delete/${fileId}`, { headers });
      await fetchFiles();
      setError('');
      
      // Reset selection if deleted file was selected
      if (selectedFileIdx !== null && selectedFileIdx >= files.length - 1) {
        setSelectedFileIdx(Math.max(0, files.length - 2));
      }
      
      // If the currently selected file was deleted, clear selection
      if (selectedFileIdx !== null && selectedFileIdx >= files.length) {
        setSelectedFileIdx(null);
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete file');
    }
  };

  const handleFileSelect = (idx) => {
    setSelectedFileIdx(idx);
  };

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const scrollAmount = 300; // Adjust based on card width + gap
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      setCarouselScroll(Math.max(0, carouselScroll - scrollAmount));
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setCarouselScroll(carouselScroll + scrollAmount);
    }
  };

  const currentFile = files[currentFileIdx];
  const selectedFile = selectedFileIdx !== null ? files[selectedFileIdx] : null;
  
  const getFileUrl = (file) => {
    if (file.url) {
      return file.url;
    }
    
    if (file.supabase_path) {
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${file.supabase_path}`;
    }
    
    if (file.path) {
      return file.path;
    }
    
    return null;
  };

  return (
    <Box sx={{
      // Force the entire page to scale within available space
      overflow: 'hidden'
    }}>
      <Box ref={dbRef} sx={{ 
        py: { xs: 3, md: 4 }, 
        background: '#F5F3EF',
        minHeight: '100vh'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4 
        }}>
          <StorageIcon sx={{ 
            fontSize: { xs: '32px', sm: '40px' }, 
            color: '#5A6570' 
          }} />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 600, 
              color: '#2A2A2A', 
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Database
          </Typography>
        </Box>
        
        {/* Upload Section - Large Screens Only */}
        {isLargeScreen && (
          <Card sx={{ 
            mb: 4, 
            borderRadius: '12px', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                mb: 3
              }}>
                <CloudUploadIcon sx={{ 
                  fontSize: { xs: '20px', sm: '24px' }, 
                  color: '#83c441' 
                }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Upload Project Files
                </Typography>
              </Box>
              <div 
                {...getRootProps()} 
                style={{ 
                  border: '2px dashed #5A6570', 
                  borderRadius: '12px', 
                  padding: '32px', 
                  textAlign: 'center', 
                  background: isDragActive ? 'rgba(90, 101, 112, 0.05)' : '#F8F9FA', 
                  cursor: 'pointer', 
                  marginBottom: '16px', 
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderColor: isDragActive ? '#4A5568' : '#5A6570'
                }}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <Typography sx={{ color: '#4A5568', fontWeight: 500 }}>
                    Drop the files here...
                  </Typography>
                ) : (
                  <Typography sx={{ color: '#5A6570' }}>
                    Drag & drop files here, or click to select files (multiple supported)
                  </Typography>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {error && (
          <Card sx={{ 
            mb: 3, 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <DescriptionIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#EF4444', 
                    fontWeight: 600 
                  }}
                >
                  Database Connection Issue
                </Typography>
              </Box>
              <Typography 
                sx={{ 
                  color: '#7F1D1D', 
                  mb: 2,
                  lineHeight: 1.5
                }}
              >
                {error}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#991B1B',
                  fontStyle: 'italic'
                }}
              >
                💡 Tip: This might be due to database schema changes. Try refreshing the page or contact support if the issue persists.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* File Management Section */}
        <>
          {/* Large Screen Layout - Keep exactly the same */}
          {isLargeScreen && (
            <Grid container spacing={3}>
              {/* File Carousel - Left column on large screens */}
              <Grid item xs={12} lg={2.4}>
                <Card sx={{ 
                  borderRadius: '12px', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  overflow: 'hidden',
                  height: 'calc(100vh - 300px)'
                }}>
                  <CardContent sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      mb: 3
                    }}>
                      <FolderIcon sx={{ 
                        fontSize: { xs: '20px', sm: '24px' }, 
                        color: '#F59E0B' 
                      }} />
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#2A2A2A',
                          letterSpacing: '-0.02em'
                        }}
                      >
                        Project Files
                      </Typography>
                    </Box>
                    
                    {/* Vertical List for large screens */}
                    <Box sx={{ 
                      height: 'calc(100% - 80px)', 
                      overflowY: 'auto',
                      pr: 1,
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#F3F4F6',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#D1D5DB',
                        borderRadius: '3px',
                      },
                    }}>
                      {files.length === 0 ? (
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 4,
                          color: '#6B7280'
                        }}>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            No files available
                          </Typography>
                          <Typography variant="body2">
                            Upload some files to get started
                          </Typography>
                        </Box>
                      ) : (
                        files.map((file, idx) => (
                          <Card
                            key={file.id}
                            onClick={() => handleFileSelect(idx)}
                            sx={{
                              cursor: 'pointer',
                              mb: 2,
                              border: selectedFileIdx === idx ? '2px solid #5A6570' : '1px solid #E5E7EB',
                              bgcolor: selectedFileIdx === idx ? 'rgba(90, 101, 112, 0.05)' : 'white',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateX(2px)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                {dayjs(file.created_at).format('MMM DD, YYYY')}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* File Viewer - Right column on large screens */}
              <Grid item xs={12} lg={9.6}>
                <Card sx={{ 
                  borderRadius: '12px', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  overflow: 'hidden',
                  height: 'calc(100vh - 300px)'
                }}>
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {selectedFile ? (
                      <>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 3,
                          pb: 2,
                          borderBottom: '1px solid #E5E7EB'
                        }}>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#2A2A2A',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {selectedFile.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleDelete(selectedFile.id)}
                              sx={{ 
                                color: '#EF4444',
                                borderColor: '#EF4444',
                                textTransform: 'none',
                                '&:hover': {
                                  borderColor: '#DC2626',
                                  backgroundColor: 'rgba(239, 68, 68, 0.04)'
                                }
                              }}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleView(selectedFileIdx)}
                              sx={{ 
                                bgcolor: '#5A6570',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#4A5568' }
                              }}
                            >
                              Full Screen
                            </Button>
                          </Box>
                        </Box>
                        
                        {/* File Preview */}
                        <Box sx={{ 
                          flexGrow: 1, 
                          overflow: 'auto',
                          bgcolor: '#F8F9FA',
                          borderRadius: 2,
                          p: 2,
                          border: '1px solid #E5E7EB'
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            minHeight: '300px'
                          }}>
                            <Typography variant="body1" sx={{ color: '#6B7280' }}>
                              File preview not available. Use "Full Screen" to view the file.
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        height: '100%',
                        textAlign: 'center',
                        color: '#6B7280'
                      }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Select a file to view
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                          Choose a file from the list to preview its contents
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Medium and Small Screen Layout - 2 Column */}
          {!isLargeScreen && (
            <>
              <Grid container spacing={3}>
                {/* Upload Section - Column 1 */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    borderRadius: '12px', 
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    overflow: 'hidden',
                    height: '400px'
                  }}>
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        mb: 3
                      }}>
                        <CloudUploadIcon sx={{ 
                          fontSize: { xs: '20px', sm: '24px' }, 
                          color: '#83c441' 
                        }} />
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#2A2A2A',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          Upload Files
                        </Typography>
                      </Box>
                      <div 
                        {...getRootProps()} 
                        style={{ 
                          border: '2px dashed #5A6570', 
                          borderRadius: '12px', 
                          padding: '32px', 
                          textAlign: 'center', 
                          background: isDragActive ? 'rgba(90, 101, 112, 0.05)' : '#F8F9FA', 
                          cursor: 'pointer', 
                          marginBottom: '16px', 
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          borderColor: isDragActive ? '#4A5568' : '#5A6570',
                          height: 'calc(100% - 80px)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <input {...getInputProps()} />
                        {isDragActive ? (
                          <Typography sx={{ color: '#4A5568', fontWeight: 500 }}>
                            Drop the files here...
                          </Typography>
                        ) : (
                          <Typography sx={{ color: '#5A6570' }}>
                            Drag & drop files here, or click to select files
                          </Typography>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>

                {/* File Selector Card - Column 2 */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    borderRadius: '12px', 
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    overflow: 'hidden',
                    height: '400px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                  onClick={() => setFileSelectorOpen(true)}
                  >
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        mb: 3
                      }}>
                        <FolderIcon sx={{ 
                          fontSize: { xs: '32px', sm: '40px' }, 
                          color: '#F59E0B' 
                        }} />
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#2A2A2A',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          Project Files
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B', mb: 1 }}>
                          {files.length}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#6B7280' }}>
                          {files.length === 1 ? 'File' : 'Files'} Available
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<FolderIcon />}
                        sx={{ 
                          bgcolor: '#F59E0B',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          '&:hover': { 
                            bgcolor: '#D97706',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        Browse Files
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* File Viewer for Medium and Small Screens */}
              <Card sx={{ 
                mt: 3,
                borderRadius: '12px', 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden',
                height: '500px'
              }}>
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {selectedFile ? (
                    <>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 3,
                        pb: 2,
                        borderBottom: '1px solid #E5E7EB'
                      }}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#2A2A2A',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {selectedFile.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleDelete(selectedFile.id)}
                            sx={{ 
                              color: '#EF4444',
                              borderColor: '#EF4444',
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: '#DC2626',
                                backgroundColor: 'rgba(239, 68, 68, 0.04)'
                              }
                            }}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleView(selectedFileIdx)}
                            sx={{ 
                              bgcolor: '#5A6570',
                              textTransform: 'none',
                              '&:hover': { bgcolor: '#4A5568' }
                            }}
                          >
                            Full Screen
                          </Button>
                        </Box>
                      </Box>
                      
                      {/* File Preview */}
                      <Box sx={{ 
                        flexGrow: 1, 
                        overflow: 'auto',
                        bgcolor: '#F8F9FA',
                        borderRadius: 2,
                        p: 2,
                        border: '1px solid #E5E7EB'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          minHeight: '300px'
                        }}>
                          <Typography variant="body1" sx={{ color: '#6B7280' }}>
                            File preview not available. Use "Full Screen" to view the file.
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      height: '100%',
                      textAlign: 'center',
                      color: '#6B7280'
                    }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Select a file to view
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        Choose a file from the list to preview its contents
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
        
        {/* Full Screen Modal */}
        <Modal open={viewerOpen} onClose={handleCloseViewer}>
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            bgcolor: 'background.paper', 
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', 
            p: 4, 
            minWidth: 400, 
            borderRadius: '12px', 
            transition: 'all 0.3s ease', 
            outline: 'none', 
            maxHeight: '90vh', 
            overflow: 'auto',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              pb: 2,
              borderBottom: '1px solid #E5E7EB'
            }}>
              <IconButton 
                onClick={handlePrevFile}
                sx={{ 
                  color: '#5A6570',
                  '&:hover': { background: 'rgba(90, 101, 112, 0.1)' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#2A2A2A',
                  letterSpacing: '-0.02em'
                }}
              >
                {currentFile?.name}
              </Typography>
              <IconButton 
                onClick={handleNextFile}
                sx={{ 
                  color: '#5A6570',
                  '&:hover': { background: 'rgba(90, 101, 112, 0.1)' }
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            
            {currentFile && (
              <Box sx={{ 
                width: '100%', 
                maxWidth: 600, 
                mx: 'auto', 
                height: '70vh', 
                overflow: 'auto', 
                background: '#F8F9FA', 
                borderRadius: '8px', 
                p: 2,
                border: '1px solid #E5E7EB'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Typography variant="body1" sx={{ color: '#6B7280' }}>
                    File preview not available. Please download the file to view its contents.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Modal>

        {/* File Selector Modal */}
        <Modal open={fileSelectorOpen} onClose={() => setFileSelectorOpen(false)}>
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            bgcolor: 'background.paper', 
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', 
            borderRadius: '12px', 
            transition: 'all 0.3s ease', 
            outline: 'none', 
            maxHeight: '90vh', 
            maxWidth: '90vw',
            width: { xs: '95vw', sm: '600px' },
            overflow: 'hidden',
            border: '1px solid rgba(229, 231, 235, 0.5)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              p: 3,
              pb: 2,
              borderBottom: '1px solid #E5E7EB'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FolderIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#2A2A2A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Select a File
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setFileSelectorOpen(false)}
                sx={{ 
                  color: '#6B7280',
                  '&:hover': { background: 'rgba(107, 114, 128, 0.1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ 
              p: 3,
              maxHeight: 'calc(90vh - 80px)',
              overflowY: 'auto'
            }}>
              {files.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  color: '#6B7280'
                }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    No files available
                  </Typography>
                  <Typography variant="body2">
                    Upload some files to get started
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {files.map((file, idx) => (
                    <Grid item xs={12} sm={6} key={file.id}>
                      <Card
                        onClick={() => {
                          handleFileSelect(idx);
                          setFileSelectorOpen(false);
                        }}
                        sx={{
                          cursor: 'pointer',
                          border: selectedFileIdx === idx ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                          bgcolor: selectedFileIdx === idx ? 'rgba(245, 158, 11, 0.05)' : 'white',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            borderColor: '#F59E0B'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <InsertDriveFileIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                wordBreak: 'break-word',
                                lineHeight: 1.2
                              }}
                            >
                              {file.name}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6B7280',
                              fontSize: '0.75rem'
                            }}
                          >
                            {dayjs(file.created_at).format('MMM DD, YYYY')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
}

export default Database;
