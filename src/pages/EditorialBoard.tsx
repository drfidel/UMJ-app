import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function EditorialBoard() {
  const leadership = [
    {
      name: 'Prof. Emmanuel Mukiibi',
      role: 'Editor-in-Chief',
      affiliation: 'Makerere University College of Health Sciences',
      specialty: 'Internal Medicine & Clinical Epidemiology',
      initials: 'EM',
      bio: 'Professor of Medicine with over 25 years of clinical research leadership in infectious diseases and cardiometabolic health across East Africa.',
    },
    {
      name: 'Dr. Sarah Kizza',
      role: 'Deputy Editor',
      affiliation: 'Mulago National Referral Hospital',
      specialty: 'Pediatrics & Child Health',
      initials: 'SK',
      bio: 'Senior Consultant Pediatrician leading multi-center cohort investigations on pediatric HIV retention and childhood nutrition.',
    },
  ];

  const editorialStaff = [
    {
      name: 'Dr. Peter Okello',
      role: 'Associate Editor',
      affiliation: 'Gulu University Faculty of Medicine',
      specialty: 'Public Health & Epidemiology',
      initials: 'PO',
    },
    {
      name: 'Prof. Jane Namukasa',
      role: 'Associate Editor',
      affiliation: 'Mbarara University of Science and Technology',
      specialty: 'Obstetrics & Gynecology',
      initials: 'JN',
    },
    {
      name: 'Dr. Moses Byaruhanga',
      role: 'Managing Editor',
      affiliation: 'Uganda Medical Association',
      specialty: 'Health Systems Management',
      initials: 'MB',
    },
    {
      name: 'Dr. Brian Mugunga',
      role: 'Statistical & Ethics Editor',
      affiliation: 'Makerere University School of Public Health',
      specialty: 'Biostatistics & Research Ethics',
      initials: 'BM',
    },
    {
      name: 'Dr. Florence Akello',
      role: 'Associate Editor',
      affiliation: 'Mbale Regional Referral Hospital',
      specialty: 'Maternal & Perinatal Health',
      initials: 'FA',
    },
    {
      name: 'Dr. David Otim',
      role: 'Associate Editor',
      affiliation: 'Busitema University Faculty of Health Sciences',
      specialty: 'General Surgery & Trauma',
      initials: 'DO',
    },
  ];

  return (
    <div className="bg-background min-h-screen py-12">
      <SEO
        title="Editorial Board"
        description="Meet the distinguished editors and medical researchers guiding the Uganda Medical Journal."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Governance & Peer Review
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
              Editorial Board
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
              The Uganda Medical Journal is guided by specialist clinicians, academics, and biostatisticians committed to rigorous scientific integrity.
            </p>
          </div>
          <Link
            to="/editorial-policy"
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'shrink-0 self-start md:self-auto' })}
          >
            Editorial & Ethics Policy <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Senior Leadership */}
        <section className="mb-14">
          <h2 className="font-editorial text-2xl font-bold text-foreground mb-6">Senior Editorial Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leadership.map((editor) => (
              <div
                key={editor.name}
                className="bg-card border border-border rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start"
              >
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-editorial text-xl font-bold shrink-0">
                  {editor.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 mb-1">
                    {editor.role}
                  </p>
                  <h3 className="font-editorial text-xl font-bold text-foreground">
                    <Link to={`/author/${encodeURIComponent(editor.name)}`} className="hover:underline underline-offset-4">
                      {editor.name}
                    </Link>
                  </h3>
                  <p className="text-sm font-medium text-foreground/85 mt-1">{editor.affiliation}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{editor.specialty}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3">{editor.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Associate & Managing Editors */}
        <section>
          <h2 className="font-editorial text-2xl font-bold text-foreground mb-6">
            Associate & Managing Editors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {editorialStaff.map((editor) => (
              <div key={editor.name} className="bg-card border border-border rounded-lg p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-muted text-foreground flex items-center justify-center font-editorial text-base font-bold shrink-0 border border-border">
                  {editor.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">
                    {editor.role}
                  </p>
                  <h3 className="font-editorial text-lg font-bold text-foreground leading-snug">
                    <Link to={`/author/${encodeURIComponent(editor.name)}`} className="hover:underline underline-offset-4">
                      {editor.name}
                    </Link>
                  </h3>
                  <p className="text-xs font-medium text-foreground/80 mt-1">{editor.affiliation}</p>
                  <p className="text-xs text-muted-foreground mt-1">{editor.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
