import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CURATED_ARTICLES, MEDICAL_SPECIALTIES } from '@/data/journalData';
import { Search, FileText, ArrowRight, BookOpen, Send, BarChart3, Users, Calendar } from 'lucide-react';
import Fuse from 'fuse.js';

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const fuse = useMemo(
    () =>
      new Fuse(CURATED_ARTICLES, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'authors', weight: 2 },
          { name: 'specialty', weight: 1.5 },
          { name: 'keywords', weight: 1.5 },
          { name: 'doi', weight: 2 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    []
  );

  const matchedArticles = useMemo(() => {
    if (!query.trim()) return CURATED_ARTICLES.slice(0, 4);
    return fuse.search(query).map((r) => r.item).slice(0, 6);
  }, [query, fuse]);

  const matchedSpecialties = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return MEDICAL_SPECIALTIES.filter((s) => s.toLowerCase().includes(q)).slice(0, 3);
  }, [query]);

  const quickDestinations = [
    { label: 'Current Issue (Vol 45, Issue 3)', path: '/issue/45/3', icon: BookOpen },
    { label: 'Submit a Manuscript', path: '/submit', icon: Send },
    { label: 'Author Guidelines', path: '/author-guidelines', icon: FileText },
    { label: 'Editorial Board', path: '/editorial-board', icon: Users },
    { label: 'Journal Metrics & Impact', path: '/metrics', icon: BarChart3 },
    { label: 'Medical Conferences & Events', path: '/events', icon: Calendar },
  ];

  const handleGo = (path: string) => {
    onOpenChange(false);
    setQuery('');
    navigate(path);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleGo(`/articles?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-card text-card-foreground border border-border">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Uganda Medical Journal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-3" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, authors, specialties, or DOI..."
            className="h-12 border-0 shadow-none focus-visible:ring-0 px-0 text-sm bg-transparent"
          />
          {query.trim() && (
            <button
              type="submit"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap shrink-0 ml-2"
            >
              View all results
            </button>
          )}
        </form>

        <div className="max-h-[420px] overflow-y-auto p-3 space-y-4">
          {matchedSpecialties.length > 0 && (
            <div>
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Medical Specialties
              </p>
              <div className="space-y-1">
                {matchedSpecialties.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleGo(`/articles?specialty=${encodeURIComponent(spec)}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <span className="font-medium text-foreground">Filter by {spec}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {query.trim() ? 'Matching Articles' : 'Recent Publications'}
            </p>
            {matchedArticles.length > 0 ? (
              <div className="space-y-1">
                {matchedArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handleGo(`/articles/${article.id}`)}
                    className="w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 line-clamp-1">
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {article.articleType || 'Article'} · {article.authors.join(', ')} · Vol {article.volume}({article.issue})
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-6 text-sm text-center text-muted-foreground">
                No matching articles found for "{query}".
              </p>
            )}
          </div>

          {!query.trim() && (
            <div>
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Journal Sections
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {quickDestinations.map((dest) => (
                  <button
                    key={dest.path}
                    type="button"
                    onClick={() => handleGo(dest.path)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left text-sm text-foreground"
                  >
                    <dest.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{dest.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
