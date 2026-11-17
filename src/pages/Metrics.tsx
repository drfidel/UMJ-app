import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
} from 'recharts';
import { Clock, Globe, TrendingUp, Users } from 'lucide-react';
import SEO from '@/components/SEO';

const monthlyData = [
  { month: 'Aug', downloads: 3200, citations: 150 },
  { month: 'Sep', downloads: 3100, citations: 160 },
  { month: 'Oct', downloads: 4000, citations: 210 },
  { month: 'Nov', downloads: 4200, citations: 250 },
  { month: 'Dec', downloads: 3800, citations: 230 },
  { month: 'Jan', downloads: 4500, citations: 290 },
  { month: 'Feb', downloads: 4800, citations: 310 },
  { month: 'Mar', downloads: 5200, citations: 340 },
  { month: 'Apr', downloads: 5000, citations: 320 },
  { month: 'May', downloads: 5600, citations: 380 },
  { month: 'Jun', downloads: 6000, citations: 420 },
  { month: 'Jul', downloads: 6500, citations: 450 },
];

const acceptanceData = [
  { category: 'Initial Triage', percentage: 100 },
  { category: 'External Review', percentage: 45 },
  { category: 'Revisions', percentage: 28 },
  { category: 'Final Acceptance', percentage: 18 },
];

export default function Metrics() {
  const stats = [
    { label: '2024 Impact Factor', value: '1.45', detail: 'Clarivate JCR / AJOL' },
    { label: 'Days to First Decision', value: '42', suffix: 'days', detail: 'Median editorial triage' },
    { label: 'Acceptance Rate', value: '18', suffix: '%', detail: 'Double-blind peer review' },
    { label: 'Published Articles', value: '1,240', suffix: '+', detail: 'Indexed clinical archive' },
  ];

  const databases = [
    'PubMed / MEDLINE',
    'Scopus',
    'African Journals Online (AJOL)',
    'Directory of Open Access Journals (DOAJ)',
    'Google Scholar',
    'Web of Science',
  ];

  return (
    <div className="bg-background min-h-screen py-12">
      <SEO
        title="Journal Metrics"
        description="View the official metrics, impact factor, acceptance rate, and global reach of the Uganda Medical Journal."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Editorial Transparency & Impact
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
            Journal Metrics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
            Transparent reporting on the Uganda Medical Journal's editorial turnaround speed, selectivity, readership, and global indexing reach.
          </p>
        </div>

        {/* 4-Column Tabular KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border rounded-lg bg-card divide-y sm:divide-y-0 sm:divide-x divide-border mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono tabular-nums text-3xl sm:text-4xl font-bold text-foreground">
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span className="text-sm font-mono text-muted-foreground">{stat.suffix}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-editorial">
                <TrendingUp className="h-5 w-5 text-primary" />
                Readership & Academic Impact
              </CardTitle>
              <CardDescription>Monthly full-text downloads and Crossref citations (12-month window).</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.25} />
                    <XAxis dataKey="month" stroke="#64748b" tickMargin={10} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="left"
                      stroke="#64748b"
                      tickFormatter={(value) => `${value / 1000}k`}
                      axisLine={false}
                      tickLine={false}
                      orientation="left"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="right" stroke="#64748b" axisLine={false} tickLine={false} orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => new Intl.NumberFormat('en').format(value)}
                      contentStyle={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="citations"
                      name="Citations"
                      stroke="#1d4ed8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCitations)"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="downloads"
                      name="Article Downloads"
                      stroke="#047857"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorDownloads)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-none">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-editorial">
                <Users className="h-5 w-5 text-primary" />
                Editorial Funnel & Selectivity
              </CardTitle>
              <CardDescription>Proportion of submitted manuscripts progressing through peer-review stages.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={acceptanceData} layout="vertical" margin={{ top: 10, right: 35, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.25} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} stroke="#64748b" width={125} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => `${value}%`}
                      contentStyle={{ borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <Bar dataKey="percentage" fill="#0f2d52" radius={[0, 4, 4, 0]} barSize={28}>
                      <LabelList dataKey="percentage" position="right" formatter={(val: number) => `${val}%`} fill="#64748b" fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-lg p-7">
            <div className="flex items-center gap-2.5 mb-5">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-editorial text-xl font-bold text-foreground">Editorial Turnaround Times</h2>
            </div>
            <dl className="divide-y divide-border text-sm">
              <div className="py-3 flex justify-between items-center">
                <dt className="text-muted-foreground">Time to First Decision (Median)</dt>
                <dd className="font-mono tabular-nums font-semibold text-foreground">42 days</dd>
              </div>
              <div className="py-3 flex justify-between items-center">
                <dt className="text-muted-foreground">Peer Review Completion (Median)</dt>
                <dd className="font-mono tabular-nums font-semibold text-foreground">28 days</dd>
              </div>
              <div className="py-3 flex justify-between items-center">
                <dt className="text-muted-foreground">Acceptance to Online Publication</dt>
                <dd className="font-mono tabular-nums font-semibold text-foreground">14 days</dd>
              </div>
            </dl>
          </div>

          <div className="bg-card border border-border rounded-lg p-7">
            <div className="flex items-center gap-2.5 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="font-editorial text-xl font-bold text-foreground">Global Indexing & Abstracting</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              The Uganda Medical Journal is indexed across international biomedical repositories to maximize clinical discoverability and citation reach.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-foreground font-medium border-t border-border pt-4">
              {databases.map((db) => (
                <li key={db} className="flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">·</span>
                  <span>{db}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
