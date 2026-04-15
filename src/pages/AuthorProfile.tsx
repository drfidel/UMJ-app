import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Building, GraduationCap, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function AuthorProfile() {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';
  
  const [authorProfile, setAuthorProfile] = useState<any | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!decodedName) return;
      
      setLoading(true);
      
      // 1. Try to find the user profile in the 'users' collection
      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('displayName', '==', decodedName)
        );
        const usersSnap = await getDocs(usersQuery);
        
        if (!usersSnap.empty) {
          setAuthorProfile(usersSnap.docs[0].data());
        } else {
          // Dummy profile fallback
          const dummyProfiles: Record<string, any> = {
            'Dr. Jane Namukasa': { affiliation: 'Makerere University, College of Health Sciences', specialties: ['Epidemiology', 'Maternal Health'] },
            'Dr. Peter Okello': { affiliation: 'Uganda Ministry of Health', specialties: ['Public Health', 'Infectious Diseases'] },
            'Dr. Sarah Kizza': { affiliation: 'Mulago National Referral Hospital', specialties: ['Pediatrics', 'HIV/AIDS'] },
            'Prof. Emmanuel Mukiibi': { affiliation: 'Makerere University', specialties: ['Infectious Diseases', 'Virology'] },
            'Dr. Moses Byaruhanga': { affiliation: 'Mbarara University of Science and Technology', specialties: ['Traditional Medicine', 'Public Health'] },
            'Dr. Florence Akello': { affiliation: 'Mbale Regional Referral Hospital', specialties: ['Obstetrics', 'Gynecology'] },
            'Dr. David Otim': { affiliation: 'Gulu University', specialties: ['Public Health', 'Health Systems'] },
          };
          if (dummyProfiles[decodedName]) {
            setAuthorProfile(dummyProfiles[decodedName]);
          }
        }
      } catch (error) {
        // Fallback to dummy profile if permission denied
        const dummyProfiles: Record<string, any> = {
          'Dr. Jane Namukasa': { affiliation: 'Makerere University, College of Health Sciences', specialties: ['Epidemiology', 'Maternal Health'] },
          'Dr. Peter Okello': { affiliation: 'Uganda Ministry of Health', specialties: ['Public Health', 'Infectious Diseases'] },
          'Dr. Sarah Kizza': { affiliation: 'Mulago National Referral Hospital', specialties: ['Pediatrics', 'HIV/AIDS'] },
          'Prof. Emmanuel Mukiibi': { affiliation: 'Makerere University', specialties: ['Infectious Diseases', 'Virology'] },
          'Dr. Moses Byaruhanga': { affiliation: 'Mbarara University of Science and Technology', specialties: ['Traditional Medicine', 'Public Health'] },
          'Dr. Florence Akello': { affiliation: 'Mbale Regional Referral Hospital', specialties: ['Obstetrics', 'Gynecology'] },
          'Dr. David Otim': { affiliation: 'Gulu University', specialties: ['Public Health', 'Health Systems'] },
        };
        if (dummyProfiles[decodedName]) {
          setAuthorProfile(dummyProfiles[decodedName]);
        }
      }

      // 2. Find all articles by this author
      try {
        const articlesQuery = query(
          collection(db, 'articles'),
          where('authors', 'array-contains', decodedName)
        );
        const articlesSnap = await getDocs(articlesQuery);
        
        let fetchedArticles = articlesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fallback to dummy data if no articles found in DB (for demo purposes)
        if (fetchedArticles.length === 0) {
          const dummyArticles = [
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
          fetchedArticles = dummyArticles.filter(a => a.authors.includes(decodedName));
        }
        
        // Sort articles by publication date (newest first)
        fetchedArticles.sort((a: any, b: any) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching author articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [decodedName]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/articles" className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 mb-8 font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Author Profile Sidebar */}
          <div className="md:col-span-1">
            <Card className="border-slate-200 shadow-sm sticky top-8">
              <CardContent className="pt-8 text-center">
                <div className="mx-auto w-24 h-24 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-4">
                  <User className="h-12 w-12" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{decodedName}</h1>
                
                {authorProfile?.affiliation && (
                  <div className="flex items-center justify-center text-slate-600 mb-2">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm">{authorProfile.affiliation}</span>
                  </div>
                )}
                
                {authorProfile?.specialties && authorProfile.specialties.length > 0 && (
                  <div className="mt-6 text-left">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Specialties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {authorProfile.specialties.map((specialty: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-slate-100 text-slate-700">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-around text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-700">{articles.length}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Articles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Author's Articles List */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <BookOpen className="h-6 w-6 mr-3 text-blue-700" />
              Published Articles
            </h2>
            
            {articles.length > 0 ? (
              articles.map((article) => (
                <Card key={article.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium rounded-sm">
                        Research Article
                      </Badge>
                      <span>•</span>
                      <span>Published: {format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                      <Link to={`/article/${article.id}`} className="hover:text-blue-700 transition-colors">
                        {article.title}
                      </Link>
                    </h3>
                    
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {article.abstract}
                    </p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="text-sm text-slate-500">
                        Vol {article.volume}, Issue {article.issue}
                      </div>
                      <Link to={`/article/${article.id}`} className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center">
                        Read Article
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-slate-200 shadow-sm bg-slate-50">
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No Articles Found</h3>
                  <p className="text-slate-500">
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
