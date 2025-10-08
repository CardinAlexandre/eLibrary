import React, { useState } from 'react';
import { Container, TextField, Button, Grid, Typography, Box, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchBooks } from '../store/slices/booksSlice';
import BookCard from '../components/Books/BookCard';

const Search: React.FC = () => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const { items, loading } = useAppSelector(state => state.books);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      dispatch(searchBooks({ query }));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Recherche de livres
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Rechercher un livre (titre, auteur, ISBN...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            variant="outlined"
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
          >
            Rechercher
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : items.length > 0 ? (
        <>
          <Typography variant="h6" gutterBottom>
            {items.length} résultat(s) trouvé(s)
          </Typography>
          <Grid container spacing={3}>
            {items.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
        </>
      ) : query && !loading ? (
        <Typography variant="body1" color="text.secondary">
          Aucun résultat trouvé pour "{query}"
        </Typography>
      ) : null}
    </Container>
  );
};

export default Search;

