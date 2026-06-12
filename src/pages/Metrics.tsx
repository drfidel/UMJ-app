import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { Award, Clock, FileText, Globe, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import SEO from '@/components/SEO';

const downloadsData = [
  { year: '2019', downloads: 12000, views: 24000 },
  { year: '2020', downloads: 15500, views: 31000 },
  { year: '2021', downloads: 22000, views: 42000 },
  { year: '2022', downloads: 28000, views: 56000 },
  { year: '2023', downloads: 34500, views: 68000 },
  { year: '2024', downloads: 41000, views: 84000 },
];

const acceptanceData = [
  { category: 'Initial Triage', percentage: 100 },
  { category: 'External Review', percentage: 45 },
  { category: 'Revisions', percentage: 28 },
  { category: 'Final Acceptance', percentage: 18 },
];

const countryData = [
  { name: 'Uganda', value: 45 },
  { name: 'Kenya', value: 15 },
  { name: 'South Africa', value: 12 },
  { name: 'USA', value: 8 },
  { name: 'UK', value: 7 },
  { name: 'Other', value: 13 },
];

export default function Metrics() {
  const stats = [
    { label: 'Impact Factor (2024)', value: '1.45', icon: Award, suffix: '' },
    { label: 'Days to First Decision', value: '42', icon: Clock, suffix: 'days' },
    { label: 'Acceptance Rate', value: '18', icon: CheckCircle2, suffix: '%' },
    { label: 'Total Published Articles', value: '1,240', icon: FileText, suffix: '+' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <SEO 
        title="Journal Metrics" 
        description="View the official metrics, impact factor, acceptance rate, and global reach of the Uganda Medical Journal."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Journal Metrics</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Transparent reporting on the Uganda Medical Journal's speed, reach, and academic impact globally.
          </p>
        </div>

        {/* Top level stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="border-slate-200">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <stat.icon className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">{stat.value}</span>
                  {stat.suffix && <span className="text-xl font-medium text-slate-500 ml-1">{stat.suffix}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Downloads and Views Trend */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xl flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-700" />
                Readership Growth (Views & Downloads)
              </CardTitle>
              <CardDescription>Total article views and full-text downloads over the past 6 years.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={downloadsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="year" stroke="#64748b" tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tickFormatter={(value) => `${value/1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value: number) => new Intl.NumberFormat('en').format(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="views" name="Article Views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="downloads" name="PDF Downloads" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDownloads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Peer Review Flow */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xl flex items-center">
                <Users className="mr-2 h-5 w-5 text-indigo-700" />
                Editorial Funnel & Acceptance
              </CardTitle>
              <CardDescription>Percentage of submissions making it through the peer-review stages.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acceptanceData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} stroke="#475569" fontWeight={500} width={120} />
                    <Tooltip 
                      formatter={(value: number) => `${value}%`}
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="percentage" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={32}>
                      <LabelList dataKey="percentage" position="right" formatter={(val: number) => `${val}%`} fill="#64748b" fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extra Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-start">
                <div className="bg-amber-100 p-3 rounded-full mr-4 mt-1">
                  <Clock className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Turnaround Times</h3>
                  <ul className="space-y-3 text-slate-600">
                    <li className="flex justify-between border-b border-slate-100 pb-2">
                      <span>Time to First Decision (Average)</span>
                      <span className="font-semibold text-slate-800">42 Days</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-100 pb-2">
                      <span>Review Time (Average)</span>
                      <span className="font-semibold text-slate-800">28 Days</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-100 pb-2">
                      <span>Acceptance to Publication</span>
                      <span className="font-semibold text-slate-800">14 Days</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-start">
                <div className="bg-emerald-100 p-3 rounded-full mr-4 mt-1">
                  <Globe className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Global Indexing</h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    The Uganda Medical Journal is proud to be indexed and abstracted in major global scientific databases to maximize the reach of our authors' work.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['PubMed / MEDLINE', 'Scopus', 'African Journals Online (AJOL)', 'DOAJ', 'Google Scholar', 'Web of Science'].map((db) => (
                      <span key={db} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                        {db}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
