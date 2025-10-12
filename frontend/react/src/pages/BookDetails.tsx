import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Chip, Rating, Button, Paper, Alert } from '@mui/material';
import { getGoogleBookById, GoogleBook } from '../services/googleBooks';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';

interface Loan {
  id: string;
  bookId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  lateFee: number;
}

const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentBook, setCurrentBook] = useState<GoogleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalBook, setIsLocalBook] = useState(false);
  const [error, setError] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState('');
  const [hasActiveUserLoan, setHasActiveUserLoan] = useState(false);
  const [checkingLoan, setCheckingLoan] = useState(true);

  const checkUserHasActiveLoan = async (bookId: string): Promise<boolean> => {
    setCheckingLoan(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setHasActiveUserLoan(false);
        setCheckingLoan(false);
        return false;
      }

      const myLoansResponse = await axios.get(
        'http://localhost:5000/api/catalog/loans/my-loans',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const hasActiveLoan = myLoansResponse.data.some(
        (loan: Loan) => loan.bookId === bookId && loan.status === 'Active'
      );
      setHasActiveUserLoan(hasActiveLoan);
      setCheckingLoan(false);
      return hasActiveLoan;
    } catch (error) {
      console.log('Could not check user loans');
      setHasActiveUserLoan(false);
      setCheckingLoan(false);
      return false;
    }
  };

  const loadBookLoans = async (bookId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/catalog/loans/book/${bookId}?activeOnly=true`);
      setLoans(response.data);
    } catch (error) {
      console.log('No active loans for this book');
      setLoans([]);
    }
  };

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      setCheckingLoan(true);

      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isGuid) {
        try {
          const localResponse = await axios.get(`http://localhost:5000/api/catalog/books/${id}`);
          setCurrentBook(localResponse.data);
          setIsLocalBook(true);
          await loadBookLoans(id);
          await checkUserHasActiveLoan(id);
          setLoading(false);
          return;
        } catch (localError) {
          console.log('Livre local introuvable');
          setError('Livre introuvable');
          setLoading(false);
          setCheckingLoan(false);
          return;
        }
      }

      try {
        console.log('Chargement depuis Google Books...');
        const googleBook = await getGoogleBookById(id);
        
        if (googleBook) {
          setCurrentBook(googleBook);
          setIsLocalBook(false);
          
          const token = localStorage.getItem('token');
          let checkedLoan = false;
          if (token && googleBook.isbn) {
            try {
              const searchResponse = await axios.get(
                `http://localhost:5000/api/catalog/books/search?q=${encodeURIComponent(googleBook.isbn)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              
              const existingBook = searchResponse.data.items?.find((book: any) => 
                book.isbn === googleBook.isbn
              );
              
              if (existingBook) {
                await checkUserHasActiveLoan(existingBook.id);
                checkedLoan = true;
              }
            } catch (error) {
              console.log('Could not search for existing book');
            }
          }
          
          if (!checkedLoan) {
            setCheckingLoan(false);
          }
          
          setLoading(false);
          return;
        }
      } catch (googleError: any) {
        console.error('Erreur Google Books:', googleError);
        setError(googleError.message || 'Livre introuvable');
        setLoading(false);
        setCheckingLoan(false);
      }
    };
    
    loadBook();
  }, [id]);

  const handleBorrow = async () => {
    if (!id || !currentBook) return;

    setBorrowing(true);
    setBorrowSuccess('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      let bookIdToLoan = id;
      let wasGoogleBook = !isLocalBook;

      if (!isLocalBook) {
        let existingBook = null;
        
        if (currentBook.isbn) {
          try {
            const searchResponse = await axios.get(
              `http://localhost:5000/api/catalog/books/search?q=${encodeURIComponent(currentBook.isbn)}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            existingBook = searchResponse.data.items?.find((book: any) => 
              book.isbn === currentBook.isbn
            );
          } catch (error) {
            console.log('ISBN search failed, trying title search');
          }
        }

        if (!existingBook) {
          try {
            const titleSearchResponse = await axios.get(
              `http://localhost:5000/api/catalog/books/search?q=${encodeURIComponent(currentBook.title)}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            existingBook = titleSearchResponse.data.items?.find((book: any) => 
              book.title.toLowerCase() === currentBook.title.toLowerCase()
            );
          } catch (error) {
            console.log('Title search failed');
          }
        }

        if (existingBook) {
          bookIdToLoan = existingBook.id;
          wasGoogleBook = false;
          
          const userHasLoan = await checkUserHasActiveLoan(existingBook.id);
          if (userHasLoan) {
            setError('Vous avez déjà emprunté ce livre. Retournez-le d\'abord avant de l\'emprunter à nouveau.');
            setBorrowing(false);
            return;
          }
          
          if (existingBook.copiesAvailable <= 0) {
            setError('Ce livre n\'a plus d\'exemplaires disponibles dans le catalogue.');
            setBorrowing(false);
            return;
          }

          setCurrentBook(existingBook);
          setIsLocalBook(true);
        } else {
          const bookDto = {
            title: currentBook.title,
            authors: currentBook.authors,
            isbn: currentBook.isbn,
            bookType: currentBook.bookType,
            publishedDate: currentBook.publishedDate,
            pages: currentBook.pages,
            language: currentBook.language,
            genre: currentBook.genre,
            tags: currentBook.tags,
            description: currentBook.description,
            coverUrl: currentBook.coverUrl,
            copiesAvailable: 3,
            totalCopies: 3,
            typeSpecificData: currentBook.typeSpecificData
          };

          const addResponse = await axios.post(
            'http://localhost:5000/api/catalog/books',
            bookDto,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          bookIdToLoan = addResponse.data.id;
          setIsLocalBook(true);
        }
      } else {
        if (currentBook.copiesAvailable <= 0) {
          setError('Ce livre n\'a plus d\'exemplaires disponibles.');
          setBorrowing(false);
          return;
        }
      }

      const response = await axios.post(
        'http://localhost:5000/api/catalog/loans',
        { bookId: bookIdToLoan, loanDurationDays: 14 },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const successMessage = wasGoogleBook 
        ? 'Livre emprunté avec succès ! 🎉 (Ajouté au catalogue local)'
        : 'Livre emprunté avec succès ! 🎉';
      
      setBorrowSuccess(successMessage);
      setHasActiveUserLoan(true);
      
      const bookResponse = await axios.get(`http://localhost:5000/api/catalog/books/${bookIdToLoan}`);
      setCurrentBook(bookResponse.data);
      setIsLocalBook(true);
      
      await loadBookLoans(bookIdToLoan);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.title || 'Erreur lors de l\'emprunt';
      
      if (errorMessage.includes('already have an active loan')) {
        setHasActiveUserLoan(true);
        setError('Vous avez déjà emprunté ce livre. Retournez-le d\'abord avant de l\'emprunter à nouveau.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !currentBook) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Retour
        </Button>
        <Alert severity="error">
          <Typography variant="h6">
            Livre introuvable
          </Typography>
          <Typography variant="body2">
            Ce livre n'existe ni dans votre bibliothèque locale, ni dans Google Books.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Retour
        </Button>
        
        <Chip
          icon={isLocalBook ? <StorageIcon /> : <CloudIcon />}
          label={isLocalBook ? 'Bibliothèque locale' : 'Google Books'}
          color={isLocalBook ? 'primary' : 'default'}
          variant="outlined"
        />
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box 
            sx={{ 
              width: { xs: '100%', sm: '250px', md: '300px' },
              flexShrink: 0
            }}
          >
            <Box
              sx={{
                width: '100%',
                paddingTop: '150%',
                position: 'relative',
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 3
              }}
            >
              <img
                src={currentBook.coverUrl || 'https://via.placeholder.com/200x300?text=No+Cover'}
                alt={currentBook.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  paddingTop: '150%',
                  objectFit: 'contain',
                  objectPosition: 'center'
                }}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
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

            <Alert 
              icon={<MenuBookIcon />} 
              severity={isLocalBook && currentBook.copiesAvailable === 0 ? 'warning' : 'info'} 
              sx={{ mt: 3 }}
            >
              {isLocalBook ? (
                <>
                  <Typography variant="body1">
                    <strong>Exemplaires disponibles :</strong> {currentBook.copiesAvailable} / {currentBook.totalCopies}
                  </Typography>
                  {currentBook.copiesAvailable === 0 && (
                    <Typography variant="body2" color="warning.main">
                      Tous les exemplaires sont actuellement empruntés
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body1">
                  <strong>Disponibilité :</strong> Ce livre sera ajouté au catalogue avec 3 exemplaires lors de votre premier emprunt
                </Typography>
              )}
            </Alert>

            {borrowSuccess && (
              <Alert severity="success" sx={{ mt: 3 }} onClose={() => setBorrowSuccess('')}>
                {borrowSuccess}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Message si l'utilisateur a déjà emprunté ce livre */}
            {!checkingLoan && hasActiveUserLoan && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  📖 Vous avez déjà emprunté ce livre. Vous ne pouvez pas l'emprunter à nouveau tant que vous ne l'avez pas retourné.
                </Typography>
              </Alert>
            )}

            {/* Bouton d'emprunt : ne s'affiche que si la vérification est terminée et l'utilisateur n'a pas déjà emprunté */}
            {!checkingLoan && !hasActiveUserLoan && (!isLocalBook || (isLocalBook && currentBook.copiesAvailable > 0)) && (
              <Button 
                variant="contained" 
                size="large" 
                sx={{ mt: 3 }}
                onClick={handleBorrow}
                disabled={borrowing}
              >
                {borrowing ? 'Emprunt en cours...' : (isLocalBook ? 'Emprunter ce livre (14 jours)' : 'Ajouter au catalogue et emprunter (14 jours)')}
              </Button>
            )}

            {/* Message si livre local sans copies */}
            {!hasActiveUserLoan && isLocalBook && currentBook.copiesAvailable <= 0 && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  ⚠️ Ce livre n'a plus d'exemplaires disponibles. Tous les exemplaires sont actuellement empruntés.
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Section des emprunts actifs */}
      {isLocalBook && loans.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            📋 Emprunts actifs ({loans.length})
          </Typography>
          
          {loans.map((loan) => (
            <Box 
              key={loan.id} 
              sx={{ 
                p: 2, 
                mb: 2, 
                border: '1px solid',
                borderColor: loan.isOverdue ? 'error.main' : 'divider',
                borderRadius: 1,
                backgroundColor: loan.isOverdue ? 'error.light' : 'background.paper'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    👤 {loan.userName || loan.userEmail}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Emprunté le {new Date(loan.loanDate).toLocaleDateString('fr-FR')}
                  </Typography>
                  <Typography variant="body2" color={loan.isOverdue ? 'error.main' : 'text.secondary'}>
                    À retourner le {new Date(loan.dueDate).toLocaleDateString('fr-FR')}
                    {loan.isOverdue && ` (⚠️ ${loan.daysOverdue} jour(s) de retard)`}
                  </Typography>
                  {loan.isOverdue && loan.lateFee > 0 && (
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      Pénalité de retard : {loan.lateFee.toFixed(2)} €
                    </Typography>
                  )}
                </Box>
                <Chip 
                  label={loan.status} 
                  color={loan.isOverdue ? 'error' : 'success'}
                  size="small"
                />
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Container>
  );
};

export default BookDetails;

