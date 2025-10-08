import React, { useState, useEffect } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Link as MuiLink } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/slices/authSlice';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Connexion
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Pas encore de compte ?{' '}
            <MuiLink component={Link} to="/register">
              S'inscrire
            </MuiLink>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Comptes de test :</strong>
          </Typography>
          <Typography variant="caption" display="block">
            Admin: admin@elibrary.com / Admin@2025!
          </Typography>
          <Typography variant="caption" display="block">
            Librarian: librarian@elibrary.com / Librarian@2025!
          </Typography>
          <Typography variant="caption" display="block">
            Member: member@elibrary.com / Member@2025!
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;

