import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { NotificationsMenu } from './NotificationsMenu';
import { ThemeToggle } from './ThemeToggle';
import { CommandSearch } from './CommandSearch';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signInWithGoogle, loginAsDemoUser, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success('Successfully subscribed to table of contents alerts.');
    setNewsletterEmail('');
  };

  const navLinks = [
    { name: 'Articles', path: '/articles' },
    { name: 'Archive', path: '/archive' },
    { name: 'Events', path: '/events' },
    { name: 'Metrics', path: '/metrics' },
    { name: 'Submit', path: '/submit' },
  ];

  const secondaryLinks = [
    { name: 'Current Issue', path: '/issue/45/3' },
    { name: 'Authors Directory', path: '/authors' },
    { name: 'Author Guidelines', path: '/author-guidelines' },
    { name: 'Editorial Board', path: '/editorial-board' },
    { name: 'Editorial Policy', path: '/editorial-policy' },
    { name: 'Subscriptions', path: '/subscription' },
    { name: 'About UMJ', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const testRoles = [
    { id: 'author', label: 'Author' },
    { id: 'reviewer', label: 'Reviewer' },
    { id: 'editor', label: 'Editor' },
    { id: 'admin', label: 'Admin' },
    { id: 'subscribed_reader', label: 'Paid Subscriber' },
    { id: 'unsubscribed_reader', label: 'Free-tier Reader' },
    { id: 'institutional', label: 'Institutional' },
  ];

  const isActivePath = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Top Bar: Clean 3-Zone Editorial Masthead */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8 h-16">
            {/* Zone 1: Single-line Brand Wordmark */}
            <Link
              to="/"
              className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-foreground whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
            >
              Uganda Medical Journal
            </Link>

            {/* Zone 2: 5 Concise Single-Line Navigation Links */}
            <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
              {navLinks.map((link) => {
                const active = isActivePath(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                      active
                        ? 'text-foreground border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Zone 3: Search Trigger + Theme + Account Action */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="text-muted-foreground hover:text-foreground gap-2 px-2.5 h-9 whitespace-nowrap shrink-0"
                aria-label="Search journal"
              >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline text-xs">Search</span>
                <kbd className="hidden xl:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>

              <ThemeToggle />

              {user ? (
                <>
                  <NotificationsMenu />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="relative h-9 w-9 rounded-full outline-none hover:ring-2 hover:ring-border flex items-center justify-center transition-all">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                        <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                          {profile?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                              {profile?.email}
                            </p>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-1 capitalize">
                              {profile?.role?.replace('_', ' ')}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                        Editorial Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer">
                    Sign In
                    <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={signInWithGoogle} className="cursor-pointer font-medium">
                      Sign In with Google
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                        Preview Role Access
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    {testRoles.map((role) => (
                      <DropdownMenuItem
                        key={role.id}
                        onClick={() => loginAsDemoUser(role.id as any)}
                        className="cursor-pointer"
                      >
                        {role.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center md:hidden gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search journal"
                className="h-10 w-10"
              >
                <Search className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              {user && <NotificationsMenu />}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-border my-2 pt-2 grid grid-cols-2 gap-1">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {user ? (
                <div className="border-t border-border pt-2 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Editorial Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-muted"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-border pt-3 pb-2 space-y-3">
                  <Button
                    onClick={() => {
                      signInWithGoogle();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Sign In with Google
                  </Button>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-2 px-1">
                      Preview Role Access
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {testRoles.map((role) => (
                        <Button
                          key={role.id}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            loginAsDemoUser(role.id as any);
                            setIsMobileMenuOpen(false);
                          }}
                          className="text-xs justify-start"
                        >
                          {role.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <CommandSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Institutional Editorial Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-4 space-y-4">
              <Link to="/" className="font-editorial text-xl font-bold text-white tracking-tight inline-block">
                Uganda Medical Journal
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                The official peer-reviewed, open-access medical publication of the Uganda Medical Association, advancing clinical research and public health across East Africa.
              </p>
              <p className="text-xs font-mono text-slate-500">
                ISSN 2410-1234 (Online) · CC BY 4.0
              </p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
                Journal
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/issue/45/3" className="text-slate-400 hover:text-white transition-colors">Current Issue</Link></li>
                <li><Link to="/articles" className="text-slate-400 hover:text-white transition-colors">All Articles</Link></li>
                <li><Link to="/archive" className="text-slate-400 hover:text-white transition-colors">Archive</Link></li>
                <li><Link to="/authors" className="text-slate-400 hover:text-white transition-colors">Authors Directory</Link></li>
                <li><Link to="/metrics" className="text-slate-400 hover:text-white transition-colors">Journal Metrics</Link></li>
                <li><Link to="/events" className="text-slate-400 hover:text-white transition-colors">Conferences & Events</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
                Publishing & Governance
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/submit" className="text-slate-400 hover:text-white transition-colors">Submit Manuscript</Link></li>
                <li><Link to="/author-guidelines" className="text-slate-400 hover:text-white transition-colors">Author Guidelines</Link></li>
                <li><Link to="/editorial-board" className="text-slate-400 hover:text-white transition-colors">Editorial Board</Link></li>
                <li><Link to="/editorial-policy" className="text-slate-400 hover:text-white transition-colors">Editorial & Ethics Policy</Link></li>
                <li><Link to="/subscription" className="text-slate-400 hover:text-white transition-colors">Subscriptions & Pricing</Link></li>
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About UMJ</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Editorial Office</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-4">
                Table of Contents Alerts
              </h3>
              <p className="text-slate-400 text-sm mb-3 leading-relaxed">
                Receive notifications when new peer-reviewed issues and clinical guidelines are published.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <Input
                  type="email"
                  placeholder="clinician@hospital.org"
                  className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 h-9 text-sm"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" className="w-full bg-blue-700 hover:bg-blue-600 text-white">
                  Subscribe to Alerts
                </Button>
              </form>
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p>Uganda Medical Association · P.O. Box 29874, Kampala</p>
                <p>
                  <a
                    href="https://www.uma.ug"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white underline underline-offset-2"
                  >
                    Uganda Medical Association Portal
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} Uganda Medical Association. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="hover:text-slate-200 transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-slate-200 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
