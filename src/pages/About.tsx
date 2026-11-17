import { Separator } from '@/components/ui/separator';
import SEO from '@/components/SEO';

export default function About() {
  return (
    <div className="bg-background min-h-screen py-12">
      <SEO
        title="About UMJ"
        description="Learn about the Uganda Medical Journal (UMJ), its aims and scope, open access policy, peer review process, and editorial contact information."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-6 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Institutional Mission
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
            About the Uganda Medical Journal
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-3 leading-relaxed">
            The Uganda Medical Journal (UMJ) is the official peer-reviewed, open-access publication of the Uganda Medical Association, dedicated to advancing clinical scholarship and healthcare delivery in Uganda and East Africa.
          </p>
        </div>

        <div className="space-y-10 text-foreground/85 leading-relaxed">
          <section className="bg-card border border-border rounded-lg p-7">
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">Aims & Scope</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              UMJ provides an authoritative platform for clinicians, researchers, and public health practitioners to publish original investigations, clinical trials, systematic reviews, case reports, and policy perspectives across all medical specialties—with particular focus on infectious diseases, maternal and child health, non-communicable diseases, and health systems strengthening.
            </p>
          </section>

          <section>
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">Open Access Policy</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Open-access articles are made immediately and freely accessible worldwide under a Creative Commons Attribution License (CC BY 4.0), allowing clinicians and policymakers to read, download, cite, and apply medical evidence without barrier.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">Peer Review Process</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              UMJ employs a rigorous double-blind peer review model. All submissions undergo initial editorial triage for methodological rigor and ethical compliance before independent evaluation by at least two domain specialists and statistical reviewers. Final publication decisions rest with the Editor-in-Chief.
            </p>
          </section>

          <section>
            <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">Indexing & Abstracting</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Published scholarship in UMJ is indexed and discoverable across major international biomedical databases:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  name: 'PubMed / MEDLINE',
                  desc: 'Discoverable through the premier biomedical literature index maintained by the U.S. National Library of Medicine.',
                },
                {
                  name: 'African Journals Online (AJOL)',
                  desc: "Hosted and indexed on AJOL, the world's largest collection of peer-reviewed, African-published scholarly journals.",
                },
                {
                  name: 'Google Scholar',
                  desc: 'Full metadata and citation indexing ensuring immediate visibility for researchers and clinicians globally.',
                },
                {
                  name: 'Directory of Open Access Journals (DOAJ)',
                  desc: 'Listed in DOAJ in recognition of transparent peer-review governance and open-access publishing standards.',
                },
              ].map((item) => (
                <div key={item.name} className="bg-card border border-border rounded-lg p-5">
                  <h3 className="font-editorial text-lg font-bold text-foreground mb-1.5">{item.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section className="bg-card border border-border rounded-lg p-7">
            <h2 className="font-editorial text-xl font-bold text-foreground mb-3">Editorial Office</h2>
            <address className="not-italic text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Uganda Medical Association Headquarters</p>
              <p>Plot 8, Katonga Road, Nakasero · P.O. Box 29874, Kampala, Uganda</p>
              <p>
                <span className="font-medium text-foreground">Email:</span> editor@umaj.org.ug
              </p>
              <p>
                <span className="font-medium text-foreground">Phone:</span>{' '}
                <span className="font-mono">+256 414 123 456</span>
              </p>
            </address>
          </section>
        </div>
      </div>
    </div>
  );
}
