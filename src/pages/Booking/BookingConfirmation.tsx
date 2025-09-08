import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const BookingConfirmation: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Booking Confirmation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Booking confirmation page - Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default BookingConfirmation;
