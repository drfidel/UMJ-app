import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SEO from '@/components/SEO';
import { CURATED_ARTICLES } from '@/data/journalData';

interface ArticleMetricsSource {
  authors: string[];
  views?: number;
  downloads?: number;
  citations?: number;
}

interface AuthorMetrics {
  name: string;
  articleCount: number;
  totalViews: number;
  totalCitations: number;
}

export default function AuthorsList() {
  const [authors, setAuthors] = useState<AuthorMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isDemoMode } = useAuth();

  useEffect(() => {
    const buildMap = (list: ArticleMetricsSource[]) => {
      const authorMetricsMap = new Map<string, AuthorMetrics>();
      list.forEach((article) => {
        if (article.authors && Array.isArray(article.authors)) {
          article.authors.forEach((authorRaw) => {
            const author = authorRaw.trim();
            if (!authorMetricsMap.has(author)) {
              authorMetricsMap.set(author, {
                name: author,
                articleCount: 0,
                totalViews: 0,
                totalCitations: 0,
              });
            }
            const metrics = authorMetricsMap.get(author)!;
            metrics.articleCount += 1;
            metrics.totalViews += article.views || 0;
            metrics.totalCitations += article.citations || 0;
          });
        }
      });
      return Array.from(authorMetricsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    };

    const fetchAuthors = async () => {
      try {
        let fetchedArticles: ArticleMetricsSource[] = [];

        if (isDemoMode) {
          fetchedArticles = CURATED_ARTICLES;
        } else {
          const q = query(collection(db, 'articles'));
          const querySnapshot = await getDocs(q);
          fetchedArticles = !querySnapshot.empty
            ? querySnapshot.docs.map((doc) => doc.data() as ArticleMetricsSource)
            : CURATED_ARTICLES;
        }

        setAuthors(buildMap(fetchedArticles));
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching authors, falling back to curated archive', error);
        }
        setAuthors(buildMap(CURATED_ARTICLES));
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, [isDemoMode]);

  const filteredAuthors = authors.filter((author) =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedAuthors: Record<string, AuthorMetrics[]> = {};
  filteredAuthors.forEach((author) => {
    const cleanName = author.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
    const firstLetter = cleanName.charAt(0).toUpperCase();
    if (!groupedAuthors[firstLetter]) groupedAuthors[firstLetter] = [];
    groupedAuthors[firstLetter].push(author);
  });

  const sortedLetters = Object.keys(groupedAuthors).sort();

  return (
    <div className="bg-background min-h-screen py-12">
      <SEO
        title="Authors Directory"
        description="Browse researchers, clinicians, and academics contributing to the Uganda Medical Journal."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Contributing Investigators
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
              Authors Directory
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
              Explore clinicians, researchers, and health policy scholars who have published in the Uganda Medical Journal.
            </p>
          </div>
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter authors by name..."
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-3">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredAuthors.length > 0 ? (
          <div className="space-y-10">
            {sortedLetters.map((letter) => (
              <section key={letter}>
                <div className="flex items-center mb-5">
                  <span className="font-editorial text-2xl font-bold text-primary w-10">{letter}</span>
                  <div className="h-px bg-border flex-grow" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupedAuthors[letter].map((author) => {
                    const initials = author.name
                      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();
                    return (
                      <Link
                        key={author.name}
                        to={`/author/${encodeURIComponent(author.name)}`}
                        className="group bg-card border border-border rounded-lg p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-3.5 mb-5">
                          <div className="h-11 w-11 rounded-full bg-muted text-foreground flex items-center justify-center font-editorial font-bold text-sm shrink-0 border border-border">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-editorial text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                              {author.name}
                            </h2>
                            <span className="text-xs font-medium text-primary inline-flex items-center mt-1">
                              Author Profile <ArrowRight className="ml-1 h-3 w-3" />
                            </span>
                          </div>
                        </div>

                        <dl className="grid grid-cols-3 border-t border-border pt-3 text-center text-xs">
                          <div>
                            <dt className="text-muted-foreground">Articles</dt>
                            <dd className="font-mono tabular-nums font-semibold text-foreground mt-0.5">
                              {author.articleCount}
                            </dd>
                          </div>
                          <div className="border-x border-border">
                            <dt className="text-muted-foreground">Views</dt>
                            <dd className="font-mono tabular-nums font-semibold text-foreground mt-0.5">
                              {author.totalViews > 999
                                ? `${(author.totalViews / 1000).toFixed(1)}k`
                                : author.totalViews}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Citations</dt>
                            <dd className="font-mono tabular-nums font-semibold text-foreground mt-0.5">
                              {author.totalCitations}
                            </dd>
                          </div>
                        </dl>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground">No authors found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? `No contributing authors match "${searchTerm}".` : 'No authors available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}