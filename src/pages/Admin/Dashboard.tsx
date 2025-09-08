import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const AdminDashboard: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Admin dashboard - Coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
