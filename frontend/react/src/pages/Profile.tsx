import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { AdminPanelSettings, Edit, Save, Cancel } from '@mui/icons-material';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateUser } from '../store/slices/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector(state => state.auth);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [removeDialog, setRemoveDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProfile(response.data);
      setFormData({
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Tous les champs sont requis');
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      if (!formData.currentPassword) {
        setError('Le mot de passe actuel est requis pour changer de mot de passe');
        return;
      }
    }

    try {
      setSaving(true);
      const response = await axios.put(
        `${API_URL}/api/auth/profile`,
        {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setProfile(response.data);
      setEditing(false);
      setSuccess('Profil mis à jour avec succès !');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors 
        ? err.response.data.errors.join(', ')
        : err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    try {
      setPromoting(true);
      setError('');
      setSuccess('');
      
      const response = await axios.post(
        `${API_URL}/api/auth/promote-admin`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      localStorage.setItem('token', response.data.token);
      dispatch(updateUser(response.data));
      
      setSuccess('Vous êtes maintenant administrateur ! 🎉');
      await fetchProfile();
      setConfirmDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la promotion');
    } finally {
      setPromoting(false);
    }
  };

  const handleRemoveAdmin = async () => {
    try {
      setRemoving(true);
      setError('');
      setSuccess('');
      
      const response = await axios.post(
        `${API_URL}/api/auth/remove-admin`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      localStorage.setItem('token', response.data.token);
      dispatch(updateUser(response.data));
      
      setSuccess('Le rôle Admin a été retiré avec succès !');
      await fetchProfile();
      setRemoveDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du retrait du rôle');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Profil introuvable</Alert>
      </Container>
    );
  }

  const isAdmin = profile.roles.includes('Admin');

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Mon Profil
          </Typography>
          {!editing && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box component="form" sx={{ mt: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!editing}
              fullWidth
              required
            />

            <TextField
              label="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!editing}
              fullWidth
              required
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!editing}
              fullWidth
              required
            />

            <Divider />

            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Rôles
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {profile.roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    color={role === 'Admin' ? 'error' : 'primary'}
                    icon={role === 'Admin' ? <AdminPanelSettings /> : undefined}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Membre depuis : {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
              </Typography>
              {profile.lastLoginAt && (
                <Typography variant="subtitle2" color="text.secondary">
                  Dernière connexion : {new Date(profile.lastLoginAt).toLocaleDateString('fr-FR')}
                </Typography>
              )}
            </Box>

            {editing && (
              <>
                <Divider />
                <Typography variant="h6" color="text.secondary">
                  Changer le mot de passe (optionnel)
                </Typography>

                <TextField
                  label="Mot de passe actuel"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Nouveau mot de passe"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  label="Confirmer le nouveau mot de passe"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                />
              </>
            )}

            {editing && (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Enregistrer'}
                </Button>
              </Stack>
            )}

            {!editing && (
              <>
                <Divider />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Zone de développement
                  </Typography>
                  
                  {!isAdmin ? (
                    <>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Pour des besoins de test, vous pouvez vous promouvoir administrateur.
                      </Typography>
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<AdminPanelSettings />}
                        onClick={() => setConfirmDialog(true)}
                        disabled={promoting}
                        fullWidth
                      >
                        {promoting ? <CircularProgress size={24} /> : 'Devenir Administrateur'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Vous êtes actuellement administrateur. Vous pouvez retirer ce rôle si nécessaire.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<AdminPanelSettings />}
                        onClick={() => setRemoveDialog(true)}
                        disabled={removing}
                        fullWidth
                      >
                        {removing ? <CircularProgress size={24} /> : 'Retirer le rôle Admin'}
                      </Button>
                    </>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Promotion Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Confirmer la promotion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir vous promouvoir administrateur ? 
            Cette action vous donnera accès à toutes les fonctionnalités administratives.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} disabled={promoting}>
            Annuler
          </Button>
          <Button
            onClick={handlePromoteToAdmin}
            variant="contained"
            color="warning"
            disabled={promoting}
            autoFocus
          >
            {promoting ? <CircularProgress size={20} /> : 'Confirmer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Admin Dialog */}
      <Dialog
        open={removeDialog}
        onClose={() => setRemoveDialog(false)}
      >
        <DialogTitle>Confirmer le retrait du rôle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir retirer le rôle Admin ? 
            Vous perdrez l'accès aux pages Import et Dashboard.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialog(false)} disabled={removing}>
            Annuler
          </Button>
          <Button
            onClick={handleRemoveAdmin}
            variant="contained"
            color="error"
            disabled={removing}
            autoFocus
          >
            {removing ? <CircularProgress size={20} /> : 'Retirer le rôle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;

