import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Container, Grid, Typography, Box, CircularProgress, TextField, Button } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import ClearIcon from '@mui/icons-material/Clear';
import { searchGoogleBooks, GoogleBook } from '../services/googleBooks';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBooks } from '../store/slices/booksSlice';
import BookCard from '../components/Books/BookCard';
import FilterPanel from '../components/Books/FilterPanel';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const localBooks = useAppSelector(state => state.books);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [items, setItems] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({ 
    genre: searchParams.get('genre') || '', 
    language: searchParams.get('lang') || '', 
    orderBy: searchParams.get('sort') || 'relevance' 
  });
  const [hasMore, setHasMore] = useState(true);
  const [useLocalBooks, setUseLocalBooks] = useState(!searchParams.get('q'));
  const pageSize = 20;
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchBooks({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setUseLocalBooks(false);
      const genre = searchParams.get('genre') || '';
      const lang = searchParams.get('lang') || '';
      const sort = searchParams.get('sort') || 'relevance';
      
      loadBooksFromGoogle(1, query, { genre, language: lang, orderBy: sort }, false);
    }
  }, []);

  const loadBooksFromGoogle = async (
    currentPage: number = 1, 
    query: string = searchQuery, 
    currentFilters: { genre: string; language: string; orderBy: string } = filters,
    append: boolean = false
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const startIndex = (currentPage - 1) * pageSize;
      const result = await searchGoogleBooks(
        query, 
        startIndex, 
        pageSize,
        { 
          language: currentFilters.language, 
          subject: currentFilters.genre,
          orderBy: currentFilters.orderBy
        }
      );
      
      if (append) {
        setItems(prev => [...prev, ...result.items]);
      } else {
        setItems(result.items);
      }
      
      setTotalCount(result.totalItems);
      setPage(currentPage);
      
      const totalLoaded = append ? items.length + result.items.length : result.items.length;
      setHasMore(totalLoaded < result.totalItems && result.items.length === pageSize);
    } catch (error: any) {
      console.error('Error loading books:', error);
      setHasMore(false);
      
      if (!append) {
        setItems([]);
      }
      alert(error.message || 'Erreur lors de la recherche Google Books');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreBooks = useCallback(() => {
    if (!loadingMore && !loading && hasMore && !useLocalBooks) {
      loadBooksFromGoogle(page + 1, searchQuery, filters, true);
    }
  }, [loadingMore, loading, hasMore, page, searchQuery, filters, useLocalBooks]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreBooks();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMoreBooks, hasMore, loadingMore, loading]);

  const updateUrlParams = (query: string, currentFilters: any) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (currentFilters.genre) params.set('genre', currentFilters.genre);
    if (currentFilters.language) params.set('lang', currentFilters.language);
    if (currentFilters.orderBy && currentFilters.orderBy !== 'relevance') {
      params.set('sort', currentFilters.orderBy);
    }
    setSearchParams(params);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
    setHasMore(true);
    
    if (searchQuery.trim()) {
      setUseLocalBooks(false);
      updateUrlParams(searchQuery, newFilters);
      loadBooksFromGoogle(1, searchQuery, newFilters, false).then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setUseLocalBooks(true);
      setItems([]);
      setHasMore(false);
      setSearchParams({});
      return;
    }
    
    setUseLocalBooks(false);
    setPage(1);
    setHasMore(true);
    updateUrlParams(searchQuery, filters);
    loadBooksFromGoogle(1, searchQuery, filters, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilters({ genre: '', language: '', orderBy: 'relevance' });
    setItems([]);
    setPage(1);
    setHasMore(false);
    setUseLocalBooks(true);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLocal = () => {
    setSearchQuery('');
    setUseLocalBooks(true);
    setItems([]);
    setHasMore(false);
    setFilters({ genre: '', language: '', orderBy: 'relevance' });
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayItems = useLocalBooks ? localBooks.items : items;
  const isLoading = useLocalBooks ? localBooks.loading : loading;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" component="h1">
          Catalogue de livres
        </Typography>
        {!useLocalBooks && (
          <Button
            variant="outlined"
            startIcon={<StorageIcon />}
            onClick={handleBackToLocal}
          >
            Retour au catalogue local
          </Button>
        )}
      </Box>

      {useLocalBooks && localBooks.items.length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            📚 Affichage des livres de votre bibliothèque locale ({localBooks.items.length} livre{localBooks.items.length > 1 ? 's' : ''})
          </Typography>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher dans Google Books (ex: science fiction, harry potter, Victor Hugo...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={loading}
        />
        <Button 
          variant="contained" 
          onClick={handleSearch}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          sx={{ minWidth: '120px' }}
        >
          {loading ? 'Chargement...' : 'Rechercher'}
        </Button>
        {(searchQuery || !useLocalBooks) && (
          <Button 
            variant="outlined" 
            onClick={handleReset}
            disabled={loading}
            startIcon={<ClearIcon />}
            sx={{ minWidth: '120px' }}
          >
            Réinitialiser
          </Button>
        )}
      </Box>
      
      {!useLocalBooks && (
        <FilterPanel 
          onFilterChange={handleFilterChange}
          initialGenre={filters.genre}
          initialLanguage={filters.language}
          initialOrderBy={filters.orderBy}
        />
      )}

      {isLoading && displayItems.length === 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      )}

      {!isLoading && displayItems.length === 0 && useLocalBooks && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Votre bibliothèque locale est vide
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            💡 Utilisez la page Import pour ajouter des livres depuis Google Books
          </Typography>
        </Box>
      )}

      {!isLoading && items.length === 0 && !useLocalBooks && searchQuery && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun livre trouvé sur Google Books
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Essayez une autre recherche ou modifiez les filtres
          </Typography>
        </Box>
      )}

      {displayItems.length > 0 && (
        <Box sx={{ position: 'relative' }}>
          {isLoading && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(2px)',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Grid container spacing={3} sx={{ mt: 2, opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            {displayItems.map((book: any, index: number) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`${book.id}-${index}`}>
                <BookCard book={book} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Infinite scroll trigger - Only for Google Books */}
      {!useLocalBooks && items.length > 0 && hasMore && (
        <Box 
          ref={observerTarget}
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mt: 4,
            mb: 4,
            minHeight: '100px'
          }}
        >
          {loadingMore && (
            <Box textAlign="center">
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Chargement de plus de livres...
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Show total count and end message - Only for Google Books */}
      {!useLocalBooks && items.length > 0 && !hasMore && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            🎉 Fin des résultats ({items.length} livre{items.length > 1 ? 's' : ''} chargé{items.length > 1 ? 's' : ''})
          </Typography>
        </Box>
      )}

      {/* Show current count while scrolling - Only for Google Books */}
      {!useLocalBooks && items.length > 0 && hasMore && !loadingMore && (
        <Box textAlign="center" py={2}>
          <Typography variant="body2" color="text.secondary">
            {items.length} livre{items.length > 1 ? 's' : ''} chargé{items.length > 1 ? 's' : ''} • Scrollez pour voir plus
          </Typography>
        </Box>
      )}

      {/* Show local books count */}
      {useLocalBooks && displayItems.length > 0 && (
        <Box textAlign="center" py={2}>
          <Typography variant="body2" color="text.secondary">
            📚 {displayItems.length} livre(s) dans votre bibliothèque locale
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Home;

