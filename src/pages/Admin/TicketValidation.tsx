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
  const [bookingId, setBookingId] = useState('');
  const [validationType, setValidationType] = useState<'qr' | 'booking'>('qr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);

  const handleValidateTicket = async () => {
    if (validationType === 'qr' && !qrCodeData.trim()) {
      setError('Please enter QR code data');
      return;
    }

    if (validationType === 'booking' && !bookingId.trim()) {
      setError('Please enter booking ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setTicketDetails(null);

    try {
      if (validationType === 'qr') {
        const response = await api.post('/tickets/validate', null, {
          params: { qrCodeData: qrCodeData.trim() }
        });

        if (response.data.success) {
          setTicketDetails(response.data.data);
          setSuccess('Ticket validated successfully!');
        }
      } else {
        // Validate by booking ID or booking reference
        let bookingData = null;
        let actualBookingId = bookingId.trim();

        try {
          // First try to get booking by ID directly
          let bookingResponse;
          try {
            bookingResponse = await api.get(`/bookings/${actualBookingId}`);
            bookingData = bookingResponse.data.data;
          } catch (directError: any) {
            if (directError.response?.status === 404) {
              // If not found by ID, try to search by booking reference
              try {
                const searchResponse = await api.get(`/admin/bookings/search`, {
                  params: { bookingReference: actualBookingId }
                });
                if (searchResponse.data.success && searchResponse.data.data.length > 0) {
                  bookingData = searchResponse.data.data[0];
                  actualBookingId = bookingData.id; // Use the actual ID for further operations
                } else {
                  throw new Error('Booking not found by reference');
                }
              } catch (referenceError) {
                // If both direct ID and reference search fail, show error
                setError(`Booking ID/Reference "${bookingId.trim()}" not found. Please check the booking ID or reference.`);
                return;
              }
            } else {
              throw directError;
            }
          }

          if (bookingData.status !== 'CONFIRMED') {
            setError(`Booking found but not confirmed. Status: ${bookingData.status}. Tickets are only generated for confirmed bookings.`);
            return;
          }

          // Now try to get the ticket using the actual booking ID
          try {
            const ticketResponse = await api.get(`/tickets/booking/${actualBookingId}`);
            const showtimeResponse = await api.get(`/showtimes/${bookingData.showtimeId}`);

            // Combine ticket and booking data
            const ticketData = ticketResponse.data.data;
            const showtimeData = showtimeResponse.data.data;

            setTicketDetails({
              ...ticketData,
              booking: {
                ...bookingData,
                showtime: {
                  movieTitle: showtimeData.movieTitle,
                  startTime: showtimeData.startTime,
                  screenNumber: showtimeData.screenNumber,
                }
              }
            });
            setSuccess('Ticket found and validated successfully!');
            return;

          } catch (ticketError: any) {
            if (ticketError.response?.status === 404) {
              // Ticket doesn't exist for confirmed booking - try to generate it
              try {
                setError('Ticket not found. Attempting to generate ticket for confirmed booking...');

                // Try to generate the ticket by calling the backend
                const generateResponse = await api.post(`/admin/tickets/generate/${actualBookingId}`);

                if (generateResponse.data.success) {
                  // Now try to get the newly generated ticket
                  const newTicketResponse = await api.get(`/tickets/booking/${actualBookingId}`);
                  const showtimeResponse = await api.get(`/showtimes/${bookingData.showtimeId}`);

                  const ticketData = newTicketResponse.data.data;
                  const showtimeData = showtimeResponse.data.data;

                  setTicketDetails({
                    ...ticketData,
                    booking: {
                      ...bookingData,
                      showtime: {
                        movieTitle: showtimeData.movieTitle,
                        startTime: showtimeData.startTime,
                        screenNumber: showtimeData.screenNumber,
                      }
                    }
                  });
                  setSuccess('Ticket generated and validated successfully!');
                  setError(null);
                  return;
                }
              } catch (generateError: any) {
                console.error('Failed to generate ticket:', generateError);
                // If the generate endpoint doesn't exist or fails, show a helpful message
                setError(`Booking ID ${actualBookingId} is confirmed but no ticket exists. This can happen if:
                1. The payment was processed but ticket generation failed
                2. There was a system error during ticket creation
                3. The booking was manually confirmed without payment

Please check the payment status and contact system administrator if needed.`);
                return;
              }
            } else {
              setError(`Error retrieving ticket: ${ticketError.response?.data?.message || ticketError.message}`);
              return;
            }
          }

        } catch (bookingError: any) {
          setError(`Error validating booking: ${bookingError.response?.data?.message || bookingError.message}`);
          return;
        }
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
    setBookingId('');
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

        {/* Validation Type Selector */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Validation Method
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant={validationType === 'qr' ? 'contained' : 'outlined'}
                  fullWidth
                  startIcon={<QrCodeScanner />}
                  onClick={() => setValidationType('qr')}
                >
                  QR Code Validation
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant={validationType === 'booking' ? 'contained' : 'outlined'}
                  fullWidth
                  startIcon={<CheckCircle />}
                  onClick={() => setValidationType('booking')}
                >
                  Booking ID Validation
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Validation Input */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              {validationType === 'qr' ? (
                <QrCodeScanner sx={{ mr: 2, color: 'primary.main' }} />
              ) : (
                <CheckCircle sx={{ mr: 2, color: 'primary.main' }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {validationType === 'qr' ? 'Enter QR Code Data' : 'Enter Booking ID'}
              </Typography>
            </Box>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                {validationType === 'qr' ? (
                  <TextField
                    fullWidth
                    label="QR Code Data"
                    value={qrCodeData}
                    onChange={(e) => setQrCodeData(e.target.value)}
                    placeholder="MOVIE_TICKET:booking_id:timestamp"
                    disabled={loading}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Booking ID or Reference"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="Enter booking reference (e.g., BK1234567890) or full booking ID"
                    disabled={loading}
                    helperText="You can use either the booking reference (BK...) or the full booking ID from the ticket"
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    onClick={handleValidateTicket}
                    disabled={loading || (validationType === 'qr' ? !qrCodeData.trim() : !bookingId.trim())}
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
                        LKR {ticketDetails.booking.totalPrice.toFixed(2)}
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
