import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const MovieDetails: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Movie Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Movie details page - Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default MovieDetails;
