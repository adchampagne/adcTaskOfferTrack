import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import Offers from './pages/Offers';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Departments from './pages/Departments';
import HeadDashboard from './pages/HeadDashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import Settings from './pages/Settings';
import MetadataCleaner from './pages/MetadataCleaner';
import Analytics from './pages/Analytics';
import Tools from './pages/Tools';
import ImageConverter from './pages/ImageConverter';
import DataGenerator from './pages/DataGenerator';
import ROICalculator from './pages/ROICalculator';
import Achievements from './pages/Achievements';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="partners" element={<Partners />} />
        <Route path="offers" element={<Offers />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="users" element={<Users />} />
        <Route path="departments" element={<Departments />} />
        <Route path="head-dashboard" element={<HeadDashboard />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="settings" element={<Settings />} />
        <Route path="tools" element={<Tools />} />
        <Route path="tools/metadata-cleaner" element={<MetadataCleaner />} />
        <Route path="tools/image-converter" element={<ImageConverter />} />
        <Route path="tools/data-generator" element={<DataGenerator />} />
        <Route path="tools/roi-calculator" element={<ROICalculator />} />
        <Route path="metadata-cleaner" element={<Navigate to="/tools/metadata-cleaner" />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="achievements" element={<Achievements />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

