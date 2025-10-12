import React, { useState, useEffect } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Link as MuiLink, Chip, Stack } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/slices/authSlice';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import PersonIcon from '@mui/icons-material/Person';

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

  const fillTestAccount = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
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
          <Typography variant="body2" display="block" gutterBottom fontWeight="bold">
            Comptes de test :
          </Typography>
          <Stack direction="column" spacing={1}>
            <Chip
              icon={<AdminPanelSettingsIcon />}
              label="Admin eLibrary"
              onClick={() => fillTestAccount('admin@elibrary.com', 'Admin@2025!')}
              clickable
              color="error"
              sx={{ justifyContent: 'flex-start', px: 2, py: 2.5, height: 'auto' }}
            />
            <Chip
              icon={<LocalLibraryIcon />}
              label="Librarian eLibrary"
              onClick={() => fillTestAccount('librarian@elibrary.com', 'Librarian@2025!')}
              clickable
              color="primary"
              sx={{ justifyContent: 'flex-start', px: 2, py: 2.5, height: 'auto' }}
            />
            <Chip
              icon={<PersonIcon />}
              label="Member eLibrary"
              onClick={() => fillTestAccount('member@elibrary.com', 'Member@2025!')}
              clickable
              color="success"
              sx={{ justifyContent: 'flex-start', px: 2, py: 2.5, height: 'auto' }}
            />
          </Stack>
          <Typography variant="caption" display="block" sx={{ mt: 1.5 }} color="text.secondary">
            💡 Cliquez sur un compte pour remplir le formulaire
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;

