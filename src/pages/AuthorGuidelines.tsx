import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { ArrowRight, Download } from 'lucide-react';
import SEO from '@/components/SEO';

export default function AuthorGuidelines() {
  return (
    <div className="bg-background min-h-screen py-12">
      <SEO
        title="Author Guidelines"
        description="Manuscript formatting, reporting checklists, ethics requirements, and submission instructions for the Uganda Medical Journal."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Instructions for Authors
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
              Author Guidelines & Submission Requirements
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
              Comprehensive preparation standards, reporting checklists, and ethical requirements for submitting manuscripts to the Uganda Medical Journal.
            </p>
          </div>
          <Link
            to="/submit"
            className={buttonVariants({ className: 'bg-primary text-primary-foreground shrink-0 self-start md:self-auto' })}
          >
            Submit Manuscript <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-6">
          <section className="bg-card border border-border rounded-lg p-7">
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-4">
              1. Article Categories & Word Limits
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2.5 pr-4 font-semibold">Article Type</th>
                    <th className="py-2.5 px-4 font-semibold">Max Words</th>
                    <th className="py-2.5 px-4 font-semibold">References</th>
                    <th className="py-2.5 pl-4 font-semibold">Tables / Figures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono tabular-nums text-xs sm:text-sm">
                  <tr>
                    <td className="py-3 pr-4 font-sans font-medium text-foreground">Original Investigation</td>
                    <td className="py-3 px-4 text-muted-foreground">3,500</td>
                    <td className="py-3 px-4 text-muted-foreground">50</td>
                    <td className="py-3 pl-4 text-muted-foreground">6</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans font-medium text-foreground">Systematic / Clinical Review</td>
                    <td className="py-3 px-4 text-muted-foreground">4,000</td>
                    <td className="py-3 px-4 text-muted-foreground">75</td>
                    <td className="py-3 pl-4 text-muted-foreground">6</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans font-medium text-foreground">Case Report</td>
                    <td className="py-3 px-4 text-muted-foreground">1,500</td>
                    <td className="py-3 px-4 text-muted-foreground">15</td>
                    <td className="py-3 pl-4 text-muted-foreground">2</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-sans font-medium text-foreground">Letter to the Editor</td>
                    <td className="py-3 px-4 text-muted-foreground">500</td>
                    <td className="py-3 px-4 text-muted-foreground">5</td>
                    <td className="py-3 pl-4 text-muted-foreground">1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-7">
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-4">
              2. Manuscript Formatting & Templates
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground list-disc pl-5 mb-6">
              <li><strong className="text-foreground">File Format:</strong> Microsoft Word (.docx) or LaTeX source archive (.zip).</li>
              <li><strong className="text-foreground">Typography & Margins:</strong> Double-spaced 12-point serif or sans-serif font with 1-inch (2.54 cm) margins.</li>
              <li><strong className="text-foreground">Abstract Structure:</strong> Structured 250-word abstract (Background, Methods, Results, Conclusion) plus 3–6 MeSH-aligned keywords.</li>
              <li><strong className="text-foreground">Citation Standard:</strong> Vancouver numbering style with complete DOI links where assigned.</li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <a
                href="/templates/UMAJ_Manuscript_Template.docx"
                download
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <Download className="mr-2 h-4 w-4" /> Download Word Template (.docx)
              </a>
              <a
                href="/templates/UMAJ_LaTeX_Template.zip"
                download
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <Download className="mr-2 h-4 w-4" /> Download LaTeX Template (.zip)
              </a>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-7">
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-4">
              3. Reporting Standards & Ethics Compliance
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground list-disc pl-5">
              <li><strong className="text-foreground">Reporting Guidelines:</strong> Randomized trials must follow CONSORT; observational studies STROBE; systematic reviews PRISMA.</li>
              <li><strong className="text-foreground">IRB / REC Approval:</strong> All human-subject research must state institutional ethics approval reference numbers and informed consent procedures.</li>
              <li><strong className="text-foreground">Originality & Plagiarism Screening:</strong> Every submission undergoes automated similarity screening prior to peer review.</li>
              <li><strong className="text-foreground">Conflicts of Interest:</strong> Financial, institutional, and personal disclosures are mandatory for all co-authors.</li>
            </ul>
          </section>

          <section className="bg-card border border-border rounded-lg p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-editorial text-xl font-bold text-foreground">Ready to Submit Your Manuscript?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Proceed to the online submission portal to upload your manuscript and co-author metadata.
              </p>
            </div>
            <Link
              to="/submit"
              className={buttonVariants({ size: 'lg', className: 'bg-primary text-primary-foreground shrink-0' })}
            >
              Submission Portal <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
