import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, Users, Globe, Search } from 'lucide-react';

export default function Home() {
  // Dummy data for featured articles
  const featuredArticles = [
    {
      id: '1',
      title: 'Prevalence and Risk Factors of Malaria in Pregnant Women in Rural Uganda',
      authors: ['Dr. Jane Namukasa', 'Dr. Peter Okello'],
      abstract: 'This study investigates the current prevalence rates and associated risk factors for malaria infection among pregnant women attending antenatal care in rural health centers across Uganda...',
      tags: ['Malaria', 'Maternal Health', 'Epidemiology'],
      date: 'Oct 15, 2023',
    },
    {
      id: '2',
      title: 'Outcomes of Antiretroviral Therapy in Pediatric HIV Patients: A 5-Year Retrospective Cohort',
      authors: ['Dr. Sarah Kizza', 'Prof. Emmanuel Mukiibi'],
      abstract: 'A comprehensive review of treatment outcomes, adherence rates, and viral load suppression among pediatric patients receiving ART at Mulago National Referral Hospital...',
      tags: ['HIV/AIDS', 'Pediatrics', 'Infectious Diseases'],
      date: 'Nov 02, 2023',
    },
    {
      id: '3',
      title: 'Integration of Traditional Medicine with Modern Healthcare in Managing Non-Communicable Diseases',
      authors: ['Dr. Moses Byaruhanga'],
      abstract: 'Exploring the complementary role of traditional herbal remedies alongside conventional treatments for hypertension and diabetes in Ugandan communities...',
      tags: ['Public Health', 'Non-Communicable Diseases'],
      date: 'Dec 10, 2023',
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/medical/1920/1080')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-3xl">
              <Badge className="bg-red-600 hover:bg-red-700 text-white mb-6 px-3 py-1 text-sm">
                Volume 45, Issue 3 Now Available
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Advancing Medical Research & Practice in Uganda
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl leading-relaxed">
                The official publication of the Uganda Medical Association, dedicated to disseminating high-quality, peer-reviewed research to improve healthcare outcomes across the region.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/articles" className={buttonVariants({ size: "lg", className: "bg-white text-blue-900 hover:bg-slate-100 font-semibold" })}>
                    Read Latest Articles
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/submit" className={buttonVariants({ size: "lg", variant: "outline", className: "text-white border-white hover:bg-white/10 font-semibold" })}>
                    Submit Manuscript
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-end">
              <div className="relative group">
                <div className="absolute -inset-1 bg-blue-400 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                <img 
                  src="https://picsum.photos/seed/medical-journal/400/550" 
                  alt="Latest Journal Cover" 
                  className="relative rounded-lg shadow-2xl border border-blue-800/50 w-[350px] object-cover transform transition duration-500 hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md z-20">
                  LATEST ISSUE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Features Section */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Open Access</h3>
              <p className="text-slate-600">All articles are freely available to researchers and practitioners globally.</p>
            </div>
            <div className="p-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Rigorous Peer Review</h3>
              <p className="text-slate-600">Double-blind peer review process ensuring the highest scientific quality.</p>
            </div>
            <div className="p-6">
              <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Global Indexing</h3>
              <p className="text-slate-600">Indexed in major medical databases including PubMed and African Journals Online.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Articles</h2>
              <p className="text-slate-600">Highlights from our recent publications.</p>
            </div>
            <Link to="/articles" className={buttonVariants({ variant: "ghost", className: "text-blue-700 hover:text-blue-800 hidden sm:flex" })}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredArticles.map((article) => (
              <Card key={article.id} className="flex flex-col h-full hover:shadow-lg transition-shadow border-slate-200">
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    <Link to={`/articles/${article.id}`} className="hover:text-blue-700 transition-colors">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-slate-500 mt-2">
                    {article.authors.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-slate-600 text-sm line-clamp-4">
                    {article.abstract}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <span>{article.date}</span>
                  <Link to={`/articles/${article.id}`} className="text-blue-700 font-medium hover:underline flex items-center">
                    Read <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/articles" className={buttonVariants({ variant: "outline", className: "w-full" })}>View All Articles</Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Call for Papers</h2>
          <p className="text-lg text-slate-600 mb-8">
            UMAJ is currently accepting submissions for our upcoming special issue on "Infectious Disease Management in Resource-Limited Settings." We welcome original research, reviews, and case reports.
          </p>
          <Link to="/submit" className={buttonVariants({ size: "lg", className: "bg-blue-700 hover:bg-blue-800 text-white" })}>
            Start Your Submission
          </Link>
        </div>
      </section>
    </div>
  );
}
