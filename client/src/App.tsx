import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import AdminUpload from './pages/AdminUpload';
import VideoPlayer from './pages/VideoPlayer';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/Profile';
import MyList from './pages/MyList';
import Downloads from './pages/Downloads';
import UserManagement from './pages/admin/UserManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import ContentManagement from './pages/admin/ContentManagement';
import SystemSettings from './pages/admin/SystemSettings';
// import Movies from './pages/Movies';
// import MovieDetails from './pages/MovieDetails';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  const isVideoPlayerPage = location.pathname.startsWith('/watch/');
  
  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Hide Navbar on video player page for immersive experience */}
      {!isVideoPlayerPage && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* User Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <RoleProtectedRoute allowedRoles={['user', 'moderator', 'admin', 'super_admin']}>
              <UserDashboard />
            </RoleProtectedRoute>
          } 
        />

        {/* Admin Routes - Restricted to admin roles only */}
        <Route 
          path="/admin/dashboard" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/admin/upload" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminUpload />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <UserManagement />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/admin/analytics" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AnalyticsDashboard />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/admin/content" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <ContentManagement />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <SystemSettings />
            </RoleProtectedRoute>
          } 
        />
        
        {/* Video Player Route */}
        <Route 
          path="/watch/:id" 
          element={
            <ProtectedRoute>
              <VideoPlayer />
            </ProtectedRoute>
          } 
        />
        
        {/* Profile Route */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* My List Route */}
        <Route 
          path="/my-list" 
          element={
            <ProtectedRoute>
              <MyList />
            </ProtectedRoute>
          } 
        />
        
        {/* Downloads Route */}
        <Route 
          path="/downloads" 
          element={
            <ProtectedRoute>
              <Downloads />
            </ProtectedRoute>
          } 
        />
        
        {/* Temporarily commented out until we create these components */}
        {/* 
        <Route 
          path="/movies" 
          element={
            <ProtectedRoute>
              <Movies />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/movie/:id" 
          element={
            <ProtectedRoute>
              <MovieDetails />
            </ProtectedRoute>
          } 
        />
        */}
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;