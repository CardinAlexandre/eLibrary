import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, Pagination, CircularProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBooks } from '../store/slices/booksSlice';
import BookCard from '../components/Books/BookCard';
import FilterPanel from '../components/Books/FilterPanel';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, totalCount, page, pageSize } = useAppSelector(state => state.books);
  const [filters, setFilters] = useState({ genre: '', language: '' });

  useEffect(() => {
    dispatch(fetchBooks({ page, pageSize, ...filters }));
  }, [dispatch, page, pageSize, filters]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    dispatch(fetchBooks({ page: value, pageSize, ...filters }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Catalogue de livres
      </Typography>
      
      <FilterPanel onFilterChange={handleFilterChange} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {items.map((book) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
            <BookCard book={book} />
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination 
          count={Math.ceil(totalCount / pageSize)} 
          page={page} 
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Container>
  );
};

export default Home;

