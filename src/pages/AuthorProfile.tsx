import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Building, GraduationCap, ArrowLeft, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function AuthorProfile() {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';
  
  const [authorProfile, setAuthorProfile] = useState<any | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useAuth();

  const dummyProfiles: Record<string, any> = {
    'Dr. Jane Namukasa': { affiliation: 'Makerere University, College of Health Sciences', specialties: ['Epidemiology', 'Maternal Health'], isVerifiedReviewer: true, completedReviews: 14 },
    'Dr. Peter Okello': { affiliation: 'Uganda Ministry of Health', specialties: ['Public Health', 'Infectious Diseases'], isVerifiedReviewer: false },
    'Dr. Sarah Kizza': { affiliation: 'Mulago National Referral Hospital', specialties: ['Pediatrics', 'HIV/AIDS'], isVerifiedReviewer: true, completedReviews: 8 },
    'Prof. Emmanuel Mukiibi': { affiliation: 'Makerere University', specialties: ['Infectious Diseases', 'Virology'] },
    'Dr. Moses Byaruhanga': { affiliation: 'Mbarara University of Science and Technology', specialties: ['Traditional Medicine', 'Public Health'] },
    'Dr. Florence Akello': { affiliation: 'Mbale Regional Referral Hospital', specialties: ['Obstetrics', 'Gynecology'] },
    'Dr. David Otim': { affiliation: 'Gulu University', specialties: ['Public Health', 'Health Systems'] },
  };

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

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!decodedName) return;
      
      setLoading(true);
      
      // 1. Try to find the user profile in the 'users' collection
      try {
        if (isDemoMode) {
          if (dummyProfiles[decodedName]) {
            setAuthorProfile(dummyProfiles[decodedName]);
          }
        } else {
          const usersQuery = query(
            collection(db, 'users'),
            where('displayName', '==', decodedName)
          );
          const usersSnap = await getDocs(usersQuery);
          
          if (!usersSnap.empty) {
            setAuthorProfile(usersSnap.docs[0].data());
          } else {
            // Dummy profile fallback
            if (dummyProfiles[decodedName]) {
              setAuthorProfile(dummyProfiles[decodedName]);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          // Silent fallback
        } else {
          console.error("Error fetching user profile:", error);
        }
        // Fallback to dummy profile
        if (dummyProfiles[decodedName]) {
          setAuthorProfile(dummyProfiles[decodedName]);
        }
      }

      // 2. Find all articles by this author
      try {
        let fetchedArticles: any[] = [];

        if (isDemoMode) {
          fetchedArticles = dummyArticles.filter(a => a.authors.includes(decodedName));
        } else {
          const articlesQuery = query(
            collection(db, 'articles'),
            where('authors', 'array-contains', decodedName)
          );
          const articlesSnap = await getDocs(articlesQuery);
          
          fetchedArticles = articlesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Fallback to dummy data if no articles found in DB (for demo purposes)
          if (fetchedArticles.length === 0) {
            fetchedArticles = dummyArticles.filter(a => a.authors.includes(decodedName));
          }
        }
        
        // Sort articles by publication date (newest first)
        fetchedArticles.sort((a: any, b: any) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
        
        setArticles(fetchedArticles);
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          // Silent fallback
        } else {
          console.error("Error fetching author articles:", error);
        }
        setArticles(dummyArticles.filter(a => a.authors.includes(decodedName)));
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
