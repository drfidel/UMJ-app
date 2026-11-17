import SEO from '@/components/SEO';

export default function TermsOfService() {
  return (
    <div className="bg-background min-h-screen py-12">
      <SEO title="Terms of Service" description="Terms of service for the Uganda Medical Journal platform." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Publishing & Usage Terms
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Uganda Medical Association Journal platform, you agree to comply with these Terms of Service. If you do not agree with any provision, please discontinue use of the site and its services.
            </p>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">2. User Accounts & Scholarly Conduct</h2>
            <p>
              Authors, reviewers, and subscribers must maintain accurate credential information and safeguard account access. Clinical commentary and rapid responses must uphold respectful, evidence-based professional discourse.
            </p>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">3. Manuscript Submissions & Peer Review</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Originality:</strong> Submitted manuscripts must represent original, unpublished work not under simultaneous consideration elsewhere.</li>
              <li><strong className="text-foreground">Peer Review:</strong> All submissions undergo editorial screening and double-blind peer review. Decisions by the Editorial Board are final.</li>
              <li><strong className="text-foreground">Ethics & Disclosures:</strong> Authors must obtain appropriate IRB ethics approvals, patient consent, and disclose conflicts of interest.</li>
            </ul>
          </section>

          <section className="bg-card border border-border rounded-lg p-6 sm:p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">4. Intellectual Property & Licensing</h2>
            <p>
              Open-access articles are published under Creative Commons Attribution (CC BY 4.0) terms unless otherwise specified. Platform design, brand marks, and editorial compilations remain the property of the Uganda Medical Association.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
