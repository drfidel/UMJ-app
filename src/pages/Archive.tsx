import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, FilterX, ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import heroCoverImg from '@/assets/images/hero_journal_cover_1794934077113.jpg';

const archiveData = [
  {
    year: 2024,
    volumes: [
      {
        volume: 46,
        issues: [
          { issue: 2, title: 'Neglected Tropical Diseases & Hematology', date: 'April 2024', articleCount: 14, palette: 'bg-[#0F2D52]' },
          { issue: 1, title: 'Antimicrobial Stewardship & Screening', date: 'February 2024', articleCount: 12, palette: 'bg-[#1E3A5F]' },
        ],
      },
    ],
  },
  {
    year: 2023,
    volumes: [
      {
        volume: 45,
        issues: [
          { issue: 4, title: 'Perinatal Outcomes & Workforce Health', date: 'December 2023', articleCount: 11, palette: 'bg-[#1E293B]' },
          { issue: 3, title: 'Special Issue on Infectious Diseases', date: 'October 2023', articleCount: 12, palette: 'bg-[#0F2D52]', isFeaturedCover: true },
          { issue: 2, title: 'Advancements in Maternal Health', date: 'June 2023', articleCount: 10, palette: 'bg-[#134E4A]' },
          { issue: 1, title: 'Public Health Policy and Practice', date: 'February 2023', articleCount: 15, palette: 'bg-[#312E81]' },
        ],
      },
    ],
  },
  {
    year: 2022,
    volumes: [
      {
        volume: 44,
        issues: [
          { issue: 4, title: 'Non-Communicable Diseases in East Africa', date: 'December 2022', articleCount: 14, palette: 'bg-[#7F1D1D]' },
          { issue: 3, title: 'Pediatric Care & Immunization', date: 'September 2022', articleCount: 11, palette: 'bg-[#0F2D52]' },
          { issue: 2, title: 'Surgical Outcomes and Techniques', date: 'May 2022', articleCount: 9, palette: 'bg-[#1E293B]' },
          { issue: 1, title: 'Mental Health Awareness', date: 'January 2022', articleCount: 13, palette: 'bg-[#134E4A]' },
        ],
      },
    ],
  },
  {
    year: 2021,
    volumes: [
      {
        volume: 43,
        issues: [
          { issue: 4, title: 'COVID-19 Response and Research', date: 'November 2021', articleCount: 20, palette: 'bg-[#1E293B]' },
          { issue: 3, title: 'Tropical Medicine Updates', date: 'August 2021', articleCount: 12, palette: 'bg-[#0F2D52]' },
          { issue: 2, title: 'Healthcare Infrastructure', date: 'April 2021', articleCount: 10, palette: 'bg-[#1E3A5F]' },
          { issue: 1, title: 'Medical Education in Uganda', date: 'February 2021', articleCount: 8, palette: 'bg-[#312E81]' },
        ],
      },
    ],
  },
];

