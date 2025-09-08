import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const MyBookings: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Bookings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          My bookings page - Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default MyBookings;
