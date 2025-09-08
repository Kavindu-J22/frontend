import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const SeatSelection: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Seat Selection
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Seat selection page - Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default SeatSelection;