export default function Archive() {
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterIssue, setFilterIssue] = useState<string>('All');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const filteredArchiveData = useMemo(() => {
    return archiveData
      .map((yearData) => {
        if (filterYear !== 'All' && yearData.year.toString() !== filterYear) {
          return null;
        }

        const filteredVolumes = yearData.volumes
          .map((vol) => {
            const filteredIssues = vol.issues.filter((issue) => {
              if (filterIssue !== 'All' && issue.issue.toString() !== filterIssue) {
                return false;
              }
              const issueDate = new Date(issue.date);
              if (filterDateFrom) {
                const fromDate = new Date(filterDateFrom);
                if (!isNaN(fromDate.getTime()) && issueDate < fromDate) return false;
              }
              if (filterDateTo) {
                const toDate = new Date(filterDateTo);
                if (!isNaN(toDate.getTime())) {
                  const toDateEnd = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0, 23, 59, 59);
                  if (issueDate > toDateEnd) return false;
                }
              }
              return true;
            });
            if (filteredIssues.length === 0) return null;
            return { ...vol, issues: filteredIssues };
          })
          .filter(Boolean) as typeof archiveData[0]['volumes'];

        if (filteredVolumes.length === 0) return null;
        return { ...yearData, volumes: filteredVolumes };
      })
      .filter(Boolean) as typeof archiveData;
  }, [filterYear, filterIssue, filterDateFrom, filterDateTo]);

  const resetFilters = () => {
    setFilterYear('All');
    setFilterIssue('All');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="bg-background min-h-screen py-12">
      <SEO
        title="Journal Archive"
        description="Browse past volumes and issues of the Uganda Medical Journal."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Back Issues & Volumes
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
            Journal Archive
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
            Browse complete tables of contents across published volumes and special thematic issues of the Uganda Medical Journal.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-lg p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="year-filter" className="text-xs font-medium text-muted-foreground">
                Year
              </Label>
              <select
                id="year-filter"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="All">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue-filter" className="text-xs font-medium text-muted-foreground">
                Issue Number
              </Label>
              <select
                id="issue-filter"
                value={filterIssue}
                onChange={(e) => setFilterIssue(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="All">All Issues</option>
                <option value="1">Issue 1</option>
                <option value="2">Issue 2</option>
                <option value="3">Issue 3</option>
                <option value="4">Issue 4</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-from" className="text-xs font-medium text-muted-foreground">
                From Month
              </Label>
              <Input
                id="date-from"
                type="month"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-to" className="text-xs font-medium text-muted-foreground">
                To Month
              </Label>
              <Input
                id="date-to"
                type="month"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          {(filterYear !== 'All' || filterIssue !== 'All' || filterDateFrom || filterDateTo) && (
            <div className="mt-4 pt-3 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                <FilterX className="h-3.5 w-3.5 mr-1.5" /> Clear Filters
              </Button>
            </div>
          )}
        </div>

        {filteredArchiveData.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No issues match your filters</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Try broadening your date range or resetting the volume filters.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredArchiveData.map((yearData) => (
              <section key={yearData.year} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-muted/40 border-b border-border flex items-center justify-between">
                  <h2 className="font-editorial text-2xl font-bold text-foreground font-mono tabular-nums">
                    {yearData.year}
                  </h2>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {yearData.volumes.reduce((sum, v) => sum + v.issues.length, 0)} Issues
                  </span>
                </div>

                <Accordion defaultValue={[`vol-${yearData.volumes[0]?.volume}`]} className="w-full">
                  {yearData.volumes.map((vol) => (
                    <AccordionItem key={vol.volume} value={`vol-${vol.volume}`} className="border-b-0">
                      <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 text-base font-semibold text-foreground">
                        Volume {vol.volume}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2">
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {vol.issues.map((issue) => (
                            <Link
                              key={`${vol.volume}-${issue.issue}`}
                              to={`/issue/${vol.volume}/${issue.issue}`}
                              className="group block"
                            >
                              <div
                                className={`relative rounded-lg border border-border overflow-hidden aspect-[3/4] flex flex-col justify-between p-5 text-white transition-transform duration-200 group-hover:-translate-y-0.5 ${issue.palette}`}
                              >
                                {issue.isFeaturedCover && (
                                  <img
                                    src={heroCoverImg}
                                    alt={`Cover for ${issue.title}`}
                                    referrerPolicy="no-referrer"
                                    className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
                                  />
                                )}

                                {/* Top Editorial Masthead */}
                                <div className="relative z-10 border-b border-white/25 pb-3">
                                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/80">
                                    Uganda Medical Journal
                                  </p>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-xs font-mono font-semibold tabular-nums">
                                      Vol {vol.volume} · No. {issue.issue}
                                    </span>
                                    <span className="text-[11px] text-white/80">{issue.date}</span>
                                  </div>
                                </div>

                                {/* Center Title */}
                                <div className="relative z-10 my-auto py-4">
                                  <h3 className="font-editorial text-lg font-bold leading-snug text-white group-hover:underline underline-offset-4">
                                    {issue.title}
                                  </h3>
                                </div>

                                {/* Bottom Spine Metadata */}
                                <div className="relative z-10 pt-3 border-t border-white/25 flex items-center justify-between text-xs text-white/85">
                                  <span className="font-mono tabular-nums">{issue.articleCount} Articles</span>
                                  <span className="inline-flex items-center font-medium">
                                    Open <ArrowRight className="ml-1 h-3 w-3" />
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
