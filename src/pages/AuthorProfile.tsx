import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Building, GraduationCap, ArrowLeft, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

import SEO from '@/components/SEO';
import { CURATED_ARTICLES, CURATED_AUTHOR_PROFILES, JournalArticle } from '@/data/journalData';

export default function AuthorProfile() {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';

  const [authorProfile, setAuthorProfile] = useState<any | null>(null);
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useAuth();

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!decodedName) return;

      setLoading(true);
      const curatedForAuthor = CURATED_ARTICLES.filter((a) => a.authors.includes(decodedName));

      // 1. Try to find the user profile in the 'users' collection
      try {
        if (isDemoMode) {
          if (CURATED_AUTHOR_PROFILES[decodedName]) {
            setAuthorProfile(CURATED_AUTHOR_PROFILES[decodedName]);
          }
        } else {
          const usersQuery = query(
            collection(db, 'users'),
            where('displayName', '==', decodedName)
          );
          const usersSnap = await getDocs(usersQuery);

          if (!usersSnap.empty) {
            setAuthorProfile(usersSnap.docs[0].data());
          } else if (CURATED_AUTHOR_PROFILES[decodedName]) {
            setAuthorProfile(CURATED_AUTHOR_PROFILES[decodedName]);
          }
        }
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching user profile:', error);
        }
        if (CURATED_AUTHOR_PROFILES[decodedName]) {
          setAuthorProfile(CURATED_AUTHOR_PROFILES[decodedName]);
        }
      }

      // 2. Find all articles by this author and merge with curated archive
      try {
        let fetchedArticles: JournalArticle[] = [];

        if (isDemoMode) {
          fetchedArticles = curatedForAuthor;
        } else {
          const articlesQuery = query(
            collection(db, 'articles'),
            where('authors', 'array-contains', decodedName)
          );
          const articlesSnap = await getDocs(articlesQuery);

          const mergedMap = new Map<string, JournalArticle>();
          curatedForAuthor.forEach((a) => mergedMap.set(a.id, a));
          articlesSnap.docs.forEach((doc) => {
            mergedMap.set(doc.id, { id: doc.id, ...doc.data() } as JournalArticle);
          });
          fetchedArticles = Array.from(mergedMap.values());
        }

        fetchedArticles.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        setArticles(fetchedArticles);
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching author articles:', error);
        }
        setArticles(curatedForAuthor);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [decodedName, isDemoMode]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-background min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/articles" className="inline-flex items-center text-sm text-primary hover:underline mb-8 font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Author Profile Sidebar */}
          <div className="md:col-span-1">
            <Card className="border-border bg-card shadow-sm sticky top-24">
              <CardContent className="pt-8 text-center">
                <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 font-editorial text-2xl font-bold border border-primary/20">
                  {decodedName
                    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s+/i, '')
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('') || <User className="h-9 w-9" />}
                </div>
                <h1 className="font-editorial text-2xl font-bold text-foreground mb-2">{decodedName}</h1>
                
                {authorProfile?.isVerifiedReviewer && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-4">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified Reviewer · {authorProfile.completedReviews} Reviews</span>
                  </div>
                )}
                
                {authorProfile?.affiliation && (
                  <div className="flex items-start justify-center text-muted-foreground mb-2 gap-2 text-sm">
                    <Building className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{authorProfile.affiliation}</span>
                  </div>
                )}
                
                {authorProfile?.specialties && authorProfile.specialties.length > 0 && (
                  <div className="mt-6 text-left border-t border-border pt-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center">
                      <GraduationCap className="h-3.5 w-3.5 mr-2" />
                      Clinical Specialties
                    </h3>
                    <p className="text-sm text-foreground">
                      {authorProfile.specialties.join(' · ')}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-5 border-t border-border flex justify-around text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary font-mono tabular-nums">{articles.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Publications</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Author's Articles List */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="font-editorial text-2xl font-bold text-foreground flex items-center pb-3 border-b border-border">
              <BookOpen className="h-5 w-5 mr-3 text-primary" />
              Published Articles
            </h2>
            
            {articles.length > 0 ? (
              <div className="bg-card border border-border rounded-lg divide-y divide-border">
                {articles.map((article) => (
                  <article key={article.id} className="p-6 hover:bg-muted/25 transition-colors">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="font-semibold text-primary">Research Article</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Vol {article.volume}, Issue {article.issue}</span>
                    </div>
                    
                    <h3 className="font-editorial text-xl font-bold text-foreground mb-2 leading-snug">
                      <Link to={`/articles/${article.id}`} className="hover:text-primary transition-colors">
                        {article.title}
                      </Link>
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {article.abstract}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <Link to={`/articles/${article.id}`} className="text-sm font-medium text-primary hover:underline">
                        Read Full Article →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No Articles Found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find any published articles for this author.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
