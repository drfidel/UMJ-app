import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Calendar } from 'lucide-react';

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
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Journal Archive</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse past volumes and issues of the Uganda Medical Association Journal.
          </p>
        </div>

        <div className="space-y-8">
          {archiveData.map((yearData) => (
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
                        <div className="grid gap-4 sm:grid-cols-2">
                          {vol.issues.map((issue) => (
                            <Link 
                              key={`${vol.volume}-${issue.issue}`} 
                              to={`/articles?volume=${vol.volume}&issue=${issue.issue}`}
                              className="block group"
                            >
                              <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white h-full flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Issue {issue.issue}
                                  </Badge>
                                  <span className="text-xs text-slate-500 font-medium">{issue.date}</span>
                                </div>
                                <h4 className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors mb-3 flex-grow">
                                  {issue.title}
                                </h4>
                                <div className="flex items-center text-xs text-slate-500 mt-auto">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {issue.articleCount} Articles
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
      </div>
    </div>
  );
}
