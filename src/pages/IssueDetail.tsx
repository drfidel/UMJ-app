import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Lock, Unlock, Calendar, ArrowLeft, Download, Eye, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { CURATED_ARTICLES, JournalArticle } from '@/data/journalData';
import { DUMMY_PDF_DATA_URI } from './ArticleDetail';

export default function IssueDetail() {
  const { volumeId, issueId } = useParams<{ volumeId: string; issueId: string }>();
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useAuth();

  useEffect(() => {
    const fetchArticles = async () => {
      if (!volumeId || !issueId) return;
      const volNum = parseInt(volumeId);
      const issNum = parseInt(issueId);
      const fallback = CURATED_ARTICLES.filter((a) => a.volume === volNum && a.issue === issNum);

      setLoading(true);
      try {
        if (isDemoMode) {
          setArticles(fallback);
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'articles'),
          where('volume', '==', volNum),
          where('issue', '==', issNum)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const fetchedArticles = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as JournalArticle[];
          setArticles(fetchedArticles);
        } else {
          setArticles(fallback);
        }
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching issue articles, falling back to curated archive', error);
        }
        setArticles(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [volumeId, issueId, isDemoMode]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-40 bg-muted rounded w-full" />
      </div>
    );
  }

  const isPublished = articles.length > 0;

  return (
    <div className="bg-background min-h-screen py-12">
      <SEO
        title={`Volume ${volumeId}, Issue ${issueId}`}
        description={`Table of contents for Uganda Medical Journal Volume ${volumeId}, Issue ${issueId}.`}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-8">
          <Link
            to="/archive"
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Journal Archive
          </Link>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1 tabular-nums">
            Volume {volumeId} · Issue {issueId}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
            Issue Table of Contents
          </h1>
        </div>

        {!isPublished ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-lg">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-2">Forthcoming Issue</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              This issue is currently in editorial production and has not been published yet.
            </p>
            <Link to="/archive" className={buttonVariants({ variant: 'outline' })}>
              Return to Archive
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {articles.map((article) => (
              <article key={article.id} className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground/85">
                    {article.articleType || 'Research Article'}
                  </span>
                  {article.specialty && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{article.specialty}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{format(new Date(article.publishedAt), 'MMMM yyyy')}</span>
                  <span aria-hidden="true">·</span>
                  {article.isOpenAccess ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                      <Unlock className="w-3 h-3" /> Open Access
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                      <Lock className="w-3 h-3" /> Subscription
                    </span>
                  )}
                </div>

                <h2 className="font-editorial text-xl sm:text-2xl font-bold text-foreground mb-2 leading-snug">
                  <Link
                    to={`/articles/${article.id}`}
                    className="hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
                  >
                    {article.title}
                  </Link>
                </h2>

                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {article.authors?.join(', ')}
                </p>

                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                  {article.abstract}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
                  <div className="text-xs text-muted-foreground">
                    {article.keywords?.slice(0, 4).join(' · ')}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> PDF Preview
                          </Button>
                        }
                      />
                      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-6 py-4 border-b border-border">
                          <DialogTitle className="line-clamp-1 pr-8 text-lg">{article.title}</DialogTitle>
                          <DialogDescription>PDF Preview</DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden bg-muted">
                          <iframe src={DUMMY_PDF_DATA_URI} title="PDF Preview" className="w-full h-full border-0" />
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = DUMMY_PDF_DATA_URI;
                              a.download = `${article.title
                                .substring(0, 30)
                                .replace(/[^a-z0-9]/gi, '_')
                                .toLowerCase()}.pdf`;
                              a.click();
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" /> Download PDF
                          </Button>
                          <Link to={`/articles/${article.id}`} className={buttonVariants()}>
                            Full Article <ArrowRight className="ml-2 w-4 h-4" />
                          </Link>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Link
                      to={`/articles/${article.id}`}
                      className={buttonVariants({ size: 'sm', className: 'h-8 text-xs bg-primary text-primary-foreground' })}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" /> Read Article
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
