import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Download, FileText, Share2, Quote, Lock, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  volume: number;
  issue: number;
  publishedAt: string;
  doi?: string;
  pdfUrl?: string;
  views?: number;
  isOpenAccess?: boolean;
}

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { user, profile } = useAuth();

  const isSubscribed = user && profile && ['subscribed_reader', 'institutional', 'admin', 'editor', 'reviewer', 'author'].includes(profile.role);

  // Dummy data fallback
  const dummyArticles: Record<string, Article> = {
    '1': {
      id: '1',
      title: 'Prevalence and Risk Factors of Malaria in Pregnant Women in Rural Uganda',
      authors: ['Dr. Jane Namukasa', 'Dr. Peter Okello', 'Prof. Samuel Lwanga'],
      abstract: 'Background: Malaria during pregnancy remains a major public health challenge in sub-Saharan Africa. This study investigates the current prevalence rates and associated risk factors for malaria infection among pregnant women attending antenatal care in rural health centers across Uganda.\n\nMethods: A cross-sectional study was conducted involving 850 pregnant women across 12 rural health centers. Blood samples were tested using rapid diagnostic tests (RDTs) and microscopy. Demographic and behavioral data were collected via structured questionnaires.\n\nResults: The overall prevalence of malaria was 24.5%. Factors significantly associated with infection included non-use of insecticide-treated nets (ITNs) (aOR 3.2, 95% CI 2.1-4.8), primigravida status (aOR 2.1, 95% CI 1.5-3.0), and living in proximity to stagnant water bodies. Only 45% of participants reported receiving intermittent preventive treatment (IPTp) according to national guidelines.\n\nConclusion: The prevalence of malaria among pregnant women in rural Uganda remains unacceptably high. There is an urgent need to intensify the distribution and promote the utilization of ITNs, alongside improving the coverage of IPTp services in rural antenatal care settings.',
      keywords: ['Malaria', 'Maternal Health', 'Epidemiology', 'Uganda', 'Pregnancy'],
      volume: 45,
      issue: 3,
      publishedAt: new Date('2023-10-15').toISOString(),
      doi: '10.1234/umaj.2023.45.3.01',
      pdfUrl: '#',
      views: 1245,
      isOpenAccess: false
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'articles', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
        } else {
          // Fallback to dummy data
          setArticle(dummyArticles[id] || dummyArticles['1']);
        }
      } catch (error) {
        console.error("Error fetching article", error);
        setArticle(dummyArticles[id] || dummyArticles['1']);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      if (!article) return;
      
      setLoadingRelated(true);
      try {
        const relatedMap = new Map<string, Article>();

        // 1. Fetch by shared keywords
        if (article.keywords && article.keywords.length > 0) {
          const keywordsQuery = query(
            collection(db, 'articles'),
            where('keywords', 'array-contains-any', article.keywords.slice(0, 10))
          );
          const keywordsSnap = await getDocs(keywordsQuery);
          keywordsSnap.forEach(doc => {
            if (doc.id !== article.id) {
              relatedMap.set(doc.id, { id: doc.id, ...doc.data() } as Article);
            }
          });
        }

        // 2. Fetch by shared authors
        if (article.authors && article.authors.length > 0) {
          const authorsQuery = query(
            collection(db, 'articles'),
            where('authors', 'array-contains-any', article.authors.slice(0, 10))
          );
          const authorsSnap = await getDocs(authorsQuery);
          authorsSnap.forEach(doc => {
            if (doc.id !== article.id) {
              relatedMap.set(doc.id, { id: doc.id, ...doc.data() } as Article);
            }
          });
        }

        const combined = Array.from(relatedMap.values());
        
        // Sort by publication date (newest first)
        combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        setRelatedArticles(combined.slice(0, 3));
      } catch (error) {
        console.error("Error fetching related articles:", error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedArticles();
  }, [article]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Article Not Found</h2>
        <p className="text-slate-600 mb-8">The article you are looking for does not exist or has been removed.</p>
        <Link to="/articles" className={buttonVariants()}>Return to Articles</Link>
      </div>
    );
  }

  const getVancouverCitation = () => {
    const authorString = article.authors.join(', ');
    const year = new Date(article.publishedAt).getFullYear();
    return `${authorString}. ${article.title}. Uganda Medical Association Journal. ${year};${article.volume}(${article.issue}). ${article.doi ? `doi: ${article.doi}` : ''}`;
  };

  const getAPACitation = () => {
    const authorString = article.authors.join(', ');
    const year = new Date(article.publishedAt).getFullYear();
    return `${authorString}. (${year}). ${article.title}. Uganda Medical Association Journal, ${article.volume}(${article.issue}). ${article.doi ? `https://doi.org/${article.doi}` : ''}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('Citation copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/articles" className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 mb-8 font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 md:p-10 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-6">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium rounded-sm">
                Research Article
              </Badge>
              <span>•</span>
              <span>Vol {article.volume}, Issue {article.issue}</span>
              <span>•</span>
              <span>Published: {format(new Date(article.publishedAt), 'MMMM d, yyyy')}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
              {article.title}
            </h1>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Authors</h3>
              <p className="text-lg text-slate-800 font-medium flex flex-wrap gap-2">
                {article.authors.map((author: string, index: number) => (
                  <span key={index}>
                    <Link to={`/author/${encodeURIComponent(author)}`} className="text-blue-700 hover:underline">
                      {author}
                    </Link>
                    {index < article.authors.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>

            {article.doi && (
              <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100 inline-block">
                <span className="font-semibold mr-2">DOI:</span>
                <a href={`https://doi.org/${article.doi}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {article.doi}
                </a>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              {article.isOpenAccess || isSubscribed ? (
                <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              ) : (
                <Button disabled className="bg-slate-300 text-slate-500 cursor-not-allowed">
                  <Lock className="mr-2 h-4 w-4" />
                  Subscription Required
                </Button>
              )}
              <Dialog>
                <DialogTrigger render={
                  <Button variant="outline" className="bg-white">
                    <Quote className="mr-2 h-4 w-4" />
                    Cite
                  </Button>
                } />
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Cite this article</DialogTitle>
                    <DialogDescription>
                      Choose your preferred citation format and copy it to your clipboard.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="vancouver" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="vancouver">Vancouver</TabsTrigger>
                      <TabsTrigger value="apa">APA</TabsTrigger>
                    </TabsList>
                    <TabsContent value="vancouver" className="mt-4">
                      <div className="relative bg-slate-50 p-4 rounded-md border border-slate-200">
                        <p className="text-sm text-slate-800 pr-10">{getVancouverCitation()}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 text-slate-500 hover:text-blue-700"
                          onClick={() => handleCopy(getVancouverCitation())}
                        >
                          {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="apa" className="mt-4">
                      <div className="relative bg-slate-50 p-4 rounded-md border border-slate-200">
                        <p className="text-sm text-slate-800 pr-10">{getAPACitation()}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 text-slate-500 hover:text-blue-700"
                          onClick={() => handleCopy(getAPACitation())}
                        >
                          {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center text-sm text-slate-500 gap-4">
              <span className="flex items-center">
                <FileText className="mr-1 h-4 w-4" /> {article.views || 0} Views
              </span>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-700">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Abstract</h2>
            <div className="prose prose-slate max-w-none mb-10">
              {article.abstract.split('\n\n').map((paragraph, idx) => {
                // Check if paragraph starts with a bold header like "Background:"
                const parts = paragraph.split(': ');
                if (parts.length > 1 && ['Background', 'Methods', 'Results', 'Conclusion'].includes(parts[0])) {
                  return (
                    <p key={idx} className="mb-4 text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">{parts[0]}: </strong>
                      {parts.slice(1).join(': ')}
                    </p>
                  );
                }
                return <p key={idx} className="mb-4 text-slate-700 leading-relaxed">{paragraph}</p>;
              })}
            </div>

            {!(article.isOpenAccess || isSubscribed) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center my-8">
                <Lock className="mx-auto h-8 w-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Full Text Access Restricted</h3>
                <p className="text-slate-600 mb-4">
                  This article is not open access. You need an active subscription to view the full text and download the PDF.
                </p>
                <Link to="/subscription" className={buttonVariants({ className: "bg-blue-700 hover:bg-blue-800 text-white" })}>
                  View Subscription Options
                </Link>
              </div>
            )}

            {(article.isOpenAccess || isSubscribed) && (
              <>
                <Separator className="my-8" />
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Full Text</h2>
                <div className="prose prose-slate max-w-none mb-10">
                  <p className="text-slate-700 leading-relaxed italic">
                    [Full text content would be displayed here for subscribed users or open access articles. This is a placeholder.]
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              </>
            )}

            <Separator className="my-8" />

            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map(keyword => (
                  <Badge key={keyword} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 px-3 py-1">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Related Articles</h2>
          
          {loadingRelated ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : relatedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Card key={relatedArticle.id} className="hover:shadow-md transition-shadow border-slate-200">
                  <CardContent className="p-6">
                    <div className="text-xs text-slate-500 mb-2">
                      {format(new Date(relatedArticle.publishedAt), 'MMM d, yyyy')}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                      <Link to={`/articles/${relatedArticle.id}`} className="hover:text-blue-700 transition-colors">
                        {relatedArticle.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-slate-600">
                      {relatedArticle.authors.join(', ')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <p className="text-slate-500">No related articles found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
