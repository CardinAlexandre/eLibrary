import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAppSelector } from './store/hooks';
import Layout from './components/Layout/Layout';
import NotificationToast from './components/Notifications/NotificationToast';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import Import from './pages/Import';
import Loans from './pages/Loans';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  const darkMode = useAppSelector(state => state.theme.darkMode);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationToast />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books/:id" element={<BookDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/import" element={
              <PrivateRoute requiredRole="Admin,Librarian">
                <Import />
              </PrivateRoute>
            } />
            
            <Route path="/loans" element={
              <PrivateRoute>
                <Loans />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard" element={
              <PrivateRoute requiredRole="Admin,Librarian">
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

