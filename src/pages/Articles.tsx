import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Lock, Unlock } from 'lucide-react';
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

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');

  // Dummy data fallback
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
      try {
        const q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const fetchedArticles = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Article[];
          setArticles(fetchedArticles);
        } else {
          // Use dummy data if database is empty
          setArticles(dummyArticles);
        }
      } catch (error) {
        console.error("Error fetching articles, falling back to dummy data", error);
        setArticles(dummyArticles);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          article.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          article.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const articleYear = new Date(article.publishedAt).getFullYear().toString();
    const matchesYear = filterYear === 'all' || articleYear === filterYear;

    return matchesSearch && matchesYear;
  });

  const years = ['all', ...Array.from(new Set(articles.map(a => new Date(a.publishedAt).getFullYear().toString())))].sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Browse Articles</h1>
        <p className="text-lg text-slate-600">Explore the latest peer-reviewed medical research from Uganda and beyond.</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input 
            type="text" 
            placeholder="Search by title, author, or keyword..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="text-slate-400 h-5 w-5" />
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year === 'all' ? 'All Years' : year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="space-y-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-xl text-blue-900 hover:text-blue-700 transition-colors mb-2 flex items-start justify-between gap-4">
                      <Link to={`/articles/${article.id}`} className="flex-grow">
                        {article.title}
                      </Link>
                      {article.isOpenAccess ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap flex-shrink-0">
                          <Unlock className="w-3 h-3 mr-1" /> Open Access
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap flex-shrink-0">
                          <Lock className="w-3 h-3 mr-1" /> Subscription
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-700 font-medium text-base">
                      {article.authors.join(', ')}
                    </CardDescription>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-sm text-slate-500 whitespace-nowrap">
                    <span>Vol {article.volume}, Issue {article.issue}</span>
                    <span>{format(new Date(article.publishedAt), 'MMM yyyy')}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 line-clamp-3 mb-4">
                  {article.abstract}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map(keyword => (
                    <Badge key={keyword} variant="outline" className="text-slate-600 border-slate-300">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 py-3 flex justify-between items-center sm:hidden">
                <span className="text-sm text-slate-500">Vol {article.volume}, {format(new Date(article.publishedAt), 'yyyy')}</span>
                <Link to={`/articles/${article.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-blue-700" })}>Read <FileText className="ml-2 h-4 w-4" /></Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No articles found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => { setSearchTerm(''); setFilterYear('all'); }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
