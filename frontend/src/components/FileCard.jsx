import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function FileCard({ file, onView, onDelete }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const getFileUrl = (file) => file && file.supabase_path ? `${supabaseUrl}/storage/v1/object/public/${file.supabase_path}` : '';
  const fileUrl = getFileUrl(file);
  const ext = file.name.split('.').pop().toLowerCase();

  let preview = null;
  if (ext === 'pdf') {
    preview = (
      <div style={{ height: 120 }}>
        <Document file={fileUrl} loading={<InsertDriveFileIcon sx={{ fontSize: 48, color: '#aaa' }} />} noData={<InsertDriveFileIcon sx={{ fontSize: 48, color: '#aaa' }} />}>
          <Page pageNumber={1} width={100} />
        </Document>
      </div>
    );
  } else if (ext === 'docx' && file.content) {
    preview = (
      <Typography variant="body2" sx={{ mb: 1, maxHeight: 60, overflow: 'hidden' }}>
        {file.content.slice(0, 200)}{file.content.length > 200 ? '...' : ''}
      </Typography>
    );
  } else {
    preview = <InsertDriveFileIcon sx={{ fontSize: 48, color: '#aaa', mb: 1 }} />;
  }

  return (
    <Card sx={{ minWidth: 200, mb: 2 }} elevation={2}>
      <CardContent>
        {preview}
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {file.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button variant="outlined" color="error" size="small" onClick={onDelete}>Delete</Button>
          <Button variant="contained" color="primary" size="small" onClick={onView}>View</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default FileCard;
