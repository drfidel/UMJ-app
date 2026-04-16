import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { FileText, Lock, Unlock, Calendar, BookOpen, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Article {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  volume: number;
  issue: number;
  publishedAt: string;
  isOpenAccess?: boolean;
}

export default function IssueDetail() {
  const { volumeId, issueId } = useParams<{ volumeId: string; issueId: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback dummy data for specific mock issues from the archive if db is empty
  const dummyArticles: Article[] = [
    {
      id: '1',
      title: 'Prevalence and Risk Factors of Malaria in Pregnant Women in Rural Uganda',
      authors: ['Dr. Jane Namukasa', 'Dr. Peter Okello'],
      abstract: 'This study investigates the current prevalence rates and associated risk factors for malaria infection among pregnant women attending antenatal care in rural health centers across Uganda. Results indicate a need for intensified preventive measures.',
      keywords: ['Malaria', 'Maternal Health', 'Epidemiology'],
      volume: 45,
      issue: 3,
      publishedAt: new Date('2023-10-15').toISOString(),
      isOpenAccess: false,
    },
    {
      id: '2',
      title: 'Outcomes of Antiretroviral Therapy in Pediatric HIV Patients: A 5-Year Retrospective Cohort',
      authors: ['Dr. Sarah Kizza', 'Prof. Emmanuel Mukiibi'],
      abstract: 'A comprehensive review of treatment outcomes, adherence rates, and viral load suppression among pediatric patients receiving ART at Mulago National Referral Hospital. The study highlights challenges in adolescent transition.',
      keywords: ['HIV/AIDS', 'Pediatrics', 'Infectious Diseases'],
      volume: 45,
      issue: 3,
      publishedAt: new Date('2023-11-02').toISOString(),
      isOpenAccess: true,
    },
    {
      id: '3',
      title: 'Integration of Traditional Medicine with Modern Healthcare in Managing Non-Communicable Diseases',
      authors: ['Dr. Moses Byaruhanga'],
      abstract: 'Exploring the complementary role of traditional herbal remedies alongside conventional treatments for hypertension and diabetes in Ugandan communities. The paper proposes a framework for safe integration.',
      keywords: ['Public Health', 'Non-Communicable Diseases'],
      volume: 45,
      issue: 2,
      publishedAt: new Date('2023-08-10').toISOString(),
      isOpenAccess: true,
    },
    {
      id: '4',
      title: 'Maternal Mortality Trends in Eastern Uganda: 2015-2022',
      authors: ['Dr. Florence Akello', 'Dr. David Otim'],
      abstract: 'An analysis of maternal mortality ratios in Eastern Uganda over an 8-year period, identifying primary causes of death and evaluating the impact of recent health system interventions.',
      keywords: ['Maternal Health', 'Public Health', 'Obstetrics'],
      volume: 44,
      issue: 4,
      publishedAt: new Date('2022-12-05').toISOString(),
      isOpenAccess: false,
    }
  ];

  useEffect(() => {
    const fetchArticles = async () => {
      if (!volumeId || !issueId) return;
      
      setLoading(true);
      try {
        const q = query(
          collection(db, 'articles'),
          where('volume', '==', parseInt(volumeId)),
          where('issue', '==', parseInt(issueId))
        );
        const querySnapshot = await getDocs(q);
        
        let fetchedArticles: Article[] = [];
        if (!querySnapshot.empty) {
          fetchedArticles = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Article[];
        } else {
          // Fall back to matching dummy articles
          fetchedArticles = dummyArticles.filter(
            a => a.volume === parseInt(volumeId) && a.issue === parseInt(issueId)
          );
        }
        
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching issue articles, falling back to dummy data", error);
        setArticles(dummyArticles.filter(
          a => a.volume === parseInt(volumeId) && a.issue === parseInt(issueId)
        ));
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [volumeId, issueId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 min-h-[50vh] items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  const isPublished = articles.length > 0;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/archive" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Archive
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-sm py-1 border-blue-200">
              Volume {volumeId}
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-sm py-1 border-blue-200">
              Issue {issueId}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Issue Articles
          </h1>
        </div>

        {!isPublished ? (
          <Card className="text-center py-16 border-slate-200 border-dashed">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-slate-700">Coming Soon</CardTitle>
              <CardDescription className="text-lg mt-2 font-medium">
                This issue has not been published yet. Check back later for updates.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Link to="/archive" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
                Return to Archive
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <Card key={article.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={article.isOpenAccess ? "default" : "secondary"} className={article.isOpenAccess ? "bg-green-600" : ""}>
                      {article.isOpenAccess ? (
                        <span className="flex items-center"><Unlock className="w-3 h-3 mr-1" /> Open Access</span>
                      ) : (
                        <span className="flex items-center"><Lock className="w-3 h-3 mr-1" /> Subscription Required</span>
                      )}
                    </Badge>
                    <span className="text-sm text-slate-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(article.publishedAt), 'MMM yyyy')}
                    </span>
                  </div>
                  <CardTitle className="text-xl">
                    <Link to={`/articles/${article.id}`} className="text-blue-900 hover:text-blue-700 hover:underline">
                      {article.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    {article.authors?.join(', ')}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {article.abstract}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords?.slice(0, 4).map(keyword => (
                      <Badge key={keyword} variant="outline" className="bg-slate-50">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-between items-center py-3">
                  <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
                    <span>Vol. {article.volume}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>Issue {article.issue}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/articles/${article.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      View Details
                    </Link>
                    <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-50">
                      <FileText className="w-4 h-4 mr-2" /> PDF
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
