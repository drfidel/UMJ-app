import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Calendar, FilterX } from 'lucide-react';
import SEO from '@/components/SEO';

// Mock data for archives
const archiveData = [
  {
    year: 2023,
    volumes: [
      {
        volume: 45,
        issues: [
          { issue: 3, title: 'Special Issue on Infectious Diseases', date: 'October 2023', articleCount: 12 },
          { issue: 2, title: 'Advancements in Maternal Health', date: 'June 2023', articleCount: 10 },
          { issue: 1, title: 'Public Health Policy and Practice', date: 'February 2023', articleCount: 15 },
        ]
      }
    ]
  },
  {
    year: 2022,
    volumes: [
      {
        volume: 44,
        issues: [
          { issue: 4, title: 'Non-Communicable Diseases in East Africa', date: 'December 2022', articleCount: 14 },
          { issue: 3, title: 'Pediatric Care Innovations', date: 'September 2022', articleCount: 11 },
          { issue: 2, title: 'Surgical Outcomes and Techniques', date: 'May 2022', articleCount: 9 },
          { issue: 1, title: 'Mental Health Awareness', date: 'January 2022', articleCount: 13 },
        ]
      }
    ]
  },
  {
    year: 2021,
    volumes: [
      {
        volume: 43,
        issues: [
          { issue: 4, title: 'COVID-19 Response and Research', date: 'November 2021', articleCount: 20 },
          { issue: 3, title: 'Tropical Medicine Updates', date: 'August 2021', articleCount: 12 },
          { issue: 2, title: 'Healthcare Infrastructure', date: 'April 2021', articleCount: 10 },
          { issue: 1, title: 'Medical Education in Uganda', date: 'February 2021', articleCount: 8 },
        ]
      }
    ]
  }
];

export default function Archive() {
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterIssue, setFilterIssue] = useState<string>('All');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  const filteredArchiveData = useMemo(() => {
    return archiveData.map(yearData => {
      if (filterYear !== 'All' && yearData.year.toString() !== filterYear) {
        return null;
      }
      
      const filteredVolumes = yearData.volumes.map(vol => {
        const filteredIssues = vol.issues.filter(issue => {
          if (filterIssue !== 'All' && issue.issue.toString() !== filterIssue) {
            return false;
          }
          
          const issueDate = new Date(issue.date);
          
          if (filterDateFrom) {
            const fromDate = new Date(filterDateFrom);
            if (!isNaN(fromDate.getTime()) && issueDate < fromDate) {
              return false;
            }
          }
          
          if (filterDateTo) {
            const toDate = new Date(filterDateTo);
            if (!isNaN(toDate.getTime())) {
              const toDateEnd = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0, 23, 59, 59);
              if (issueDate > toDateEnd) {
                return false;
              }
            }
          }
          
          return true;
        });
        
        if (filteredIssues.length === 0) return null;
        return { ...vol, issues: filteredIssues };
      }).filter(Boolean) as typeof archiveData[0]['volumes'];
      
      if (filteredVolumes.length === 0) return null;
      return { ...yearData, volumes: filteredVolumes };
    }).filter(Boolean) as typeof archiveData;
  }, [filterYear, filterIssue, filterDateFrom, filterDateTo]);

  const resetFilters = () => {
    setFilterYear('All');
    setFilterIssue('All');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <SEO 
        title="Journal Archive" 
        description="Browse past volumes and issues of the Uganda Medical Association Journal."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Journal Archive</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse past volumes and issues of the Uganda Medical Association Journal.
          </p>
        </div>

        <Card className="mb-8 border-slate-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label htmlFor="year-filter" className="text-sm font-medium">Year</Label>
                <select 
                  id="year-filter"
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <option value="All">All Years</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-filter" className="text-sm font-medium">Issue Summary</Label>
                <select 
                  id="issue-filter"
                  value={filterIssue} 
                  onChange={(e) => setFilterIssue(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <option value="All">All Issues</option>
                  <option value="1">Issue 1</option>
                  <option value="2">Issue 2</option>
                  <option value="3">Issue 3</option>
                  <option value="4">Issue 4</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-sm font-medium">From Date (Month)</Label>
                <Input 
                  id="date-from"
                  type="month" 
                  value={filterDateFrom} 
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-sm font-medium">To Date (Month)</Label>
                <Input 
                  id="date-to"
                  type="month" 
                  value={filterDateTo} 
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            
            {(filterYear !== 'All' || filterIssue !== 'All' || filterDateFrom || filterDateTo) && (
              <div className="mt-6 flex justify-end">
                <Button variant="ghost" className="text-slate-500 hover:text-slate-900 font-medium" onClick={resetFilters}>
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredArchiveData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-xl font-medium text-slate-900">No issues found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
            <Button variant="outline" className="mt-6" onClick={resetFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredArchiveData.map((yearData) => (
            <Card key={yearData.year} className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-100/50 border-b border-slate-200 pb-4">
                <CardTitle className="text-2xl flex items-center text-blue-900">
                  <Calendar className="mr-2 h-6 w-6" />
                  {yearData.year}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion className="w-full">
                  {yearData.volumes.map((vol) => (
                    <AccordionItem key={vol.volume} value={`vol-${vol.volume}`} className="border-b-0">
                      <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 text-lg font-semibold text-slate-800">
                        Volume {vol.volume}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2">
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {vol.issues.map((issue) => (
                            <Link 
                              key={`${vol.volume}-${issue.issue}`} 
                              to={`/issue/${vol.volume}/${issue.issue}`}
                              className="block group"
                            >
                              <div className="relative border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-xl transition-all shadow-sm bg-slate-900 h-full flex flex-col overflow-hidden aspect-[3/4]">
                                <img 
                                  src={`https://picsum.photos/seed/${encodeURIComponent(issue.title + vol.volume)}/600/800?blur=1`} 
                                  alt={`Cover for ${issue.title}`}
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent p-5 flex flex-col justify-end">
                                  <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-0 drop-shadow-sm">
                                      Issue {issue.issue}
                                    </Badge>
                                    <span className="text-xs text-white/90 font-medium drop-shadow-md">{issue.date}</span>
                                  </div>
                                  
                                  <h4 className="font-bold text-white text-lg leading-tight mb-4 line-clamp-3 drop-shadow-md group-hover:text-blue-100 transition-colors">
                                    {issue.title}
                                  </h4>
                                  
                                  <div className="flex justify-between items-end text-xs text-slate-300 mt-auto">
                                    <div className="flex flex-col">
                                      <span className="text-white font-bold tracking-[0.2em] text-[11px] uppercase opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">UMAJ</span>
                                      <span className="font-medium drop-shadow-md">Vol {vol.volume}</span>
                                    </div>
                                    <div className="flex items-center bg-black/40 px-2.5 py-1.5 rounded-md backdrop-blur-md border border-white/10">
                                      <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-300" />
                                      <span className="text-white/90 font-medium">{issue.articleCount} Articles</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
