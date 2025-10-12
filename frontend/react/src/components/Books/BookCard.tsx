import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Rating, Chip, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface Book {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string;
  genre: string;
  averageRating: number;
  reviewCount: number;
  isAvailable: boolean;
}

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          width: '100%',
          paddingTop: '150%',
          position: 'relative',
          backgroundColor: '#f5f5f5',
          overflow: 'hidden'
        }}
      >
        <CardMedia
          component="img"
          image={book.coverUrl || 'https://via.placeholder.com/200x300?text=No+Cover'}
          alt={book.title}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {book.authors.join(', ')}
        </Typography>
        <Box sx={{ mt: 1, mb: 1 }}>
          <Chip label={book.genre} size="small" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Rating value={book.averageRating} precision={0.5} size="small" readOnly />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({book.reviewCount})
          </Typography>
        </Box>
        <Chip 
          label={book.isAvailable ? 'Disponible' : 'Indisponible'} 
          color={book.isAvailable ? 'success' : 'error'}
          size="small"
          sx={{ mt: 1 }}
        />
      </CardContent>
      <Box sx={{ p: 2 }}>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={() => navigate(`/books/${book.id}`)}
        >
          Voir détails
        </Button>
      </Box>
    </Card>
  );
};

export default BookCard;

