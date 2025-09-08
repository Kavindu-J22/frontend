import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Container,
  Chip,
  Rating,
} from '@mui/material';
import { PlayArrow, AccessTime, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchMovies } from '../../store/slices/movieSlice';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { movies, isLoading } = useSelector((state: RootState) => state.movies);

  useEffect(() => {
    dispatch(fetchMovies() as any);
  }, [dispatch]);

  const featuredMovies = movies.slice(0, 6);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          py: 8,
          mb: 6,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #e50914, #ffc107)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
              }}
            >
              Welcome to CineBook
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              paragraph
              sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              Your ultimate destination for movie bookings. Discover the latest movies,
              book your seats, and enjoy the cinematic experience.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => navigate('/movies')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                Browse Movies
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/movies')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.light',
                    backgroundColor: 'rgba(229, 9, 20, 0.1)',
                  },
                }}
              >
                View Showtimes
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Featured Movies Section */}
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ mb: 4, fontWeight: 'bold' }}
        >
          Now Showing
        </Typography>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading movies...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {featuredMovies.map((movie) => (
              <Grid item xs={12} sm={6} md={4} key={movie.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 8px 25px rgba(229, 9, 20, 0.3)',
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="300"
                    image={movie.imageUrl || '/placeholder-movie.jpg'}
                    alt={movie.title}
                    sx={{
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {movie.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={movie.genre}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDuration(movie.duration)}
                        </Typography>
                      </Box>
                    </Box>

                    {movie.imdbRating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Star fontSize="small" color="warning" />
                        <Typography variant="body2" color="text.secondary">
                          {movie.imdbRating}/10
                        </Typography>
                      </Box>
                    )}

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {movie.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/movies/${movie.id}`)}
                      sx={{ mr: 1 }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/movies/${movie.id}`)}
                    >
                      Book Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {featuredMovies.length === 0 && !isLoading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No movies available at the moment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please check back later for new releases
            </Typography>
          </Box>
        )}

        {movies.length > 6 && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/movies')}
            >
              View All Movies
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Home;
