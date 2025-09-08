import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import movieSlice from './slices/movieSlice';
import bookingSlice from './slices/bookingSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    movies: movieSlice,
    bookings: bookingSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
