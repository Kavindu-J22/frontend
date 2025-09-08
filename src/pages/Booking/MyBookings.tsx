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

interface Booking {
  id: string;
  movieTitle: string;
  moviePoster?: string;
  showtimeId: string;
  startTime: string;
  screenNumber: number;
  selectedSeats: string[];
  totalAmount: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  ticketId?: string;
  qrCode?: string;
}

const MyBookings: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
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
        setBookings(response.data.data || []);
      }
    } catch (error: any) {
      setError('Failed to fetch bookings');
      console.error('Fetch bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (booking: Booking) => {
    if (booking.status === 'CONFIRMED' && booking.ticketId) {
      try {
        const response = await api.get(`/tickets/${booking.ticketId}`);
        if (response.data.success) {
          setSelectedBooking({
            ...booking,
            qrCode: response.data.data.qrCode,
          });
          setTicketDialog(true);
        }
      } catch (error: any) {
        setError('Failed to fetch ticket details');
      }
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.put(`/bookings/${bookingId}/cancel`);
        fetchBookings(); // Refresh bookings
      } catch (error: any) {
        setError('Failed to cancel booking');
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
                          {formatDateTime(booking.startTime)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Movie sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          Screen {booking.screenNumber}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <EventSeat sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          Seats: {booking.selectedSeats.join(', ')}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${booking.totalAmount.toFixed(2)}
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
                        {formatDateTime(selectedBooking.startTime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Screen
                      </Typography>
                      <Typography variant="body1">
                        Screen {selectedBooking.screenNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Seats
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.selectedSeats.join(', ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ${selectedBooking.totalAmount.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {selectedBooking.qrCode && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        component="img"
                        src={`data:image/png;base64,${selectedBooking.qrCode}`}
                        alt="QR Code"
                        sx={{ maxWidth: '200px', height: 'auto' }}
                      />
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Show this QR code at the cinema
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Booking ID: {selectedBooking.id.slice(-8).toUpperCase()}
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
              onClick={() => {
                // In a real app, this would generate and download a PDF ticket
                alert('Download feature would be implemented here');
              }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default MyBookings;
