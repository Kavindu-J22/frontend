import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Movie,
  Schedule,
  EventSeat,
  AttachMoney,
  QrCode,
  Download,
  Home,
  Visibility,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../config/api';

interface BookingConfirmation {
  id: string;
  movieTitle: string;
  startTime: string;
  screenNumber: number;
  selectedSeats: string[];
  totalAmount: number;
  status: string;
  ticketId: string;
  qrCode?: string;
  createdAt: string;
}

const BookingConfirmation: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [booking, setBooking] = useState<BookingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingConfirmation();
    }
  }, [bookingId]);

  const fetchBookingConfirmation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${bookingId}`);
      if (response.data.success) {
        const bookingData = response.data.data;

        // Fetch ticket details if booking is confirmed
        if (bookingData.status === 'CONFIRMED' && bookingData.ticketId) {
          try {
            const ticketResponse = await api.get(`/tickets/${bookingData.ticketId}`);
            if (ticketResponse.data.success) {
              setBooking({
                ...bookingData,
                qrCode: ticketResponse.data.data.qrCode,
              });
            } else {
              setBooking(bookingData);
            }
          } catch (ticketError) {
            setBooking(bookingData);
          }
        } else {
          setBooking(bookingData);
        }
      }
    } catch (error: any) {
      setError('Failed to fetch booking confirmation');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDownloadTicket = () => {
    // In a real application, this would generate and download a PDF ticket
    alert('Download feature would be implemented here');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !booking) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Alert severity="error">
            {error || 'Booking confirmation not found'}
          </Alert>
        </Box>
      </Container>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Success Header */}
        <Box textAlign="center" mb={4}>
          <CheckCircle
            sx={{
              fontSize: 80,
              color: isConfirmed ? 'success.main' : 'warning.main',
              mb: 2
            }}
          />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            {isConfirmed ? 'Booking Confirmed!' : 'Booking Received'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isConfirmed
              ? 'Your movie tickets have been confirmed. Enjoy your show!'
              : 'Your booking is being processed. You will receive confirmation shortly.'
            }
          </Typography>
        </Box>

        {/* Booking Details Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Booking Details
              </Typography>
              <Chip
                label={booking.status.replace('_', ' ')}
                color={isConfirmed ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Movie sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    {booking.movieTitle}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule sx={{ mr: 1, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Show Time
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(booking.startTime)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Movie sx={{ mr: 1, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Screen
                    </Typography>
                    <Typography variant="body1">
                      Screen {booking.screenNumber}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <EventSeat sx={{ mr: 1, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Seats
                    </Typography>
                    <Typography variant="body1">
                      {booking.selectedSeats.join(', ')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ${booking.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="body2" color="text.secondary">
                Booking ID
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {booking.id.slice(-12).toUpperCase()}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* QR Code Ticket (Only for confirmed bookings) */}
        {isConfirmed && booking.qrCode && (
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
                <QrCode sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Your Ticket
                </Typography>
              </Box>

              <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default', display: 'inline-block' }}>
                <Box
                  component="img"
                  src={`data:image/png;base64,${booking.qrCode}`}
                  alt="QR Code Ticket"
                  sx={{ maxWidth: '200px', height: 'auto' }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                  Show this QR code at the cinema entrance
                </Typography>
              </Paper>

              <Alert severity="info" sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="body2">
                  <strong>Important Instructions:</strong><br />
                  • Arrive at least 15 minutes before show time<br />
                  • Present this QR code at the entrance<br />
                  • Keep your ticket safe until the end of the show<br />
                  • No outside food or beverages allowed
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadTicket}
                sx={{ mr: 2 }}
              >
                Download Ticket
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Visibility />}
            onClick={() => navigate('/my-bookings')}
          >
            View All Bookings
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Movie />}
            onClick={() => navigate('/movies')}
          >
            Browse More Movies
          </Button>
        </Box>

        {/* Additional Information */}
        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Booking Confirmed!</strong> A confirmation email has been sent to your registered email address.
            {isConfirmed && ' You can also view your ticket anytime from the "My Bookings" section.'}
          </Typography>
        </Alert>

        {!isConfirmed && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Payment Processing:</strong> Your payment is being processed.
              You will receive your ticket once the payment is confirmed.
            </Typography>
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default BookingConfirmation;
