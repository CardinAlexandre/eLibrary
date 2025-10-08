import React, { useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Paper, Chip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchLoans } from '../store/slices/loansSlice';

const Loans: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector(state => state.loans);
  const user = useAppSelector(state => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchLoans(user.userId));
    }
  }, [dispatch, user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Mes emprunts
      </Typography>

      {items.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Vous n'avez aucun emprunt en cours.
        </Typography>
      ) : (
        <Box sx={{ mt: 3 }}>
          {items.map((loan) => (
            <Paper key={loan.id} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6">{loan.bookTitle}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Date d'emprunt:</strong> {new Date(loan.loanDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Date de retour prévue:</strong> {new Date(loan.dueDate).toLocaleDateString()}
                </Typography>
                <Chip 
                  label={loan.status}
                  color={loan.isOverdue ? 'error' : 'success'}
                  sx={{ mt: 1 }}
                />
                {loan.isOverdue && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Retard de {loan.daysOverdue} jour(s) - Pénalité: {loan.lateFee}€
                  </Typography>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Loans;

