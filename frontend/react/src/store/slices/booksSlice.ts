import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

interface Book {
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
  averageRating: number;
  reviewCount: number;
  typeSpecificData: Record<string, any>;
}

interface BooksState {
  items: Book[];
  currentBook: Book | null;
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

const initialState: BooksState = {
  items: [],
  currentBook: null,
  totalCount: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  error: null,
};

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async ({ page = 1, pageSize = 20, genre, language }: any) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (genre) params.append('genre', genre);
    if (language) params.append('language', language);
    
    const response = await axios.get(`${API_URL}/api/catalog/books?${params}`);
    return response.data;
  }
);

export const fetchBookById = createAsyncThunk(
  'books/fetchBookById',
  async (id: string) => {
    const response = await axios.get(`${API_URL}/api/catalog/books/${id}`);
    return response.data;
  }
);

export const searchBooks = createAsyncThunk(
  'books/searchBooks',
  async ({ query, page = 1, pageSize = 20 }: any) => {
    const response = await axios.get(
      `${API_URL}/api/catalog/books/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearCurrentBook: (state) => {
      state.currentBook = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch books';
      })
      .addCase(fetchBookById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBook = action.payload;
      })
      .addCase(fetchBookById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch book';
      })
      .addCase(searchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(searchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Search failed';
      });
  },
});

export const { clearCurrentBook } = booksSlice.actions;
export default booksSlice.reducer;

