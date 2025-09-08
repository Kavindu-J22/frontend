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
  showtimeId: string;
  userId: string;
  bookedSeatNumbers: string[];
  totalPrice: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  bookingReference: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields for display
  movieTitle?: string;
  startTime?: string;
  screenNumber?: number;
  qrCodeImageBase64?: string;
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

        // Fetch showtime details to get movie title and show time
        let showtimeDetails = null;
        try {
          const showtimeResponse = await api.get(`/showtimes/${bookingData.showtimeId}`);
          if (showtimeResponse.data.success) {
            showtimeDetails = showtimeResponse.data.data;
          }
        } catch (showtimeError) {
          console.error('Failed to fetch showtime details:', showtimeError);
        }

        // Fetch ticket details if booking is confirmed
        let ticketData = null;
        if (bookingData.status === 'CONFIRMED') {
          try {
            const ticketResponse = await api.get(`/tickets/booking/${bookingId}`);
            if (ticketResponse.data.success) {
              ticketData = ticketResponse.data.data;
            }
          } catch (ticketError) {
            console.error('Failed to fetch ticket details:', ticketError);
          }
        }

        // Combine all data
        setBooking({
          ...bookingData,
          movieTitle: showtimeDetails?.movieTitle || 'Unknown Movie',
          startTime: showtimeDetails?.startTime,
          screenNumber: showtimeDetails?.screenNumber,
          qrCodeImageBase64: ticketData?.qrCodeImageBase64,
        });
      }
    } catch (error: any) {
      console.error('Error fetching booking confirmation:', error);
      setError('Failed to fetch booking confirmation');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDownloadTicket = () => {
    if (!booking) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Movie Ticket</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .ticket {
            background: white;
            color: black;
            max-width: 600px;
            margin: 0 auto;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }
          .ticket-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .ticket-body {
            padding: 30px;
          }
          .movie-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .booking-ref {
            font-size: 16px;
            opacity: 0.9;
            font-family: monospace;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          .detail-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .detail-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .detail-value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          .qr-section {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .total-amount {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0;
            padding: 15px;
            border: 2px solid #667eea;
            border-radius: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <div class="movie-title">${booking.movieTitle || 'Movie Ticket'}</div>
            <div class="booking-ref">Booking: ${booking.bookingReference || booking.id}</div>
          </div>

          <div class="ticket-body">
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Show Time</div>
                <div class="detail-value">${booking.startTime ? formatDateTime(booking.startTime) : 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Screen</div>
                <div class="detail-value">Screen ${booking.screenNumber || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Seats</div>
                <div class="detail-value">${booking.bookedSeatNumbers.join(', ')}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">${booking.status}</div>
              </div>
            </div>

            <div class="total-amount">
              Total: LKR ${booking.totalPrice.toFixed(2)}
            </div>

            ${booking.qrCodeImageBase64 ? `
              <div class="qr-section">
                <div class="detail-label">Show this QR code at the cinema</div>
                <img src="data:image/png;base64,${booking.qrCodeImageBase64}"
                     alt="QR Code" style="max-width: 200px; margin-top: 10px;" />
              </div>
            ` : ''}

            <div class="footer">
              <p>Thank you for choosing our cinema!</p>
              <p>Please arrive 15 minutes before showtime</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
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
                      {booking.startTime ? formatDateTime(booking.startTime) : 'N/A'}
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
                      Screen {booking.screenNumber || 'N/A'}
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
                      {booking.bookedSeatNumbers.join(', ')}
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
                      LKR {booking.totalPrice.toFixed(2)}
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
        {isConfirmed && booking.qrCodeImageBase64 && (
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
                  src={`data:image/png;base64,${booking.qrCodeImageBase64}`}
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
