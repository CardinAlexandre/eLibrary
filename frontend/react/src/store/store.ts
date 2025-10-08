import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import booksReducer from './slices/booksSlice';
import themeReducer from './slices/themeSlice';
import loansReducer from './slices/loansSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    theme: themeReducer,
    loans: loansReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

