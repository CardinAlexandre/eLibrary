import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Box, Alert, LinearProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const Import: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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
    "typeSpecificData": {
      "publisher": "Editeur",
      "edition": "1st"
    }
  }
]`}
        </Typography>
      </Paper>
    </Container>
  );
};

export default Import;

