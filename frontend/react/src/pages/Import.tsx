import React, { useState } from 'react';
import { 
  Container, Paper, Typography, Button, Box, Alert, LinearProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Import: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [seedResult, setSeedResult] = useState('');
  const [error, setError] = useState('');
  const [seedError, setSeedError] = useState('');
  const [clearDialog, setClearDialog] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const fileContent = await file.text();
      const books = JSON.parse(fileContent);

      const response = await axios.post(
        'http://localhost:5000/api/importer/enrich',
        books,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedError('');
    setSeedResult('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/catalog/books/seed',
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSeedResult(response.data.message || 'Base de données initialisée avec succès ! Consultez le catalogue pour voir les livres.');
    } catch (err: any) {
      setSeedError(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l\'initialisation');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDatabase = async () => {
    try {
      setClearing(true);
      setSeedError('');
      setSeedResult('');
      
      const response = await axios.delete(
        'http://localhost:5000/api/catalog/books/clear',
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSeedResult(response.data.message || 'Tous les livres ont été supprimés avec succès !');
      setClearDialog(false);
    } catch (err: any) {
      setSeedError(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Import de livres
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Importer des livres depuis un fichier JSON
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Sélectionnez un fichier JSON contenant un tableau de livres. Le système enrichira automatiquement 
          les données via l'API Google Books si disponible.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            fullWidth
          >
            Sélectionner un fichier
            <input
              type="file"
              hidden
              accept=".json"
              onChange={handleFileChange}
            />
          </Button>
          
          {file && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Fichier sélectionné : <strong>{file.name}</strong>
            </Typography>
          )}
        </Box>

        {loading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Import en cours...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Import terminé !</strong>
            </Typography>
            <Typography variant="body2">
              Total: {result.totalCount} | Réussis: {result.successCount} | 
              Échecs: {result.failureCount} | Enrichis: {result.enrichedCount}
            </Typography>
            {result.errors && result.errors.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Erreurs :</Typography>
                <ul>
                  {result.errors.slice(0, 5).map((err: string, idx: number) => (
                    <li key={idx}><Typography variant="caption">{err}</Typography></li>
                  ))}
                </ul>
              </Box>
            )}
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: 3 }}
          disabled={!file || loading}
          onClick={handleImport}
        >
          Lancer l'import
        </Button>
      </Paper>

      <Divider sx={{ my: 4 }}>OU</Divider>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Initialiser avec des données d'exemple
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Cliquez sur le bouton ci-dessous pour remplir la base de données avec des livres d'exemple 
          depuis le fichier <code>data/books.json</code>. Cette action ajoutera automatiquement plusieurs 
          livres pré-configurés dans le catalogue.
        </Typography>

        {seedError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setSeedError('')}>
            {seedError}
          </Alert>
        )}

        {seedResult && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSeedResult('')}>
            {seedResult}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            size="large"
            disabled={seeding || clearing}
            onClick={handleSeedDatabase}
            startIcon={<StorageIcon />}
          >
            {seeding ? <LinearProgress sx={{ width: '100%' }} /> : 'Initialiser la base de données'}
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="large"
            disabled={seeding || clearing}
            onClick={() => setClearDialog(true)}
            startIcon={<DeleteForeverIcon />}
          >
            Vider le catalogue
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Format du fichier JSON
        </Typography>
        <Typography variant="body2" component="pre" sx={{ overflow: 'auto' }}>
          {`[
  {
    "title": "Titre du livre",
    "authors": ["Auteur 1", "Auteur 2"],
    "isbn": "978-...",
    "bookType": "PrintedBook",
    "publishedDate": "2024-01-01",
    "pages": 300,
    "language": "fr",
    "genre": "Fiction",
    "tags": ["tag1", "tag2"],
    "description": "Description",
    "coverUrl": "https://...",
    "copiesAvailable": 5,
    "totalCopies": 5,
    "typeSpecificData": {
      "publisher": "Editeur",
      "edition": "1st"
    }
  }
]

Note: Les champs copiesAvailable et totalCopies sont optionnels.
Si non spécifiés, la valeur par défaut sera 3.`}
        </Typography>
      </Paper>

      {/* Clear Database Dialog */}
      <Dialog
        open={clearDialog}
        onClose={() => setClearDialog(false)}
      >
        <DialogTitle>⚠️ Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer <strong>TOUS les livres</strong> du catalogue ? 
            Cette action est irréversible !
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialog(false)} disabled={clearing}>
            Annuler
          </Button>
          <Button
            onClick={handleClearDatabase}
            variant="contained"
            color="error"
            disabled={clearing}
            autoFocus
          >
            {clearing ? <LinearProgress sx={{ width: '100px' }} /> : 'Supprimer tout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Import;

