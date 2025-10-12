import React, { useState } from 'react';
import { 
  Container, Paper, Typography, Button, Box, Alert, LinearProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { searchGoogleBooks, GoogleBook } from '../services/googleBooks';

const Import: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [seedResult, setSeedResult] = useState('');
  const [error, setError] = useState('');
  const [seedError, setSeedError] = useState('');
  const [clearDialog, setClearDialog] = useState(false);

  const handleSearchBooks = async () => {
    if (!searchQuery.trim()) {
      setError('Veuillez entrer un terme de recherche');
      return;
    }

    setLoading(true);
    setError('');
    setSeedError('');
    setSearchResults([]);

    try {
      const result = await searchGoogleBooks(searchQuery, 0, 40);
      setSearchResults(result.items);
      
      if (result.items.length === 0) {
        setError('Aucun livre trouvé pour cette recherche');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche Google Books');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (book: GoogleBook) => {
    try {
      const bookDto = {
        title: book.title,
        authors: book.authors,
        isbn: book.isbn,
        bookType: 'PrintedBook',
        publishedDate: book.publishedDate,
        pages: book.pages,
        language: book.language,
        genre: book.genre,
        tags: book.tags,
        description: book.description,
        coverUrl: book.coverUrl,
        typeSpecificData: book.typeSpecificData
      };

      await axios.post(
        'http://localhost:5000/api/catalog/books',
        bookDto,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setSeedResult(`Livre "${book.title}" ajouté au catalogue !`);
    } catch (err: any) {
      setError(`Erreur lors de l'ajout de "${book.title}"`);
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
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Rechercher et Importer des livres
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Rechercher dans Google Books
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Recherchez des livres dans la base de données Google Books et ajoutez-les à votre catalogue.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher (ex: Harry Potter, science fiction, Victor Hugo...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchBooks()}
          />
          <Button
            variant="contained"
            onClick={handleSearchBooks}
            disabled={loading}
            startIcon={<SearchIcon />}
            sx={{ minWidth: '140px' }}
          >
            Rechercher
          </Button>
        </Box>

        {loading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Recherche en cours...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {seedResult && (
          <Alert severity="success" sx={{ mt: 3 }} onClose={() => setSeedResult('')}>
            {seedResult}
          </Alert>
        )}

        {searchResults.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              <strong>{searchResults.length} livres trouvés</strong>
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1, maxHeight: '600px', overflow: 'auto' }}>
              {searchResults.map((book) => (
                <Grid item xs={12} key={book.id}>
                  <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 80, 
                        height: 120, 
                        flexShrink: 0,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      <Box 
                        component="img"
                        src={book.coverUrl || 'https://via.placeholder.com/80x120?text=No+Cover'}
                        alt={book.title}
                        sx={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {book.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        Par {book.authors.join(', ')}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {book.genre} | {book.pages} pages | {book.language}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddBook(book)}
                    >
                      Ajouter
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      <Divider sx={{ my: 4 }}>Options avancées</Divider>

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

