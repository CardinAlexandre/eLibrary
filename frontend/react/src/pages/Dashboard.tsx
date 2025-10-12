import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Box, CircularProgress, Chip } from '@mui/material';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/catalog/stats/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h3" fontWeight="bold">{data.totalBooks || 0}</Typography>
            <Typography variant="body1">Total Livres</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h3" fontWeight="bold">{data.totalLoans || 0}</Typography>
            <Typography variant="body1">Total Emprunts</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="h3" fontWeight="bold">{data.activeLoans || 0}</Typography>
            <Typography variant="body1">Emprunts Actifs</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h3" fontWeight="bold">{data.overdueLoans || 0}</Typography>
            <Typography variant="body1">En Retard</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">{data.totalCopies || 0}</Typography>
            <Typography variant="body2">Total Exemplaires</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">{data.availableCopies || 0}</Typography>
            <Typography variant="body2">Exemplaires Disponibles</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="text.secondary">
              {data.totalCopies > 0 ? ((data.availableCopies / data.totalCopies) * 100).toFixed(1) : 0}%
            </Typography>
            <Typography variant="body2">Taux de Disponibilité</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Top Genres
            </Typography>
            {data.topGenres && data.topGenres.length > 0 ? (
              data.topGenres.map((genre: any, index: number) => (
                <Box 
                  key={genre.genre || index} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {index + 1}. {genre.genre}
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {genre.loanCount} emprunts
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {genre.count} livre(s) • {genre.activeLoans} emprunt(s) actif(s)
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucun genre disponible
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📚 Top Livres
            </Typography>
            {data.topBooks && data.topBooks.length > 0 ? (
              data.topBooks.map((book: any, index: number) => (
                <Box 
                  key={book.bookId || index} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {index + 1}. {book.title}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {book.loanCount} emprunts
                    </Typography>
                  </Box>
                  {book.averageRating > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      ⭐ {book.averageRating.toFixed(1)}/5
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucun livre emprunté pour le moment
              </Typography>
            )}
          </Paper>
        </Grid>

        {data.activeLoansDetails && data.activeLoansDetails.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📖 Emprunts actifs en détail ({data.activeLoansDetails.length})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Liste complète des livres actuellement empruntés
              </Typography>
              
              <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
                {data.activeLoansDetails.map((loan: any, index: number) => (
                  <Box 
                    key={loan.loanId || index} 
                    sx={{ 
                      mb: 1.5, 
                      p: 2, 
                      bgcolor: loan.isOverdue ? 'error.light' : 'background.default', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: loan.isOverdue ? 'error.main' : 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2
                    }}
                  >
                    <Box sx={{ flex: '1 1 300px' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {loan.bookTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        👤 Emprunté par <strong>{loan.userName || loan.userEmail}</strong>
                      </Typography>
                    </Box>
                    
                    <Box sx={{ flex: '1 1 250px' }}>
                      <Typography variant="body2" color="text.secondary">
                        📅 Emprunté le {new Date(loan.loanDate).toLocaleDateString('fr-FR')}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={loan.isOverdue ? 'error.main' : 'text.secondary'}
                        fontWeight={loan.isOverdue ? 'bold' : 'normal'}
                      >
                        ⏰ À retourner le {new Date(loan.dueDate).toLocaleDateString('fr-FR')}
                        {loan.isOverdue && ` (⚠️ ${loan.daysOverdue} jour(s) de retard)`}
                      </Typography>
                      {loan.isOverdue && loan.lateFee > 0 && (
                        <Typography variant="body2" color="error.main" fontWeight="bold">
                          💰 Pénalité : {loan.lateFee.toFixed(2)} €
                        </Typography>
                      )}
                    </Box>
                    
                    <Box>
                      {loan.isOverdue ? (
                        <Chip label="En retard" color="error" size="small" />
                      ) : (
                        <Chip label="Actif" color="success" size="small" />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}

        {data.recentActivity && data.recentActivity.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🕐 Activité récente
              </Typography>
              {data.recentActivity.map((activity: any, index: number) => (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: 1, 
                    p: 1.5, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="body2">
                      <strong>{activity.eventType === 'Borrowed' ? '📖 Emprunté' : '✅ Retourné'}</strong>: {activity.bookTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Par {activity.userName || activity.userEmail}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(activity.eventDate).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;

