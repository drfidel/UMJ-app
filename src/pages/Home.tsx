import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight, Calendar, MapPin, Lock, Unlock, BookOpen, FileText, Users, Globe } from 'lucide-react';
import SEO from '@/components/SEO';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { CURATED_ARTICLES } from '@/data/journalData';
import { format } from 'date-fns';
import heroCoverImg from '@/assets/images/hero_journal_cover_1794934077113.jpg';
import researchBannerImg from '@/assets/images/hero_research_banner_1794934079008.jpg';

const FEATURED_SPECIALTIES = [
  'Infectious Diseases',
  'Pediatrics',
  'Public Health',
  'Obstetrics & Gynecology',
  'Surgery',
  'Tropical Medicine',
  'Cardiology',
  'Internal Medicine',
];

export default function Home() {
  const leadArticle = CURATED_ARTICLES[0];
  const secondaryArticles = CURATED_ARTICLES.slice(1, 4);
  const currentIssueToc = CURATED_ARTICLES.slice(0, 3);

  const { isDemoMode } = useAuth();
  const [conferences, setConferences] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fallbackEvents = [
      {
        id: '1',
        title: 'Annual Uganda Medical Association Scientific Conference',
        date: 'August 12 - 14, 2026',
        location: 'Kampala Serena Hotel, Kampala',
        type: 'Conference',
      },
      {
        id: '2',
        title: 'East African Health Research Symposium',
        date: 'September 5 - 7, 2026',
        location: 'Imperial Resort Beach Hotel, Entebbe',
        type: 'Symposium',
      },
      {
        id: '3',
        title: 'National Summit on Maternal & Child Health',
        date: 'October 20 - 21, 2026',
        location: 'Mbarara University of Science and Technology',
        type: 'Summit',
      },
    ];

    const fetchNews = async () => {
      setLoadingNews(true);
      try {
        if (isDemoMode) {
          if (isMounted) {
            setConferences(fallbackEvents);
            setLoadingNews(false);
          }
          return;
        }

        const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(3));
        const eventsSnap = await getDocs(eventsQuery);

        if (isMounted) {
          const eventsData = eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setConferences(eventsData.length > 0 ? eventsData : fallbackEvents);
          setLoadingNews(false);
        }
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching events', error);
        }
        if (isMounted) {
          setConferences(fallbackEvents);
          setLoadingNews(false);
        }
      }
    };
    fetchNews();
    return () => {
      isMounted = false;
    };
  }, [isDemoMode]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SEO
        title="Home"
        description="Uganda Medical Journal (UMJ) is the official publication of the Uganda Medical Association, dedicated to disseminating high-quality, peer-reviewed research."
      />

      {/* Institutional Masthead Utility Strip */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-foreground">Official Publication of the Uganda Medical Association</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">ISSN 2410-1234</span>
            <span aria-hidden="true">·</span>
            <span>Double-Blind Peer Reviewed</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/issue/45/3" className="font-medium text-red-700 dark:text-red-400 hover:underline">
              Current Issue: Vol 45, Issue 3
            </Link>
            <span aria-hidden="true" className="text-border">|</span>
            <Link to="/author-guidelines" className="hover:text-foreground transition-colors">
              Author Guidelines
            </Link>
          </div>
        </div>
      </div>

      {/* Tier 1: Lead Investigation & Print Issue Cover Split */}
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Left: Lead Clinical Investigation */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-muted-foreground mb-4">
                  <span className="text-red-700 dark:text-red-400 font-semibold uppercase tracking-wider">
                    Lead Investigation
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{leadArticle.specialty}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Vol {leadArticle.volume}, Issue {leadArticle.issue}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{leadArticle.readTime}</span>
                </div>

                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.15] text-balance mb-5">
                  <Link
                    to={`/articles/${leadArticle.id}`}
                    className="hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
                  >
                    {leadArticle.title}
                  </Link>
                </h1>

                <p className="text-base text-foreground/85 font-medium mb-6">
                  {leadArticle.authors.map((author, idx) => (
                    <span key={author}>
                      <Link
                        to={`/author/${encodeURIComponent(author)}`}
                        className="hover:underline underline-offset-4"
                      >
                        {author}
                      </Link>
                      {idx < leadArticle.authors.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>

                {/* Clinical Bottom Line */}
                <div className="border-t border-b border-border py-5 mb-8 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Clinical Summary
                  </p>
                  <p className="font-serif text-base sm:text-lg text-foreground/90 leading-relaxed max-w-2xl">
                    {leadArticle.keyPoints?.findings}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/articles/${leadArticle.id}`}
                  className={buttonVariants({
                    size: 'lg',
                    className: 'bg-primary text-primary-foreground hover:opacity-90 font-medium',
                  })}
                >
                  Read Full Investigation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/articles"
                  className={buttonVariants({
                    size: 'lg',
                    variant: 'outline',
                    className: 'font-medium',
                  })}
                >
                  Browse All Research
                </Link>
              </div>
            </div>

            {/* Right: Current Print Cover & Issue Table of Contents */}
            <div className="lg:col-span-5 flex flex-col bg-background border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-12 flex-1">
                <div className="sm:col-span-5 relative bg-slate-900 min-h-[220px] sm:min-h-full overflow-hidden">
                  <img
                    src={heroCoverImg}
                    alt="Uganda Medical Journal Volume 45 Issue 3 Cover"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-4 flex flex-col justify-end">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-200">
                      Vol 45 · Issue 3
                    </p>
                    <p className="font-editorial text-sm font-bold text-white leading-snug mt-0.5">
                      Infectious Diseases & Maternal Care
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-7 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        In This Issue
                      </span>
                      <span className="text-xs font-mono text-muted-foreground tabular-nums">Oct 2023</span>
                    </div>

                    <ul className="divide-y divide-border">
                      {currentIssueToc.map((item) => (
                        <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                          <Link
                            to={`/articles/${item.id}`}
                            className="group block"
                          >
                            <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                              {item.articleType} · {item.specialty}
                            </p>
                            <p className="text-sm font-semibold text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 leading-snug line-clamp-2 transition-colors">
                              {item.title}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border">
                    <Link
                      to="/issue/45/3"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center"
                    >
                      View Complete Issue Table of Contents
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Browse Bar */}
      <section className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap shrink-0">
              Specialties:
            </span>
            <div className="flex items-center gap-2">
              {FEATURED_SPECIALTIES.map((specialty) => (
                <Link
                  key={specialty}
                  to={`/articles?specialty=${encodeURIComponent(specialty)}`}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0"
                >
                  {specialty}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tier 2: Recent Peer-Reviewed Articles */}
      <section className="py-14 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-foreground">
                Recent Publications
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Peer-reviewed clinical investigations, cohort studies, and health systems analyses.
              </p>
            </div>
            <Link
              to="/articles"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center whitespace-nowrap shrink-0"
            >
              All Published Articles
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {secondaryArticles.map((article) => (
              <article
                key={article.id}
                className="flex flex-col justify-between bg-card border border-border rounded-lg p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground/80">{article.articleType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.specialty}</span>
                    <span aria-hidden="true">·</span>
                    {article.isOpenAccess ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                        <Unlock className="h-3 w-3" /> Open Access
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                        <Lock className="h-3 w-3" /> Subscription
                      </span>
                    )}
                  </div>

                  <h3 className="font-editorial text-xl font-bold text-foreground leading-snug mb-2.5">
                    <Link
                      to={`/articles/${article.id}`}
                      className="hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs font-medium text-muted-foreground mb-4">
                    {article.authors.join(', ')}
                  </p>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-6">
                    {article.abstract.replace(/^(Background|Methods|Results|Conclusion):\s*/gm, '')}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    Vol {article.volume}({article.issue}) · {format(new Date(article.publishedAt), 'MMM yyyy')}
                  </span>
                  <Link
                    to={`/articles/${article.id}`}
                    className="font-semibold text-primary hover:underline inline-flex items-center"
                  >
                    Read <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Tier 3: Editorial Standards & Quantitative Journal Metrics */}
      <section className="py-14 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mb-10">
            <div className="lg:col-span-6 rounded-lg overflow-hidden border border-border bg-muted min-h-[260px]">
              <img
                src={researchBannerImg}
                alt="Clinician examining microscopy slides alongside medical journals in East Africa"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Rigorous Regional Scholarship
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-foreground mb-4 text-balance">
                Trusted Clinical Evidence for East African Practice
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Every manuscript submitted to the Uganda Medical Journal undergoes double-blind peer review by specialist clinicians and epidemiologists, ensuring methodological rigor and immediate relevance to clinical practice and national health policy.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" /> Open Access
                  </div>
                  <p className="text-xs text-muted-foreground">CC BY 4.0 global dissemination</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Users className="h-4 w-4 text-primary" /> Double-Blind
                  </div>
                  <p className="text-xs text-muted-foreground">Independent specialist review</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Globe className="h-4 w-4 text-primary" /> Indexed
                  </div>
                  <p className="text-xs text-muted-foreground">PubMed, AJOL, DOAJ, Scopus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column KPI Proof Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-border rounded-lg bg-background divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">2024 Impact Factor</p>
              <p className="font-mono tabular-nums text-3xl font-semibold text-foreground mt-1">1.45</p>
              <p className="text-xs text-muted-foreground mt-1">Clarivate JCR / AJOL</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First Decision</p>
              <p className="font-mono tabular-nums text-3xl font-semibold text-foreground mt-1">42 days</p>
              <p className="text-xs text-muted-foreground mt-1">Median editorial turnaround</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Acceptance Rate</p>
              <p className="font-mono tabular-nums text-3xl font-semibold text-foreground mt-1">18%</p>
              <p className="text-xs text-muted-foreground mt-1">Selective peer review</p>
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Published Archive</p>
                <p className="font-mono tabular-nums text-3xl font-semibold text-foreground mt-1">1,240+</p>
              </div>
              <Link to="/metrics" className="text-xs font-semibold text-primary hover:underline mt-2 inline-flex items-center">
                Explore Full Metrics <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tier 4: Conferences & Author Submission Portal */}
      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-foreground">
                Scientific Conferences & Symposia
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upcoming medical congresses, CME workshops, and regional clinical meetings.
              </p>
            </div>
            <Link
              to="/events"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center whitespace-nowrap shrink-0"
            >
              View All Events <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          {loadingNews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse space-y-3">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-5 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
              {conferences.map((conf) => (
                <Link
                  key={conf.id}
                  to={`/events/${conf.id}`}
                  className="group bg-card border border-border rounded-lg p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                      {conf.type}
                    </p>
                    <h3 className="font-editorial text-lg font-bold text-foreground group-hover:text-blue-800 dark:group-hover:text-blue-400 transition-colors leading-snug mb-4">
                      {conf.title}
                    </h3>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{conf.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{conf.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Call for Papers & Manuscript Submission Banner */}
          <div className="bg-card border border-border rounded-lg p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2">
                Call for Papers · Special Issue
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Infectious Disease Management in Resource-Limited Settings
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                We invite original investigations, systematic reviews, clinical case reports, and health policy analyses. Download formatted Word or LaTeX templates and submit directly through our editorial portal.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0">
              <Link
                to="/author-guidelines"
                className={buttonVariants({ variant: 'outline', size: 'lg', className: 'font-medium' })}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Author Guidelines
              </Link>
              <Link
                to="/submit"
                className={buttonVariants({ size: 'lg', className: 'bg-primary text-primary-foreground hover:opacity-90 font-medium' })}
              >
                Submit Manuscript
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
