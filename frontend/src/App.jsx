import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layouts/Layout';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Trending from './pages/Trending';
import TopRated from './pages/TopRated';
import Genres from './pages/Genres';
import MovieDetails from './pages/MovieDetails';
import PersonDetails from './pages/PersonDetails';
import AiAssistant from './pages/AiAssistant';
import MoodRecommender from './pages/MoodRecommender';
import Watchlist from './pages/Watchlist';
import Favorites from './pages/Favorites';
import Dashboard from './pages/Dashboard';
import Social from './pages/Social';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="trending" element={<Trending />} />
            <Route path="top-rated" element={<TopRated />} />
            <Route path="genres" element={<Genres />} />
            <Route path="movie/:id" element={<MovieDetails />} />
            <Route path="actor/:id" element={<PersonDetails />} />
            <Route path="director/:id" element={<PersonDetails />} />
            <Route path="ai-assistant" element={<AiAssistant />} />
            <Route path="mood" element={<MoodRecommender />} />
            <Route path="social" element={<Social />} />

            {/* User Protected Routes */}
            <Route
              path="watchlist"
              element={
                <ProtectedRoute>
                  <Watchlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Route */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Auth Routes */}
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ForgotPassword />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
