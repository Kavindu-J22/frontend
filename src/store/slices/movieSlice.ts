import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Movie, Showtime, ApiResponse } from '../../types';
import api from '../../config/api';

interface MovieState {
  movies: Movie[];
  selectedMovie: Movie | null;
  showtimes: Showtime[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MovieState = {
  movies: [],
  selectedMovie: null,
  showtimes: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMovies = createAsyncThunk(
  'movies/fetchMovies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Movie[]>>('/movies');
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch movies');
    }
  }
);

export const fetchMovieById = createAsyncThunk(
  'movies/fetchMovieById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Movie>>(`/movies/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch movie');
    }
  }
);

export const fetchMovieShowtimes = createAsyncThunk(
  'movies/fetchMovieShowtimes',
  async (movieId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Showtime[]>>(`/movies/${movieId}/showtimes`);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch showtimes');
    }
  }
);

export const searchMovies = createAsyncThunk(
  'movies/searchMovies',
  async (title: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<Movie[]>>(`/movies/search?title=${title}`);
      return response.data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search movies');
    }
  }
);

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedMovie: (state, action: PayloadAction<Movie | null>) => {
      state.selectedMovie = action.payload;
    },
    clearShowtimes: (state) => {
      state.showtimes = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch movies
      .addCase(fetchMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movies = action.payload;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch movie by ID
      .addCase(fetchMovieById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedMovie = action.payload || null;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch showtimes
      .addCase(fetchMovieShowtimes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMovieShowtimes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.showtimes = action.payload;
      })
      .addCase(fetchMovieShowtimes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search movies
      .addCase(searchMovies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.movies = action.payload;
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedMovie, clearShowtimes } = movieSlice.actions;
export default movieSlice.reducer;
