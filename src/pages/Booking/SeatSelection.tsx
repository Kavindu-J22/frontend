import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  EventSeat,
  Movie,
  Schedule,
  AttachMoney,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { fetchSeatAvailability, createBooking } from '../../store/slices/bookingSlice';
import api from '../../config/api';

interface SeatAvailability {
  totalSeats: number;
  bookedSeats: string[];
  availableSeats: string[];
}

interface ShowtimeDetails {
  id: string;
  movieId: string;
  movieTitle: string;
  startTime: string;
  endTime: string;
  screenNumber: number;
  ticketPrice: number;
  totalSeats: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const SeatSelection: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { seatAvailability, isLoading } = useSelector((state: RootState) => state.bookings);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showtimeDetails, setShowtimeDetails] = useState<ShowtimeDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (showtimeId) {
      fetchShowtimeDetails();
      dispatch(fetchSeatAvailability(showtimeId) as any);
    }
  }, [showtimeId, dispatch]);

  const fetchShowtimeDetails = async () => {
    try {
      const response = await api.get(`/showtimes/${showtimeId}`);
      if (response.data.success) {
        setShowtimeDetails(response.data.data);
        setError(null);
      }
    } catch (error: any) {
      console.error('Error fetching showtime details:', error);
      setError('Failed to load showtime details. Please try again.');
    }
  };

  const generateSeatLayout = () => {
    if (!seatAvailability) return [];

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = Math.ceil(seatAvailability.totalSeats / rows.length);
    const layout = [];

    for (let i = 0; i < rows.length; i++) {
      const row = [];
      for (let j = 1; j <= seatsPerRow; j++) {
        const seatId = `${rows[i]}${j}`;
        if (seatAvailability.availableSeats.includes(seatId) ||
            seatAvailability.bookedSeats.includes(seatId)) {
          row.push(seatId);
        }
      }
      if (row.length > 0) {
        layout.push(row);
      }
    }
    return layout;
  };

  const getSeatStatus = (seatId: string) => {
    if (selectedSeats.includes(seatId)) return 'selected';
    if (seatAvailability?.bookedSeats.includes(seatId)) return 'booked';
    return 'available';
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'selected':
        return '#4caf50';
      case 'booked':
        return '#f44336';
      case 'available':
        return '#e0e0e0';
      default:
        return '#e0e0e0';
    }
  };

  const handleSeatClick = (seatId: string) => {
    const status = getSeatStatus(seatId);
    if (status === 'booked') return;

    if (status === 'selected') {
      setSelectedSeats(prev => prev.filter(seat => seat !== seatId));
    } else {
      if (selectedSeats.length < 8) { // Max 8 seats per booking
        setSelectedSeats(prev => [...prev, seatId]);
      } else {
        setError('Maximum 8 seats can be selected');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        showtimeId: showtimeId!,
        seatNumbers: selectedSeats,
      };

      const response = await dispatch(createBooking(bookingData) as any);
      if (response.payload && response.payload.id) {
        navigate(`/payment/${response.payload.id}`);
      }
    } catch (error: any) {
      setError('Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!showtimeDetails || !seatAvailability) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Alert severity="error">
            Failed to load showtime details. Please try again.
          </Alert>
        </Box>
      </Container>
    );
  }

  const seatLayout = generateSeatLayout();
  const totalPrice = selectedSeats.length * showtimeDetails.ticketPrice;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Select Your Seats
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Movie Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Movie sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {showtimeDetails.movieTitle}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <Schedule sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        {formatDateTime(showtimeDetails.startTime)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <Movie sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        Screen {showtimeDetails.screenNumber}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center">
                      <AttachMoney sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body2">
                        LKR {showtimeDetails.ticketPrice} per seat
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Seat Layout */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                Screen
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: '8px',
                  bgcolor: 'primary.main',
                  borderRadius: '4px',
                  mb: 4,
                }}
              />

              <Box sx={{ mb: 3 }}>
                {seatLayout.map((row, rowIndex) => (
                  <Box
                    key={rowIndex}
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 1,
                      gap: 1,
                    }}
                  >
                    {row.map((seatId) => (
                      <Button
                        key={seatId}
                        variant="outlined"
                        size="small"
                        onClick={() => handleSeatClick(seatId)}
                        disabled={getSeatStatus(seatId) === 'booked'}
                        sx={{
                          minWidth: '40px',
                          height: '40px',
                          bgcolor: getSeatColor(getSeatStatus(seatId)),
                          color: getSeatStatus(seatId) === 'available' ? 'text.primary' : 'white',
                          border: '1px solid #ccc',
                          '&:hover': {
                            bgcolor: getSeatStatus(seatId) === 'available' ? '#d0d0d0' : undefined,
                          },
                          '&.Mui-disabled': {
                            bgcolor: getSeatColor('booked'),
                            color: 'white',
                          },
                        }}
                      >
                        {seatId}
                      </Button>
                    ))}
                  </Box>
                ))}
              </Box>

              {/* Legend */}
              <Box display="flex" justifyContent="center" gap={3} flexWrap="wrap">
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: '#e0e0e0',
                      border: '1px solid #ccc',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Available</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: '#4caf50',
                      border: '1px solid #ccc',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Selected</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: '#f44336',
                      border: '1px solid #ccc',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Booked</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Booking Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Booking Summary
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected Seats
                </Typography>
                <Typography variant="body1">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Number of Seats
                </Typography>
                <Typography variant="body1">
                  {selectedSeats.length}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Price per Seat
                </Typography>
                <Typography variant="body1">
                  LKR {showtimeDetails.ticketPrice.toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Total Amount: LKR {totalPrice.toFixed(2)}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0 || bookingLoading}
                startIcon={bookingLoading ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => navigate(-1)}
                sx={{ mt: 2 }}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>

              {selectedSeats.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    You have selected {selectedSeats.length} seat(s).
                    Please proceed to payment within 10 minutes to confirm your booking.
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SeatSelection;
