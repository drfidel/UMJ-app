import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, profile, signInWithGoogle, loginAsDemoUser, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Articles', path: '/articles' },
    { name: 'Submit Manuscript', path: '/submit' },
    { name: 'Editorial Board', path: '/editorial-board' },
    { name: 'About', path: '/about' },
  ];

  const testRoles = [
    { id: 'author', label: 'Author' },
    { id: 'reviewer', label: 'Reviewer' },
    { id: 'editor', label: 'Editor' },
    { id: 'admin', label: 'Admin' },
    { id: 'subscribed_reader', label: 'Paid Subscriber' },
    { id: 'unsubscribed_reader', label: 'Free-tier Subscriber' },
    { id: 'institutional', label: 'Institutional' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-700" />
                <span className="font-bold text-xl text-slate-900 hidden sm:block">
                  Uganda Medical Association Journal
                </span>
                <span className="font-bold text-xl text-slate-900 sm:hidden">
                  UMAJ
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-slate-600 hover:text-blue-700 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-10 w-10 rounded-full outline-none hover:bg-slate-100 flex items-center justify-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.photoURL} alt={profile?.displayName} />
                        <AvatarFallback>{profile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {profile?.email}
                          </p>
                          <p className="text-xs font-semibold text-blue-600 mt-1 capitalize">
                            {profile?.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link to="/dashboard" className="w-full h-full">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className={buttonVariants({ variant: "outline", className: "gap-2 border-blue-700 text-blue-700" })}>
                      Demo Login
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Select Demo Role</DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      {testRoles.map(role => (
                        <DropdownMenuItem key={role.id} onClick={() => loginAsDemoUser(role.id as any)} className="cursor-pointer">
                          {role.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button onClick={signInWithGoogle} className="bg-blue-700 hover:bg-blue-800 text-white">
                    Log In
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-700 hover:bg-slate-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-slate-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="space-y-3 px-3 pb-3">
                  <Button onClick={() => { signInWithGoogle(); setIsMobileMenuOpen(false); }} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
                    Log In with Google
                  </Button>
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Demo Accounts (Local)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {testRoles.map(role => (
                        <Button key={role.id} variant="outline" size="sm" onClick={() => { loginAsDemoUser(role.id as any); setIsMobileMenuOpen(false); }} className="text-xs border-blue-700 text-blue-700">
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

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-400" />
                <span className="font-bold text-lg">UMAJ</span>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                The Uganda Medical Association Journal is a peer-reviewed, open-access medical journal dedicated to publishing high-quality research and clinical studies from Uganda and the international medical community.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/articles" className="text-slate-400 hover:text-white text-sm">Current Issue</Link></li>
                <li><Link to="/submit" className="text-slate-400 hover:text-white text-sm">Submit Manuscript</Link></li>
                <li><Link to="/editorial-board" className="text-slate-400 hover:text-white text-sm">Editorial Board</Link></li>
                <li><Link to="/about" className="text-slate-400 hover:text-white text-sm">About UMAJ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Uganda Medical Association</li>
                <li>P.O. Box 29874, Kampala, Uganda</li>
                <li>Email: editor@umaj.org.ug</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Uganda Medical Association. All rights reserved.</p>
            <div className="mt-4 md:mt-0 space-x-4">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
