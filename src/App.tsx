import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import Layout from './components/Layout';
import Home from './pages/Home';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import IssueDetail from './pages/IssueDetail';
import AuthorsList from './pages/AuthorsList';
import Submit from './pages/Submit';
import Dashboard from './pages/Dashboard';
import EditorialBoard from './pages/EditorialBoard';
import EditorialPolicy from './pages/EditorialPolicy';
import About from './pages/About';
import Contact from './pages/Contact';
import Archive from './pages/Archive';
import AuthorGuidelines from './pages/AuthorGuidelines';
import Subscription from './pages/Subscription';
import Checkout from './pages/Checkout';
import AuthorProfile from './pages/AuthorProfile';
import Profile from './pages/Profile';
import Metrics from './pages/Metrics';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import { Toaster } from '@/components/ui/sonner';

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="articles" element={<Articles />} />
              <Route path="articles/:id" element={<ArticleDetail />} />
              <Route path="issue/:volumeId/:issueId" element={<IssueDetail />} />
              <Route path="authors" element={<AuthorsList />} />
              <Route path="author/:name" element={<AuthorProfile />} />
              <Route path="profile" element={<Profile />} />
              <Route path="archive" element={<Archive />} />
              <Route path="submit" element={<Submit />} />
              <Route path="author-guidelines" element={<AuthorGuidelines />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="checkout/:plan" element={<Checkout />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="editorial-board" element={<EditorialBoard />} />
              <Route path="editorial-policy" element={<EditorialPolicy />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="metrics" element={<Metrics />} />
              <Route path="events" element={<Events />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms-of-service" element={<TermsOfService />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
