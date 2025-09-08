import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Movie,
  People,
  Assessment,
  Schedule,
  AttachMoney,
  Visibility,
  QrCodeScanner,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../config/api';
import TicketValidation from './TicketValidation';
import Reports from './Reports';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [tabValue, setTabValue] = useState(0);
  const [movies, setMovies] = useState<any[]>([]);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Movie Dialog States
  const [movieDialog, setMovieDialog] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: '',
    duration: '',
    director: '',
    language: '',
    rating: '',
    imdbRating: '',
    releaseDate: '',
    imageUrl: '',
  });

  // Showtime Dialog States
  const [showtimeDialog, setShowtimeDialog] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<any>(null);
  const [showtimeForm, setShowtimeForm] = useState({
    movieId: '',
    startTime: '',
    endTime: '',
    screenNumber: '',
    totalSeats: '100',
    ticketPrice: '',
  });

  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [moviesRes, showtimesRes, usersRes, bookingsRes, statsRes] = await Promise.all([
        api.get('/admin/movies'),
        api.get('/admin/showtimes'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
        api.get('/admin/reports/dashboard'),
      ]);

      const moviesData = moviesRes.data.data || [];
      const showtimesData = showtimesRes.data.data || [];
      const usersData = usersRes.data.data || [];
      const bookingsData = bookingsRes.data.data || [];

      // Enhance bookings with user and movie information
      const enhancedBookings = await Promise.all(
        bookingsData.map(async (booking: any) => {
          try {
            // Get user information
            const user = usersData.find((u: any) => u.id === booking.userId);

            // Get showtime information to get movie details
            let movieTitle = 'Unknown Movie';
            try {
              const showtimeResponse = await api.get(`/showtimes/${booking.showtimeId}`);
              if (showtimeResponse.data.success) {
                movieTitle = showtimeResponse.data.data.movieTitle;
              }
            } catch (showtimeError) {
              console.error('Failed to fetch showtime for booking:', booking.id);
            }

            return {
              ...booking,
              userEmail: user ? user.email : 'Unknown User',
              userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
              movieTitle,
            };
          } catch (error) {
            console.error('Error enhancing booking:', booking.id, error);
            return {
              ...booking,
              userEmail: 'Unknown User',
              userName: 'Unknown User',
              movieTitle: 'Unknown Movie',
            };
          }
        })
      );

      setMovies(moviesData);
      setShowtimes(showtimesData);
      setUsers(usersData);
      setBookings(enhancedBookings);
      setStats(statsRes.data.data || {});
    } catch (error: any) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Movie Management Functions
  const handleAddMovie = () => {
    setEditingMovie(null);
    setMovieForm({
      title: '',
      description: '',
      genre: '',
      duration: '',
      director: '',
      language: '',
      rating: '',
      imdbRating: '',
      releaseDate: '',
      imageUrl: '',
    });
    setMovieDialog(true);
  };

  const handleEditMovie = (movie: any) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title || '',
      description: movie.description || '',
      genre: movie.genre || '',
      duration: movie.duration?.toString() || '',
      director: movie.director || '',
      language: movie.language || '',
      rating: movie.rating || '',
      imdbRating: movie.imdbRating?.toString() || '',
      releaseDate: movie.releaseDate?.split('T')[0] || '',
      imageUrl: movie.imageUrl || '',
    });
    setMovieDialog(true);
  };

  const handleSaveMovie = async () => {
    try {
      const movieData = {
        ...movieForm,
        duration: parseInt(movieForm.duration),
        imdbRating: parseFloat(movieForm.imdbRating),
        active: true, // Set active to true by default
      };

      // Use the new JSON endpoints
      if (editingMovie) {
        await api.put(`/admin/movies/${editingMovie.id}/json`, movieData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        await api.post('/admin/movies/json', movieData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      setMovieDialog(false);
      loadDashboardData();
    } catch (error: any) {
      console.error('Save movie error:', error);
      setError(error.response?.data?.message || 'Failed to save movie');
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await api.delete(`/admin/movies/${movieId}`);
        loadDashboardData();
      } catch (error: any) {
        setError('Failed to delete movie');
      }
    }
  };

  // Showtime Management Functions
  const handleAddShowtime = () => {
    setEditingShowtime(null);
    setShowtimeForm({
      movieId: '',
      startTime: '',
      endTime: '',
      screenNumber: '',
      totalSeats: '100',
      ticketPrice: '',
    });
    setShowtimeDialog(true);
  };

  const handleEditShowtime = (showtime: any) => {
    setEditingShowtime(showtime);
    setShowtimeForm({
      movieId: showtime.movieId || '',
      startTime: showtime.startTime?.slice(0, 16) || '',
      endTime: showtime.endTime?.slice(0, 16) || '',
      screenNumber: showtime.screenNumber?.toString() || '',
      totalSeats: showtime.totalSeats?.toString() || '100',
      ticketPrice: showtime.ticketPrice?.toString() || '',
    });
    setShowtimeDialog(true);
  };

  const handleSaveShowtime = async () => {
    try {
      const showtimeData = {
        ...showtimeForm,
        screenNumber: parseInt(showtimeForm.screenNumber),
        totalSeats: parseInt(showtimeForm.totalSeats),
        ticketPrice: parseFloat(showtimeForm.ticketPrice),
        active: true, // Set active to true by default
      };

      if (editingShowtime) {
        await api.put(`/admin/showtimes/${editingShowtime.id}`, showtimeData);
      } else {
        await api.post('/admin/showtimes', showtimeData);
      }

      setShowtimeDialog(false);
      loadDashboardData();
    } catch (error: any) {
      console.error('Save showtime error:', error);
      setError(error.response?.data?.message || 'Failed to save showtime');
    }
  };

  const handleDeleteShowtime = async (showtimeId: string) => {
    if (window.confirm('Are you sure you want to delete this showtime?')) {
      try {
        await api.delete(`/admin/showtimes/${showtimeId}`);
        loadDashboardData();
      } catch (error: any) {
        setError('Failed to delete showtime');
      }
    }
  };

  if (user?.role !== 'ROLE_ADMIN') {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Alert severity="error">
            Access denied. Admin privileges required.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Dashboard Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Movie color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalMovies || movies.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Total Movies
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <People color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalUsers || users.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Schedule color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalBookings || bookings.length}
                    </Typography>
                    <Typography color="text.secondary">
                      Total Bookings
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AttachMoney color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      LKR {stats.totalRevenue || '0'}
                    </Typography>
                    <Typography color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Admin Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
              <Tab label="Movies" icon={<Movie />} />
              <Tab label="Showtimes" icon={<Schedule />} />
              <Tab label="Users" icon={<People />} />
              <Tab label="Bookings" icon={<Assessment />} />
              <Tab label="Reports" icon={<Assessment />} />
              <Tab label="Validate Tickets" icon={<Visibility />} />
            </Tabs>
          </Box>

          {/* Movies Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Movie Management</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddMovie}
              >
                Add Movie
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Genre</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Release Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movies.map((movie) => (
                      <TableRow key={movie.id}>
                        <TableCell>{movie.title}</TableCell>
                        <TableCell>
                          <Chip label={movie.genre} size="small" />
                        </TableCell>
                        <TableCell>{movie.duration} min</TableCell>
                        <TableCell>{movie.rating}</TableCell>
                        <TableCell>
                          {new Date(movie.releaseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditMovie(movie)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMovie(movie.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Showtimes Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Showtime Management</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddShowtime}
              >
                Add Showtime
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Movie</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Screen</TableCell>
                    <TableCell>Total Seats</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {showtimes.map((showtime) => (
                    <TableRow key={showtime.id}>
                      <TableCell>{showtime.movieTitle || 'Unknown Movie'}</TableCell>
                      <TableCell>
                        {new Date(showtime.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell>Screen {showtime.screenNumber}</TableCell>
                      <TableCell>{showtime.totalSeats}</TableCell>
                      <TableCell>LKR {showtime.ticketPrice}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditShowtime(showtime)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteShowtime(showtime.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>User Management</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                          color={user.role === 'ROLE_ADMIN' ? 'error' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Bookings Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>Booking Management</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Booking ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Movie</TableCell>
                    <TableCell>Seats</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.bookingReference || booking.id?.slice(-8)}</TableCell>
                      <TableCell>{booking.userEmail || 'Unknown User'}</TableCell>
                      <TableCell>{booking.movieTitle || 'Unknown Movie'}</TableCell>
                      <TableCell>{booking.bookedSeatNumbers?.join(', ') || 'N/A'}</TableCell>
                      <TableCell>LKR {booking.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={
                            booking.status === 'CONFIRMED' ? 'success' :
                            booking.status === 'PENDING_PAYMENT' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Reports Tab */}
          <TabPanel value={tabValue} index={4}>
            <Reports />
          </TabPanel>

          {/* Ticket Validation Tab */}
          <TabPanel value={tabValue} index={5}>
            <TicketValidation />
          </TabPanel>
        </Card>

        {/* Movie Dialog */}
        <Dialog open={movieDialog} onClose={() => setMovieDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingMovie ? 'Edit Movie' : 'Add New Movie'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Genre"
                  value={movieForm.genre}
                  onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (minutes)"
                  type="number"
                  value={movieForm.duration}
                  onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Director"
                  value={movieForm.director}
                  onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Language"
                  value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rating"
                  value={movieForm.rating}
                  onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IMDB Rating"
                  type="number"
                  inputProps={{ step: 0.1, min: 0, max: 10 }}
                  value={movieForm.imdbRating}
                  onChange={(e) => setMovieForm({ ...movieForm, imdbRating: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Release Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={movieForm.releaseDate}
                  onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={movieForm.imageUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, imageUrl: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMovieDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveMovie} variant="contained">
              {editingMovie ? 'Update' : 'Add'} Movie
            </Button>
          </DialogActions>
        </Dialog>

        {/* Showtime Dialog */}
        <Dialog open={showtimeDialog} onClose={() => setShowtimeDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingShowtime ? 'Edit Showtime' : 'Add New Showtime'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Movie</InputLabel>
                  <Select
                    value={showtimeForm.movieId}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, movieId: e.target.value })}
                  >
                    {movies.map((movie) => (
                      <MenuItem key={movie.id} value={movie.id}>
                        {movie.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={showtimeForm.startTime}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={showtimeForm.endTime}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, endTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Screen Number"
                  type="number"
                  value={showtimeForm.screenNumber}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, screenNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Seats"
                  type="number"
                  value={showtimeForm.totalSeats}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, totalSeats: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ticket Price (LKR)"
                  type="number"
                  inputProps={{ step: 0.01, min: 0 }}
                  value={showtimeForm.ticketPrice}
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, ticketPrice: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowtimeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveShowtime} variant="contained">
              {editingShowtime ? 'Update' : 'Add'} Showtime
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
