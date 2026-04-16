import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Submit from './pages/Submit';
import Dashboard from './pages/Dashboard';
import EditorialBoard from './pages/EditorialBoard';
import About from './pages/About';
import Archive from './pages/Archive';
import AuthorGuidelines from './pages/AuthorGuidelines';
import Subscription from './pages/Subscription';
import Checkout from './pages/Checkout';
import AuthorProfile from './pages/AuthorProfile';
import Profile from './pages/Profile';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:id" element={<ArticleDetail />} />
            <Route path="author/:name" element={<AuthorProfile />} />
            <Route path="profile" element={<Profile />} />
            <Route path="archive" element={<Archive />} />
            <Route path="submit" element={<Submit />} />
            <Route path="author-guidelines" element={<AuthorGuidelines />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="checkout/:plan" element={<Checkout />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="editorial-board" element={<EditorialBoard />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
