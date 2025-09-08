import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CreditCard,
  Security,
  CheckCircle,
  Movie,
  Schedule,
  EventSeat,
  AttachMoney,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { processPayment } from '../../store/slices/bookingSlice';
import api from '../../config/api';

interface BookingDetails {
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
}

const Payment: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { payment, isLoading } = useSelector((state: RootState) => state.bookings);

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
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

        // Combine booking data with showtime details
        setBookingDetails({
          ...bookingData,
          movieTitle: showtimeDetails?.movieTitle || 'Unknown Movie',
          startTime: showtimeDetails?.startTime,
          screenNumber: showtimeDetails?.screenNumber,
        });
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      setError('Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const validateForm = () => {
    const { cardNumber, cardholderName, expiryMonth, expiryYear, cvv } = paymentForm;

    // Card number must be exactly 16 digits
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber || cleanCardNumber.length !== 16 || !/^\d{16}$/.test(cleanCardNumber)) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }

    // Cardholder name validation
    if (!cardholderName.trim() || cardholderName.trim().length < 2 || cardholderName.trim().length > 50) {
      setError('Please enter a valid cardholder name (2-50 characters)');
      return false;
    }

    // Expiry month must be 01-12
    if (!expiryMonth || !/^(0[1-9]|1[0-2])$/.test(expiryMonth)) {
      setError('Please select a valid expiry month (01-12)');
      return false;
    }

    // Expiry year must be 4 digits
    if (!expiryYear || !/^\d{4}$/.test(expiryYear)) {
      setError('Please select a valid expiry year');
      return false;
    }

    // CVV must be 3 or 4 digits
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      setError('Please enter a valid CVV (3 or 4 digits)');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setPaymentProcessing(true);
    setError(null);

    try {
      const paymentData = {
        cardNumber: paymentForm.cardNumber.replace(/\s/g, ''),
        cardHolderName: paymentForm.cardholderName,
        expiryMonth: paymentForm.expiryMonth.padStart(2, '0'), // Ensure 2-digit format
        expiryYear: paymentForm.expiryYear,
        cvv: paymentForm.cvv,
      };

      console.log('Payment data being sent:', paymentData);
      console.log('Booking ID:', bookingId);

      const response = await dispatch(processPayment({
        bookingId: bookingId!,
        paymentData
      }) as any);

      if (response.payload && response.payload.success) {
        navigate(`/booking-confirmation/${bookingId}`);
      } else {
        const errorMessage = response.payload?.message || response.payload?.error || 'Payment failed. Please try again.';
        console.error('Payment failed:', response.payload);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Payment processing failed. Please try again.';
      setError(errorMessage);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear + i);
    }
    return years;
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

  if (!bookingDetails) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Alert severity="error">
            Booking not found. Please try again.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Complete Your Payment
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Booking Summary */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Booking Summary
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Movie sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      {bookingDetails.movieTitle}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Schedule sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      {bookingDetails.startTime ? formatDateTime(bookingDetails.startTime) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Movie sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      Screen {bookingDetails.screenNumber || 'N/A'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EventSeat sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      Seats: {bookingDetails.bookedSeatNumbers?.join(', ') || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    LKR {bookingDetails.totalPrice.toFixed(2)}
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Your seats are reserved for 10 minutes. Please complete the payment to confirm your booking.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Form */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <CreditCard sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Payment Details
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    value={paymentForm.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    inputProps={{ maxLength: 19 }}
                    InputProps={{
                      startAdornment: <CreditCard sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cardholder Name"
                    value={paymentForm.cardholderName}
                    onChange={(e) => handleInputChange('cardholderName', e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                  />
                </Grid>

                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={paymentForm.expiryMonth}
                      onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <MenuItem key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={paymentForm.expiryYear}
                      onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                    >
                      {generateYears().map((year) => (
                        <MenuItem key={year} value={year.toString()}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="CVV"
                    value={paymentForm.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    inputProps={{ maxLength: 4 }}
                    InputProps={{
                      startAdornment: <Security sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
                <Typography variant="body2">
                  <strong>Test Cards:</strong><br />
                  Success: 4111111111111111, 5555555555554444<br />
                  Failure: 2111111111111111, 1111111111111111
                </Typography>
              </Alert>

              <Box display="flex" gap={2} mt={4}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(-1)}
                  sx={{ flex: 1 }}
                >
                  Back to Seats
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePayment}
                  disabled={paymentProcessing}
                  startIcon={paymentProcessing ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ flex: 2 }}
                >
                  {paymentProcessing ? 'Processing Payment...' : `Pay LKR ${bookingDetails.totalPrice.toFixed(2)}`}
                </Button>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Security sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Secure Payment
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Your payment information is encrypted and secure. We do not store your card details.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Payment;
