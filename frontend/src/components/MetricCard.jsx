import React from 'react';
import { Card, CardContent, Typography, Box, Link } from '@mui/material';

function MetricCard({ title, content }) {
  return (
    <Card sx={{ minWidth: 200, mb: 2, height: '100%' }} elevation={2}>
      <CardContent>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box>
          {title === 'News' && Array.isArray(content) ? (
            content.length === 0 ? (
              <Typography variant="body2">No news available.</Typography>
            ) : (
              content.map((story, idx) => (
                <Box key={idx} sx={{ mb: 1 }}>
                  <Link href={story.url} target="_blank" rel="noopener noreferrer" underline="hover">
                    {story.title}
                  </Link>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {story.source}
                  </Typography>
                </Box>
              ))
            )
          ) : (
            <Typography variant="h6">{content}</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default MetricCard;
