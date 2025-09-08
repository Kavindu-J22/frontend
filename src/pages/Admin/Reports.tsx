import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  EventSeat,
  AttachMoney,
  Movie,
  DateRange,
  Download,
} from '@mui/icons-material';
import api from '../../config/api';

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SalesReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalBookings: number;
  totalTicketsSold: number;
  dailySales: Array<{
    date: string;
    revenue: number;
    bookings: number;
    ticketsSold: number;
  }>;
}

interface OccupancyReport {
  showtimeOccupancies: Array<{
    showtimeId: string;
    movieTitle: string;
    startTime: string;
    screenNumber: number;
    totalSeats: number;
    bookedSeats: number;
    occupancyRate: number;
  }>;
  averageOccupancyRate: number;
  totalShowtimes: number;
}

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date range for reports
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Report data
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [occupancyReport, setOccupancyReport] = useState<OccupancyReport | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/reports/sales', {
        params: { startDate, endDate }
      });
      if (response.data.success) {
        setSalesReport(response.data.data);
      }
    } catch (error: any) {
      setError('Failed to fetch sales report');
      console.error('Sales report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupancyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/reports/occupancy');
      if (response.data.success) {
        setOccupancyReport(response.data.data);
      }
    } catch (error: any) {
      setError('Failed to fetch occupancy report');
      console.error('Occupancy report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadSalesReportPDF = () => {
    if (!salesReport) return;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .summary-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .currency { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sales Report</h1>
          <p>Period: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>LKR ${salesReport.totalRevenue.toFixed(2)}</h3>
            <p>Total Revenue</p>
          </div>
          <div class="summary-item">
            <h3>${salesReport.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
          <div class="summary-item">
            <h3>${salesReport.totalTicketsSold}</h3>
            <p>Tickets Sold</p>
          </div>
          <div class="summary-item">
            <h3>LKR ${(salesReport.totalRevenue / salesReport.totalTicketsSold).toFixed(2)}</h3>
            <p>Avg. Ticket Price</p>
          </div>
        </div>

        <h2>Daily Sales Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th class="currency">Revenue</th>
              <th class="currency">Bookings</th>
              <th class="currency">Tickets Sold</th>
            </tr>
          </thead>
          <tbody>
            ${(salesReport.dailySales || []).map(day => `
              <tr>
                <td>${formatDate(day.date)}</td>
                <td class="currency">LKR ${day.revenue.toFixed(2)}</td>
                <td class="currency">${day.bookings}</td>
                <td class="currency">${day.ticketsSold}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>


      </body>
      </html>
    `;

    // Create and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const downloadOccupancyReportPDF = () => {
    if (!occupancyReport) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Occupancy Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .summary-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Occupancy Report</h1>
          <p>Period: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>${occupancyReport.showtimeOccupancies.reduce((total: number, showtime: any) => total + showtime.totalSeats, 0)}</h3>
            <p>Total Seats</p>
          </div>
          <div class="summary-item">
            <h3>${occupancyReport.showtimeOccupancies.reduce((total: number, showtime: any) => total + showtime.bookedSeats, 0)}</h3>
            <p>Booked Seats</p>
          </div>
          <div class="summary-item">
            <h3>${occupancyReport.averageOccupancyRate.toFixed(1)}%</h3>
            <p>Occupancy Rate</p>
          </div>
        </div>

        <h2>Occupancy by Showtime</h2>
        <table>
          <thead>
            <tr>
              <th>Movie</th>
              <th>Show Time</th>
              <th>Screen</th>
              <th class="center">Total Seats</th>
              <th class="center">Booked Seats</th>
              <th class="center">Occupancy Rate</th>
            </tr>
          </thead>
          <tbody>
            ${(occupancyReport.showtimeOccupancies || []).map((showtime: any) => `
              <tr>
                <td>${showtime.movieTitle}</td>
                <td>${formatDateTime(showtime.startTime)}</td>
                <td>Screen ${showtime.screenNumber}</td>
                <td class="center">${showtime.totalSeats}</td>
                <td class="center">${showtime.bookedSeats}</td>
                <td class="center">${showtime.occupancyRate.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Reports & Analytics
        </Typography>

        {/* Date Range Selector */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <DateRange sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Report Date Range
              </Typography>
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    onClick={fetchSalesReport}
                    disabled={loading}
                    startIcon={<TrendingUp />}
                  >
                    Generate Sales Report
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={fetchOccupancyReport}
                    disabled={loading}
                    startIcon={<EventSeat />}
                  >
                    Generate Occupancy Report
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Reports Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="reports tabs">
              <Tab label="Sales Report" icon={<TrendingUp />} />
              <Tab label="Occupancy Report" icon={<EventSeat />} />
            </Tabs>
          </Box>

          {/* Sales Report Tab */}
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : salesReport ? (
              <>
                {/* Download Button */}
                <Box display="flex" justifyContent="flex-end" mb={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={downloadSalesReportPDF}
                  >
                    Download PDF
                  </Button>
                </Box>

                {/* Sales Summary */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <AttachMoney color="primary" sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="div">
                              {formatCurrency(salesReport.totalRevenue)}
                            </Typography>
                            <Typography color="text.secondary">
                              Total Revenue
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <Assessment color="primary" sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="div">
                              {salesReport.totalBookings}
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
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <EventSeat color="primary" sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="div">
                              {salesReport.totalTicketsSold}
                            </Typography>
                            <Typography color="text.secondary">
                              Tickets Sold
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <TrendingUp color="primary" sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="div">
                              {salesReport.totalTicketsSold > 0
                                ? formatCurrency(salesReport.totalRevenue / salesReport.totalTicketsSold)
                                : 'LKR 0.00'
                              }
                            </Typography>
                            <Typography color="text.secondary">
                              Avg. Ticket Price
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Daily Sales */}
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Daily Sales Breakdown
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Bookings</TableCell>
                        <TableCell align="right">Tickets Sold</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(salesReport.dailySales || []).map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(day.date)}</TableCell>
                          <TableCell align="right">{formatCurrency(day.revenue)}</TableCell>
                          <TableCell align="right">{day.bookings}</TableCell>
                          <TableCell align="right">{day.ticketsSold}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>


              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No sales data available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Generate Sales Report" to load data for the selected date range
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Occupancy Report Tab */}
          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : occupancyReport ? (
              <>
                {/* Download Button */}
                <Box display="flex" justifyContent="flex-end" mb={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={downloadOccupancyReportPDF}
                  >
                    Download PDF
                  </Button>
                </Box>

                {/* Occupancy Summary */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <EventSeat color="primary" sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="div">
                              {occupancyReport.showtimeOccupancies.reduce((total, showtime) => total + showtime.totalSeats, 0)}
                            </Typography>
                            <Typography color="text.secondary">
                              Total Seats
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <EventSeat color="success" sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="div">
                              {occupancyReport.showtimeOccupancies.reduce((total, showtime) => total + showtime.bookedSeats, 0)}
                            </Typography>
                            <Typography color="text.secondary">
                              Booked Seats
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <TrendingUp color="primary" sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="div">
                              {occupancyReport.averageOccupancyRate.toFixed(1)}%
                            </Typography>
                            <Typography color="text.secondary">
                              Avg. Occupancy Rate
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Showtime Occupancy */}
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Occupancy by Showtime
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Movie</TableCell>
                        <TableCell>Show Time</TableCell>
                        <TableCell>Screen</TableCell>
                        <TableCell align="right">Total Seats</TableCell>
                        <TableCell align="right">Booked Seats</TableCell>
                        <TableCell align="right">Occupancy Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(occupancyReport.showtimeOccupancies || []).map((showtime, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Movie sx={{ mr: 1, fontSize: 20 }} />
                              {showtime.movieTitle}
                            </Box>
                          </TableCell>
                          <TableCell>{formatDateTime(showtime.startTime)}</TableCell>
                          <TableCell>Screen {showtime.screenNumber}</TableCell>
                          <TableCell align="right">{showtime.totalSeats}</TableCell>
                          <TableCell align="right">{showtime.bookedSeats}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${showtime.occupancyRate.toFixed(1)}%`}
                              color={
                                showtime.occupancyRate >= 80 ? 'success' :
                                showtime.occupancyRate >= 50 ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No occupancy data available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Generate Occupancy Report" to load data for the selected date range
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Card>
      </Box>
    </Container>
  );
};

export default Reports;
