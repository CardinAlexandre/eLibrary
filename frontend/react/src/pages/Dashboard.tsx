import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/analytics/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Typography>Erreur de chargement des données</Typography>;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Dashboard Administrateur
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{data.totalBooks}</Typography>
            <Typography variant="body2">Total Livres</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{data.totalLoans}</Typography>
            <Typography variant="body2">Total Emprunts</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">{data.activeLoans}</Typography>
            <Typography variant="body2">Emprunts Actifs</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">{data.overdueLoans}</Typography>
            <Typography variant="body2">En Retard</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Genres
            </Typography>
            {data.topGenres?.slice(0, 5).map((genre: any) => (
              <Box key={genre.genre} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {genre.genre}: {genre.count} livres, {genre.loanCount} emprunts
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Livres
            </Typography>
            {data.topBooks?.slice(0, 5).map((book: any) => (
              <Box key={book.bookId} sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {book.title} - {book.loanCount} emprunts
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

