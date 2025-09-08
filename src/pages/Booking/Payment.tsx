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
  movieTitle: string;
  startTime: string;
  screenNumber: number;
  selectedSeats: string[];
  totalAmount: number;
  status: string;
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
        setBookingDetails(response.data.data);
      }
    } catch (error: any) {
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

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      setError('Please enter a valid card number');
      return false;
    }
    if (!cardholderName.trim()) {
      setError('Please enter cardholder name');
      return false;
    }
    if (!expiryMonth || !expiryYear) {
      setError('Please enter expiry date');
      return false;
    }
    if (!cvv || cvv.length < 3) {
      setError('Please enter a valid CVV');
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
        expiryMonth: paymentForm.expiryMonth,
        expiryYear: paymentForm.expiryYear,
        cvv: paymentForm.cvv,
        amount: bookingDetails!.totalAmount,
      };

      const response = await dispatch(processPayment({
        bookingId: bookingId!,
        paymentData
      }) as any);

      if (response.payload && response.payload.success) {
        navigate(`/booking-confirmation/${bookingId}`);
      } else {
        setError(response.payload?.message || 'Payment failed. Please try again.');
      }
    } catch (error: any) {
      setError('Payment processing failed. Please try again.');
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
                      {formatDateTime(bookingDetails.startTime)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Movie sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      Screen {bookingDetails.screenNumber}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EventSeat sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">
                      Seats: {bookingDetails.selectedSeats.join(', ')}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    ${bookingDetails.totalAmount.toFixed(2)}
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
                  {paymentProcessing ? 'Processing Payment...' : `Pay $${bookingDetails.totalAmount.toFixed(2)}`}
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
