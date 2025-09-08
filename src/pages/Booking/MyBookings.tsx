import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Movie,
  Schedule,
  EventSeat,
  AttachMoney,
  QrCode,
  Cancel,
  Visibility,
  Download,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../config/api';

interface BookingWithDetails {
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

const MyBookings: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [ticketDialog, setTicketDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/my-bookings');
      if (response.data.success) {
        const bookingsData = response.data.data || [];

        // Fetch showtime details for each booking
        const bookingsWithDetails = await Promise.all(
          bookingsData.map(async (booking: any) => {
            try {
              const showtimeResponse = await api.get(`/showtimes/${booking.showtimeId}`);
              if (showtimeResponse.data.success) {
                const showtimeData = showtimeResponse.data.data;
                return {
                  ...booking,
                  movieTitle: showtimeData.movieTitle || 'Unknown Movie',
                  startTime: showtimeData.startTime,
                  screenNumber: showtimeData.screenNumber,
                };
              }
            } catch (showtimeError) {
              console.error('Failed to fetch showtime details:', showtimeError);
            }
            return {
              ...booking,
              movieTitle: 'Unknown Movie',
            };
          })
        );

        setBookings(bookingsWithDetails);
      }
    } catch (error: any) {
      setError('Failed to fetch bookings');
      console.error('Fetch bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (booking: BookingWithDetails) => {
    if (booking.status === 'CONFIRMED') {
      try {
        const response = await api.get(`/tickets/booking/${booking.id}`);
        if (response.data.success) {
          setSelectedBooking({
            ...booking,
            qrCodeImageBase64: response.data.data.qrCodeImageBase64,
          });
          setTicketDialog(true);
        }
      } catch (error: any) {
        setError('Failed to fetch ticket details');
        console.error('Ticket fetch error:', error);
      }
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.delete(`/bookings/${bookingId}`);
        fetchBookings(); // Refresh bookings
      } catch (error: any) {
        setError('Failed to cancel booking');
        console.error('Cancel booking error:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING_PAYMENT':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadTicketPDF = (booking: BookingWithDetails) => {
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Bookings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {bookings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Movie sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No bookings found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You haven't made any movie bookings yet. Start by browsing our movies!
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => window.location.href = '/movies'}
            >
              Browse Movies
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {bookings.map((booking) => (
              <Grid item xs={12} md={6} key={booking.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {booking.movieTitle}
                      </Typography>
                      <Chip
                        label={booking.status.replace('_', ' ')}
                        color={getStatusColor(booking.status) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Schedule sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {booking.startTime ? formatDateTime(booking.startTime) : 'N/A'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Movie sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          Screen {booking.screenNumber || 'N/A'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <EventSeat sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          Seats: {booking.bookedSeatNumbers.join(', ')}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          LKR {booking.totalPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Booked on: {formatDateTime(booking.createdAt)}
                      </Typography>
                      <Box>
                        {booking.status === 'CONFIRMED' && (
                          <Button
                            size="small"
                            startIcon={<QrCode />}
                            onClick={() => handleViewTicket(booking)}
                            sx={{ mr: 1 }}
                          >
                            View Ticket
                          </Button>
                        )}
                        {booking.status === 'PENDING_PAYMENT' && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Ticket Dialog */}
        <Dialog
          open={ticketDialog}
          onClose={() => setTicketDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <QrCode sx={{ mr: 1 }} />
              Movie Ticket
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedBooking && (
              <Box sx={{ textAlign: 'center' }}>
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {selectedBooking.movieTitle}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.startTime ? formatDateTime(selectedBooking.startTime) : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Screen
                      </Typography>
                      <Typography variant="body1">
                        Screen {selectedBooking.screenNumber || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Seats
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.bookedSeatNumbers.join(', ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        LKR {selectedBooking.totalPrice.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {selectedBooking.qrCodeImageBase64 && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        component="img"
                        src={`data:image/png;base64,${selectedBooking.qrCodeImageBase64}`}
                        alt="QR Code"
                        sx={{ maxWidth: '200px', height: 'auto' }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Show this QR code at the cinema
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Booking Reference: {selectedBooking.bookingReference || selectedBooking.id.slice(-8).toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Booking ID: {selectedBooking.id}
                  </Typography>
                </Paper>

                <Alert severity="info" sx={{ textAlign: 'left' }}>
                  <Typography variant="body2">
                    <strong>Important:</strong> Please arrive at least 15 minutes before the show time.
                    Present this QR code at the entrance for verification.
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTicketDialog(false)}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => selectedBooking && downloadTicketPDF(selectedBooking)}
              disabled={!selectedBooking}
            >
              Download PDF
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default MyBookings;
