import axios from 'axios';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1';
const API_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY || '';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface GoogleBook {
  id: string;
  title: string;
  authors: string[];
  isbn: string;
  bookType: string;
  publishedDate: string;
  pages: number;
  language: string;
  genre: string;
  tags: string[];
  description: string;
  coverUrl: string;
  isAvailable: boolean;
  copiesAvailable: number;
  totalCopies: number;
  averageRating: number;
  reviewCount: number;
  typeSpecificData: Record<string, any>;
}

export interface GoogleBooksResponse {
  totalItems: number;
  items: GoogleBook[];
}

const stripHtml = (html: string): string => {
  if (!html) return '';
  let text = html.replace(/<\/?(p|div|br|h[1-6]|li|tr|td)[^>]*>/gi, ' ');
  text = text.replace(/<[^>]*>/g, '');
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  text = textarea.value;
  return text.replace(/\s+/g, ' ').trim();
};

const normalizeDate = (dateString: string | undefined): string => {
  if (!dateString) {
    return new Date().toISOString();
  }

  try {
    const parts = dateString.split('-');
    
    if (parts.length === 1) {
      return `${parts[0]}-01-01T00:00:00.000Z`;
    } else if (parts.length === 2) {
      return `${parts[0]}-${parts[1]}-01T00:00:00.000Z`;
    } else {
      return new Date(dateString).toISOString();
    }
    } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return new Date().toISOString();
  }
};

const convertToBook = (item: any): GoogleBook => {
  const volumeInfo = item.volumeInfo || {};
  const isbn = volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || 
               volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier || 
               '';

  return {
    id: item.id,
    title: volumeInfo.title || 'Sans titre',
    authors: volumeInfo.authors || ['Auteur inconnu'],
    isbn: isbn,
    bookType: 'PrintedBook',
    publishedDate: normalizeDate(volumeInfo.publishedDate),
    pages: volumeInfo.pageCount || 0,
    language: volumeInfo.language || 'en',
    genre: volumeInfo.categories?.[0] || 'General',
    tags: volumeInfo.categories || [],
    description: stripHtml(volumeInfo.description) || 'Pas de description disponible',
    coverUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '',
    isAvailable: true,
    copiesAvailable: 3,
    totalCopies: 3,
    averageRating: volumeInfo.averageRating || 0,
    reviewCount: volumeInfo.ratingsCount || 0,
    typeSpecificData: {
      publisher: volumeInfo.publisher || '',
      previewLink: volumeInfo.previewLink || ''
    }
  };
};

export const searchGoogleBooks = async (
  query: string, 
  startIndex: number = 0, 
  maxResults: number = 20,
  filters?: { language?: string; subject?: string; orderBy?: string }
): Promise<GoogleBooksResponse> => {
  try {
    let searchQuery = query;
    
    if (filters?.subject) {
      searchQuery += `+subject:${filters.subject}`;
    }

    const url = `${GOOGLE_BOOKS_API}/volumes`;
    const params: any = {
      q: searchQuery,
      startIndex,
      maxResults,
      orderBy: filters?.orderBy || 'relevance'
    };

    if (filters?.language) {
      params.langRestrict = filters.language;
    }

    if (API_KEY) {
      params.key = API_KEY;
    }

    let response;
    let lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await axios.get(url, { params, timeout: 10000 });
        break;
      } catch (err: any) {
        lastError = err;
        if (err.response?.status === 503 && attempt < 2) {
          console.log(`Google Books API unavailable, retry ${attempt + 1}/2 in ${1000 * (attempt + 1)}ms...`);
          await sleep(1000 * (attempt + 1));
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError;
    }

    const books = (response.data.items || []).map(convertToBook);

    return {
      totalItems: response.data.totalItems || 0,
      items: books
    };
  } catch (error: any) {
    console.error('Error fetching Google Books:', error);
    
    if (error.response?.status === 503) {
      throw new Error('❌ Google Books API est temporairement indisponible. Veuillez réessayer dans quelques minutes ou utilisez votre catalogue local.');
    } else if (error.response?.status === 429) {
      throw new Error('⚠️ Quota dépassé. Attendez quelques secondes ou ajoutez une clé API dans .env (REACT_APP_GOOGLE_BOOKS_API_KEY).');
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('⏱️ Délai d\'attente dépassé. Vérifiez votre connexion internet.');
    } else if (error.response?.data?.error) {
      throw new Error(`❌ ${error.response.data.error.message || 'Erreur Google Books API'}`);
    }
    
    throw new Error('❌ Erreur lors de la recherche Google Books. Vérifiez votre connexion internet ou utilisez le catalogue local.');
  }
};

export const getGoogleBookById = async (id: string): Promise<GoogleBook | null> => {
  try {
    const url = `${GOOGLE_BOOKS_API}/volumes/${id}`;
    const params: any = {};

    if (API_KEY) {
      params.key = API_KEY;
    }

    let response;
    let lastError;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await axios.get(url, { params, timeout: 10000 });
        break;
      } catch (err: any) {
        lastError = err;
        if (err.response?.status === 503 && attempt < 1) {
          await sleep(1000);
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError;
    }

    return convertToBook(response.data);
  } catch (error: any) {
    console.error('Error fetching Google Book:', error);
    
    if (error.response?.status === 503) {
      throw new Error('❌ Google Books API est temporairement indisponible.');
    } else if (error.response?.status === 429) {
      throw new Error('⚠️ Quota dépassé. Ajoutez une clé API Google Books.');
    }
    
    return null;
  }
};

