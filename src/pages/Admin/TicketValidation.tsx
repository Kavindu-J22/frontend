import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Cancel,
  Movie,
  Schedule,
  EventSeat,
  Person,
} from '@mui/icons-material';
import api from '../../config/api';

interface TicketDetails {
  id: string;
  bookingId: string;
  qrCodeData: string;
  generatedAt: string;
  valid: boolean;
  booking?: {
    id: string;
    userId: string;
    bookedSeatNumbers: string[];
    totalPrice: number;
    status: string;
    bookingReference: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    showtime?: {
      movieTitle: string;
      startTime: string;
      screenNumber: number;
    };
  };
}

const TicketValidation: React.FC = () => {
  const [qrCodeData, setQrCodeData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);

  const handleValidateTicket = async () => {
    if (!qrCodeData.trim()) {
      setError('Please enter QR code data');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setTicketDetails(null);

    try {
      const response = await api.post('/tickets/validate', null, {
        params: { qrCodeData: qrCodeData.trim() }
      });

      if (response.data.success) {
        setTicketDetails(response.data.data);
        setSuccess('Ticket validated successfully!');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to validate ticket');
      console.error('Ticket validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setQrCodeData('');
    setError(null);
    setSuccess(null);
    setTicketDetails(null);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Ticket Validation
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Scan or enter QR code data to validate movie tickets
        </Typography>

        {/* QR Code Input */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <QrCodeScanner sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Enter QR Code Data
              </Typography>
            </Box>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="QR Code Data"
                  value={qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  placeholder="MOVIE_TICKET:booking_id:timestamp"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    onClick={handleValidateTicket}
                    disabled={loading || !qrCodeData.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    fullWidth
                  >
                    {loading ? 'Validating...' : 'Validate'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearForm}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Ticket Details */}
        {ticketDetails && (
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Ticket Details
                </Typography>
                <Chip
                  label={ticketDetails.valid ? 'VALID' : 'INVALID'}
                  color={ticketDetails.valid ? 'success' : 'error'}
                  icon={ticketDetails.valid ? <CheckCircle /> : <Cancel />}
                />
              </Box>

              {ticketDetails.booking && (
                <>
                  {/* Movie Information */}
                  <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Movie sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {ticketDetails.booking.showtime?.movieTitle || 'Unknown Movie'}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Schedule sx={{ mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Show Time
                            </Typography>
                            <Typography variant="body1">
                              {ticketDetails.booking.showtime?.startTime 
                                ? formatDateTime(ticketDetails.booking.showtime.startTime)
                                : 'N/A'
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Movie sx={{ mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Screen
                            </Typography>
                            <Typography variant="body1">
                              Screen {ticketDetails.booking.showtime?.screenNumber || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <EventSeat sx={{ mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Seats
                            </Typography>
                            <Typography variant="body1">
                              {ticketDetails.booking.bookedSeatNumbers.join(', ')}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Person sx={{ mr: 1, fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Customer
                            </Typography>
                            <Typography variant="body1">
                              {ticketDetails.booking.user 
                                ? `${ticketDetails.booking.user.firstName} ${ticketDetails.booking.user.lastName}`
                                : 'N/A'
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Divider sx={{ my: 2 }} />

                  {/* Booking Information */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Booking Reference
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {ticketDetails.booking.bookingReference}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ${ticketDetails.booking.totalPrice.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Booking Status
                      </Typography>
                      <Chip
                        label={ticketDetails.booking.status}
                        color={ticketDetails.booking.status === 'CONFIRMED' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ticket Generated
                      </Typography>
                      <Typography variant="body1">
                        {formatDateTime(ticketDetails.generatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}

              {!ticketDetails.valid && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Invalid Ticket:</strong> This ticket is not valid for entry. 
                    Please check with the customer or contact support.
                  </Typography>
                </Alert>
              )}

              {ticketDetails.valid && ticketDetails.booking?.status !== 'CONFIRMED' && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Booking Not Confirmed:</strong> The associated booking is not confirmed. 
                    Please verify payment status.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default TicketValidation;
