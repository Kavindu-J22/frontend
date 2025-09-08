import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  AccessTime,
  Star,
  Language,
  Person,
  CalendarToday,
  PlayArrow,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchMovieById, fetchMovieShowtimes } from '../../store/slices/movieSlice';

const MovieDetails: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedMovie, showtimes, isLoading, error } = useSelector((state: RootState) => state.movies);

  useEffect(() => {
    if (movieId) {
      dispatch(fetchMovieById(movieId) as any);
      dispatch(fetchMovieShowtimes(movieId) as any);
    }
  }, [movieId, dispatch]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    // Handle different date formats
    let date;
    if (dateString.includes('T')) {
      // ISO format: 2024-01-15T00:00:00.000Z
      date = new Date(dateString);
    } else if (dateString.includes('-')) {
      // Date only format: 2024-01-15
      date = new Date(dateString + 'T00:00:00');
    } else {
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return 'Invalid Date';
    }

    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBookNow = (showtimeId: string) => {
    navigate(`/seat-selection/${showtimeId}`);
  };

  const groupShowtimesByDate = (showtimes: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    showtimes.forEach(showtime => {
      const date = formatDate(showtime.startTime);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(showtime);
    });
    return grouped;
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

  if (error || !selectedMovie) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Alert severity="error">
            {error || 'Movie not found'}
          </Alert>
        </Box>
      </Container>
    );
  }

  const groupedShowtimes = groupShowtimesByDate(showtimes || []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Movie Poster */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="600"
                image={selectedMovie.imageUrl || '/placeholder-movie.jpg'}
                alt={selectedMovie.title}
                sx={{ objectFit: 'cover' }}
              />
            </Card>
          </Grid>

          {/* Movie Information */}
          <Grid item xs={12} md={8}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                {selectedMovie.title}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
                <Chip label={selectedMovie.genre} color="primary" />
                <Chip label={selectedMovie.rating} variant="outlined" />
                <Box display="flex" alignItems="center">
                  <Star sx={{ color: 'gold', mr: 0.5 }} />
                  <Typography variant="body2">
                    {selectedMovie.imdbRating}/10 IMDB
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                {selectedMovie.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Duration:</strong> {formatDuration(selectedMovie.duration)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Director:</strong> {selectedMovie.director}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Language sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Language:</strong> {selectedMovie.language}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Release Date:</strong> {formatDate(selectedMovie.releaseDate)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Showtimes Section */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Showtimes & Tickets
          </Typography>

          {Object.keys(groupedShowtimes).length === 0 ? (
            <Alert severity="info">
              No showtimes available for this movie at the moment. Please check back later.
            </Alert>
          ) : (
            Object.entries(groupedShowtimes).map(([date, dateShowtimes]) => (
              <Paper key={date} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {date}
                </Typography>
                <Grid container spacing={2}>
                  {dateShowtimes.map((showtime) => (
                    <Grid item xs={12} sm={6} md={4} key={showtime.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {formatTime(showtime.startTime)}
                            </Typography>
                            <Chip
                              label={`Screen ${showtime.screenNumber}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Available Seats: {showtime.availableSeats || showtime.totalSeats}
                          </Typography>
                          <Typography variant="h6" color="primary" gutterBottom>
                            LKR {showtime.ticketPrice}
                          </Typography>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleBookNow(showtime.id)}
                            disabled={showtime.availableSeats === 0}
                          >
                            {showtime.availableSeats === 0 ? 'Sold Out' : 'Book Now'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default MovieDetails;
