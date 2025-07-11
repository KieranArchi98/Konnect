import React, { useRef, useState, useEffect } from 'react';
import FileCard from './FileCard.jsx';
import { Box, Typography, Button, Card, CardContent, Grid, Modal, IconButton } from '@mui/material';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useDropzone } from 'react-dropzone';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function Database() {
  const fileInput = useRef();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${backendUrl}/database/files`);
      setFiles(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch files');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const onDrop = async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await axios.post(`${backendUrl}/database/upload`, formData);
        setError('');
      } catch (err) {
        setError(err.response?.data?.detail || `Failed to upload file: ${file.name}`);
      }
    }
    fetchFiles();
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const handleView = (idx) => {
    setCurrentFileIdx(idx);
    setPageNumber(1);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setNumPages(null);
    setPageNumber(1);
  };

  const handlePrevFile = () => {
    setCurrentFileIdx((prev) => (prev > 0 ? prev - 1 : files.length - 1));
    setPageNumber(1);
  };

  const handleNextFile = () => {
    setCurrentFileIdx((prev) => (prev < files.length - 1 ? prev + 1 : 0));
    setPageNumber(1);
  };

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`${backendUrl}/database/delete/${fileId}`);
      fetchFiles();
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete file');
    }
  };

  const currentFile = files[currentFileIdx];
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const getFileUrl = (file) => file && file.supabase_path ? `${supabaseUrl}/storage/v1/object/public/${file.supabase_path}` : '';

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>Database</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Upload Project Files</Typography>
          <div {...getRootProps()} style={{ border: '2px dashed #888', borderRadius: 8, padding: 24, textAlign: 'center', background: isDragActive ? '#e3f2fd' : '#fafafa', cursor: 'pointer', marginBottom: 8 }}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <Typography>Drop the files here ...</Typography>
            ) : (
              <Typography>Drag & drop files here, or click to select files (multiple supported)</Typography>
            )}
          </div>
        </CardContent>
      </Card>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={2} columns={12}>
        {files.map((file, idx) => (
          <Grid key={file.id} xs={12} sm={6} md={4}>
            <FileCard file={file} onView={() => handleView(idx)} onDelete={() => handleDelete(file.id)} />
          </Grid>
        ))}
      </Grid>
      <Modal open={viewerOpen} onClose={handleCloseViewer}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', boxShadow: 24, p: 4, minWidth: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handlePrevFile}><ArrowBackIcon /></IconButton>
            <Typography variant="h6">{currentFile?.name}</Typography>
            <IconButton onClick={handleNextFile}><ArrowForwardIcon /></IconButton>
          </Box>
          {currentFile && currentFile.supabase_path && (
            <Document
              file={getFileUrl(currentFile)}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={console.error}
            >
              <Page pageNumber={pageNumber} />
            </Document>
          )}
          {numPages && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
              <Button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>Prev Page</Button>
              <Typography sx={{ mx: 2 }}>{pageNumber} / {numPages}</Typography>
              <Button onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>Next Page</Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

export default Database;
