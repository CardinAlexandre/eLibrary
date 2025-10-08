import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userEmail: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  lateFee: number;
}

interface LoansState {
  items: Loan[];
  loading: boolean;
  error: string | null;
}

const initialState: LoansState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchLoans = createAsyncThunk('loans/fetchLoans', async (userId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/catalog/loans?userId=${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
});

export const createLoan = createAsyncThunk(
  'loans/createLoan',
  async ({ bookId, userId, userEmail }: any) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/catalog/loans`,
      { bookId, userId, userEmail, loanDurationDays: 14 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
);

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch loans';
      });
  },
});

export default loansSlice.reducer;

