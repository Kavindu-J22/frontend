export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  phoneNumber?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  duration: number;
  imageUrl?: string;
  director: string;
  cast?: string[];
  language: string;
  rating: string;
  imdbRating?: number;
  trailerUrl?: string;
  releaseDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  movieTitle?: string; // Optional for backward compatibility
  startTime: string;
  endTime: string;
  screenNumber: number;
  totalSeats: number;
  ticketPrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  showtimeId: string;
  userId: string;
  bookedSeatNumbers: string[];
  totalPrice: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  bookingReference: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  transactionId: string;
  cardNumber: string;
  processedAt: string;
  failureReason?: string;
}

export interface Ticket {
  id: string;
  bookingId: string;
  qrCodeData: string;
  qrCodeImageBase64: string;
  generatedAt: string;
  valid: boolean;
}

export interface SeatAvailability {
  showtimeId: string;
  totalSeats: number;
  bookedSeats: string[];
  availableSeats: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface BookingRequest {
  showtimeId: string;
  seatNumbers: string[];
}

export interface PaymentRequest {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}
