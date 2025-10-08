import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Chip, Rating, Button, Paper } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBookById, clearCurrentBook } from '../store/slices/booksSlice';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentBook, loading } = useAppSelector(state => state.books);

  useEffect(() => {
    if (id) {
      dispatch(fetchBookById(id));
    }
    return () => {
      dispatch(clearCurrentBook());
    };
  }, [id, dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentBook) {
    return (
      <Container>
        <Typography variant="h5">Livre non trouvé</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Retour
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <img
              src={currentBook.coverUrl || 'https://via.placeholder.com/300x400?text=No+Cover'}
              alt={currentBook.title}
              style={{ maxWidth: '300px', borderRadius: '8px' }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" gutterBottom>
              {currentBook.title}
            </Typography>
            
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Par {currentBook.authors.join(', ')}
            </Typography>

            <Box sx={{ my: 2 }}>
              <Chip label={currentBook.bookType} color="primary" sx={{ mr: 1 }} />
              <Chip label={currentBook.genre} sx={{ mr: 1 }} />
              <Chip 
                label={currentBook.isAvailable ? 'Disponible' : 'Indisponible'} 
                color={currentBook.isAvailable ? 'success' : 'error'}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <Rating value={currentBook.averageRating} precision={0.5} readOnly />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {currentBook.averageRating.toFixed(1)} / 5.0 ({currentBook.reviewCount} avis)
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              {currentBook.description}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2"><strong>ISBN:</strong> {currentBook.isbn}</Typography>
              <Typography variant="body2"><strong>Pages:</strong> {currentBook.pages}</Typography>
              <Typography variant="body2"><strong>Langue:</strong> {currentBook.language}</Typography>
              <Typography variant="body2"><strong>Date de publication:</strong> {new Date(currentBook.publishedDate).toLocaleDateString()}</Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2"><strong>Tags:</strong></Typography>
              <Box sx={{ mt: 1 }}>
                {currentBook.tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                ))}
              </Box>
            </Box>

            {currentBook.isAvailable && (
              <Button variant="contained" size="large" sx={{ mt: 3 }}>
                Emprunter ce livre
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default BookDetails;

