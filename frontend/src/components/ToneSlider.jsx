import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Slider, 
  Typography
} from '@mui/material';

const TONE_LEVELS = {
  1: { label: 'Very Informal', color: '#E57373' },
  2: { label: 'Informal', color: '#FFB74D' },
  3: { label: 'Neutral', color: '#81C784' },
  4: { label: 'Professional', color: '#64B5F6' },
  5: { label: 'Very Professional', color: '#9575CD' }
};

function ToneSlider({ value, onChange, disabled = false }) {
  const [currentTone, setCurrentTone] = useState(TONE_LEVELS[value] || TONE_LEVELS[3]);

  useEffect(() => {
    setCurrentTone(TONE_LEVELS[value] || TONE_LEVELS[3]);
  }, [value]);

  const handleSliderChange = (event, newValue) => {
    onChange(newValue);
  };

  const marks = Object.keys(TONE_LEVELS).map(level => ({
    value: parseInt(level),
    label: ''
  }));

  return (
    <Box sx={{ 
      p: 1,
      borderTop: '1px solid #E5E7EB',
      background: '#F8F9FA'
    }}>
      {/* Minimalistic Slider */}
      <Box sx={{ px: 1, py: 0.5 }}>
        <Slider
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          min={1}
          max={5}
          step={1}
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => TONE_LEVELS[value]?.label || 'Unknown'}
          sx={{
            '& .MuiSlider-track': {
              background: `linear-gradient(90deg, ${TONE_LEVELS[1].color} 0%, ${TONE_LEVELS[2].color} 25%, ${TONE_LEVELS[3].color} 50%, ${TONE_LEVELS[4].color} 75%, ${TONE_LEVELS[5].color} 100%)`,
              height: 3,
              borderRadius: 1.5
            },
            '& .MuiSlider-rail': {
              background: '#E5E7EB',
              height: 3,
              borderRadius: 1.5
            },
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              background: currentTone.color,
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                transform: 'scale(1.1)'
              },
              '&.Mui-focusVisible': {
                boxShadow: `0 0 0 4px ${currentTone.color}20`
              }
            },
            '& .MuiSlider-mark': {
              background: '#9CA3AF',
              width: 4,
              height: 4,
              borderRadius: '50%',
              '&.MuiSlider-markActive': {
                background: currentTone.color
              }
            }
          }}
        />
      </Box>
      
      {/* Current Tone Label */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block',
          textAlign: 'center',
          color: currentTone.color,
          fontWeight: 500,
          fontSize: '11px',
          mt: 0.5
        }}
      >
        {currentTone.label}
      </Typography>
    </Box>
  );
}

export default ToneSlider; 