import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Paper, Chip, Button, Alert, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userEmail: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  lateFee: number;
}

const Loans: React.FC = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadLoans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/catalog/loans/my-loans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLoans(response.data);
    } catch (error) {
      console.error('Error loading loans:', error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleReturn = async (loanId: string, bookTitle: string) => {
    setReturning(loanId);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/catalog/loans/${loanId}/return`,
        { notes: '' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setSuccess(`Livre "${bookTitle}" retourné avec succès ! 🎉`);
      await loadLoans();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du retour');
    } finally {
      setReturning(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
  const returnedLoans = loans.filter(l => l.status === 'Returned');

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        📚 Mes emprunts
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : loans.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AutoStoriesIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Vous n'avez aucun emprunt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Explorez le catalogue pour emprunter votre premier livre !
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3 }}
            onClick={() => navigate('/')}
          >
            Voir le catalogue
          </Button>
        </Paper>
      ) : (
        <>
          {/* Emprunts actifs */}
          {activeLoans.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoStoriesIcon /> Emprunts en cours ({activeLoans.length})
              </Typography>
              
              <Grid container spacing={2}>
                {activeLoans.map((loan) => (
                  <Grid item xs={12} md={6} key={loan.id}>
                    <Paper 
                      sx={{ 
                        p: 3,
                        border: loan.isOverdue ? '2px solid' : '1px solid',
                        borderColor: loan.isOverdue ? 'error.main' : 'divider',
                        backgroundColor: loan.isOverdue ? 'error.light' : 'background.paper'
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        {loan.bookTitle}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          📅 Emprunté le {new Date(loan.loanDate).toLocaleDateString('fr-FR')}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color={loan.isOverdue ? 'error.main' : 'text.secondary'}
                          sx={{ mt: 0.5 }}
                        >
                          ⏰ À retourner le {new Date(loan.dueDate).toLocaleDateString('fr-FR')}
                        </Typography>
                        
                        {loan.isOverdue && (
                          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              ⚠️ Retard de {loan.daysOverdue} jour(s)
                            </Typography>
                            {loan.lateFee > 0 && (
                              <Typography variant="body2">
                                Pénalité : {loan.lateFee.toFixed(2)} €
                              </Typography>
                            )}
                          </Alert>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleReturn(loan.id, loan.bookTitle)}
                            disabled={returning === loan.id}
                          >
                            {returning === loan.id ? 'Retour en cours...' : 'Retourner'}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/books/${loan.bookId}`)}
                          >
                            Voir détails
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Historique des emprunts retournés */}
          {returnedLoans.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon /> Historique ({returnedLoans.length})
              </Typography>
              
              {returnedLoans.map((loan) => (
                <Paper key={loan.id} sx={{ p: 2, mb: 2, opacity: 0.7 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {loan.bookTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Emprunté du {new Date(loan.loanDate).toLocaleDateString('fr-FR')} au {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('fr-FR') : '-'}
                      </Typography>
                    </Box>
                    <Chip label="Retourné" color="default" size="small" />
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Loans;

