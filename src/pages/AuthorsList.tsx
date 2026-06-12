import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, FileText, Eye, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Article {
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

  // Dummy data fallback
  const dummyArticles: Article[] = [
    { authors: ['Dr. Jane Namukasa', 'Dr. Peter Okello'], views: 1250, citations: 15 },
    { authors: ['Dr. Sarah Kizza', 'Prof. Emmanuel Mukiibi'], views: 800, citations: 8 },
    { authors: ['Dr. Moses Byaruhanga'], views: 2400, citations: 42 },
    { authors: ['Dr. Florence Akello', 'Dr. David Otim'], views: 450, citations: 2 },
    { authors: ['Dr. Jane Namukasa'], views: 200, citations: 3 },
  ];

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        let fetchedArticles: Article[] = [];

        if (isDemoMode) {
          fetchedArticles = dummyArticles;
        } else {
          const q = query(collection(db, 'articles'));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            fetchedArticles = querySnapshot.docs.map(doc => doc.data() as Article);
          } else {
            fetchedArticles = dummyArticles;
          }
        }

        const authorMetricsMap = new Map<string, AuthorMetrics>();
        
        fetchedArticles.forEach(article => {
          if (article.authors && Array.isArray(article.authors)) {
            article.authors.forEach(authorRaw => {
              const author = authorRaw.trim();
              if (!authorMetricsMap.has(author)) {
                authorMetricsMap.set(author, {
                  name: author,
                  articleCount: 0,
                  totalViews: 0,
                  totalCitations: 0
                });
              }
              const metrics = authorMetricsMap.get(author)!;
              metrics.articleCount += 1;
              metrics.totalViews += article.views || 0;
              metrics.totalCitations += article.citations || 0;
            });
          }
        });

        const sortedAuthors = Array.from(authorMetricsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        setAuthors(sortedAuthors);
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          // Silent fallback
        } else {
          console.error("Error fetching authors, falling back to dummy data", error);
        }
        
        const authorMetricsMap = new Map<string, AuthorMetrics>();
        dummyArticles.forEach(article => {
          if (article.authors && Array.isArray(article.authors)) {
            article.authors.forEach(authorRaw => {
              const author = authorRaw.trim();
              if (!authorMetricsMap.has(author)) {
                authorMetricsMap.set(author, {
                  name: author,
                  articleCount: 0,
                  totalViews: 0,
                  totalCitations: 0
                });
              }
              const metrics = authorMetricsMap.get(author)!;
              metrics.articleCount += 1;
              metrics.totalViews += article.views || 0;
              metrics.totalCitations += article.citations || 0;
            });
          }
        });
        setAuthors(Array.from(authorMetricsMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, [isDemoMode]);

  const filteredAuthors = authors.filter(author => 
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group authors by first letter safely
  const groupedAuthors: Record<string, AuthorMetrics[]> = {};
  filteredAuthors.forEach(author => {
    // Determine the letter to group by (handle cases where names start with 'Dr.', 'Prof.', etc.)
    const cleanName = author.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
    const firstLetter = cleanName.charAt(0).toUpperCase();
    
    if (!groupedAuthors[firstLetter]) {
      groupedAuthors[firstLetter] = [];
    }
    groupedAuthors[firstLetter].push(author);
  });

  const sortedLetters = Object.keys(groupedAuthors).sort();

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight flex items-center justify-center">
            <Users className="w-10 h-10 mr-4 text-blue-700" />
            Our Authors
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover the researchers, clinicians, and academics who have contributed their work to the Uganda Medical Association Journal.
          </p>
        </div>

        <div className="mb-10 max-w-md mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search authors..."
              className="pl-10 h-12 text-base rounded-full border-slate-200 focus-visible:ring-blue-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-12 animate-pulse">
            {[1, 2].map((group) => (
              <div key={group}>
                <div className="flex items-center mb-6">
                  <div className="h-8 bg-slate-200 rounded w-10"></div>
                  <div className="h-px bg-slate-200 flex-grow ml-4"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 md:pl-16">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="h-full border border-slate-200 bg-white overflow-hidden flex flex-col">
                      <CardContent className="p-6 flex flex-col flex-grow">
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-200"></div>
                          <div className="flex-1 min-w-0 space-y-2 mt-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </div>
                        
                        <div className="mt-auto grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 rounded-lg py-3 px-2 border border-slate-100 items-center">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="h-2 bg-slate-200 rounded w-8"></div>
                            <div className="h-3 bg-slate-200 rounded w-4"></div>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="h-2 bg-slate-200 rounded w-8"></div>
                            <div className="h-3 bg-slate-200 rounded w-6"></div>
                          </div>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="h-2 bg-slate-200 rounded w-12"></div>
                            <div className="h-3 bg-slate-200 rounded w-4"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredAuthors.length > 0 ? (
          <div className="space-y-12">
            {sortedLetters.map(letter => (
              <div key={letter} className="relative">
                <div className="flex items-center mb-6">
                  <div className="text-3xl font-bold text-blue-700 w-12">{letter}</div>
                  <div className="h-px bg-slate-200 flex-grow ml-4"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 md:pl-16">
                  {groupedAuthors[letter].map(author => (
                    <Link 
                      key={author.name} 
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="block group"
                    >
                      <Card className="h-full border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white overflow-hidden flex flex-col group-hover:-translate-y-1">
                        <CardContent className="p-6 flex flex-col flex-grow">
                          <div className="flex items-start space-x-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold uppercase text-lg border border-blue-100 shadow-sm group-hover:scale-110 transition-transform">
                              {author.name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').substring(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                                {author.name}
                              </p>
                              <p className="text-sm font-medium text-blue-600 mt-1 flex items-center">
                                View Full Profile <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1 duration-300">&rarr;</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-auto grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 rounded-lg py-3 px-2 border border-slate-100 items-center text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center"><FileText className="w-3 h-3 mr-1" />Articles</span>
                              <span className="font-bold text-slate-800 text-sm">{author.articleCount}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center"><Eye className="w-3 h-3 mr-1" />Views</span>
                              <span className="font-bold text-slate-800 text-sm">{author.totalViews > 999 ? (author.totalViews / 1000).toFixed(1) + 'k' : author.totalViews}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center"><BookOpen className="w-3 h-3 mr-1" />Citations</span>
                              <span className="font-bold text-slate-800 text-sm">{author.totalCitations}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No authors found</h3>
            <p className="text-slate-500 mt-1">
              {searchTerm ? `No authors match "${searchTerm}"` : 'There are currently no authors in the system.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}