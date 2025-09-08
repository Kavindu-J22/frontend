import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, SeatAvailability, BookingRequest, PaymentRequest, Payment, Ticket, ApiResponse } from '../../types';
import api from '../../config/api';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  seatAvailability: SeatAvailability | null;
  selectedSeats: string[];
  payment: Payment | null;
  ticket: Ticket | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  seatAvailability: null,
  selectedSeats: [],
  payment: null,
  ticket: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchSeatAvailability = createAsyncThunk(
  'booking/fetchSeatAvailability',
  async (showtimeId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<SeatAvailability>>(`/bookings/seats/${showtimeId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch seat availability');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData: BookingRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<Booking>>('/bookings', bookingData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const fetchUserBookings = createAsyncThunk(
  'booking/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Booking[]>>('/bookings/my-bookings');
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const processPayment = createAsyncThunk(
  'booking/processPayment',
  async ({ bookingId, paymentData }: { bookingId: string; paymentData: PaymentRequest }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<Payment>>(`/bookings/${bookingId}/pay`, paymentData);
      return response.data;
    } catch (error: any) {
      console.error('Payment API error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: 'Payment failed' });
    }
  }
);

export const fetchTicket = createAsyncThunk(
  'booking/fetchTicket',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Ticket>>(`/tickets/booking/${bookingId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      return bookingId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedSeats: (state, action: PayloadAction<string[]>) => {
      state.selectedSeats = action.payload;
    },
    clearBookingData: (state) => {
      state.currentBooking = null;
      state.selectedSeats = [];
      state.payment = null;
      state.ticket = null;
      state.seatAvailability = null;
    },
    clearPayment: (state) => {
      state.payment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch seat availability
      .addCase(fetchSeatAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSeatAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.seatAvailability = action.payload || null;
      })
      .addCase(fetchSeatAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload || null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch user bookings
      .addCase(fetchUserBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Process payment
      .addCase(processPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payment = action.payload?.data || null;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch ticket
      .addCase(fetchTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ticket = action.payload || null;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Cancel booking
      .addCase(cancelBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = state.bookings.filter(booking => booking.id !== action.payload);
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedSeats, clearBookingData, clearPayment } = bookingSlice.actions;
export default bookingSlice.reducer;
