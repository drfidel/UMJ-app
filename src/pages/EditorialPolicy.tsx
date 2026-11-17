import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SEO from '@/components/SEO';

export default function EditorialPolicy() {
  return (
    <div className="bg-background min-h-screen py-12">
      <SEO 
        title="Editorial Policy | Uganda Medical Journal" 
        description="The Editorial Policy of the Uganda Medical Journal."
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Governance & Standards
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Editorial Policy
          </h1>
        </div>
        
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-8 md:p-10 text-foreground/90 leading-relaxed space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed pb-4 border-b border-border">
              The Uganda Medical Journal (UMJ) follows rigorous ethical standards to ensure the integrity, originality, and quality of its publications. This editorial policy outlines the responsibilities of authors, reviewers, and editors.
            </p>

            <div>
              <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">1. Authorship Criteria</h2>
              <p className="mb-3">
                Authorship credit should be based on the guidelines of the International Committee of Medical Journal Editors (ICMJE). To be listed as an author, one must make substantial contributions to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Conception and design, or acquisition of data, or analysis and interpretation of data;</li>
                <li>Drafting the article or revising it critically for important intellectual content;</li>
                <li>Final approval of the version to be published; and</li>
                <li>Agreement to be accountable for all aspects of the work.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">2. Peer Review Process</h2>
              <p className="mb-3">
                UMJ employs a double-blind peer review process. All submitted manuscripts are initially evaluated by the Editorial Board. Those meeting our standards and scope are sent to at least two independent expert reviewers.
              </p>
              <p className="text-muted-foreground">
                Reviewers are expected to provide objective, constructive feedback and maintain strict confidentiality. The Editor-in-Chief makes the final decision on acceptance, revision, or rejection based on the reviewers' recommendations.
              </p>
            </div>

            <div>
              <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">3. Plagiarism Policy</h2>
              <p className="text-muted-foreground">
                UMJ has a zero-tolerance policy for plagiarism. All manuscripts are screened using similarity check software prior to the peer review process. If plagiarism is detected at any stage, the manuscript will be rejected outright, and the authors may be barred from future submissions.
              </p>
            </div>

            <div>
              <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">4. Conflict of Interest (COI)</h2>
              <p className="text-muted-foreground">
                Authors, reviewers, and editors must disclose any potential conflicts of interest, including financial, personal, or academic relationships that might influence their judgment or the validity of the research.
              </p>
            </div>

            <div>
              <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">5. Ethical Guidelines</h2>
              <p className="text-muted-foreground">
                Research involving human or animal subjects must adhere to international ethical standards (e.g., the Declaration of Helsinki). Authors must provide documentation of approval by an appropriate Institutional Review Board (IRB) or Ethics Committee. Informed consent must be obtained from all human participants.
              </p>
            </div>

            <div>
              <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">6. Open Access and Copyright</h2>
              <p className="text-muted-foreground">
                UMJ offers both open access and subscription-based publishing options. For open access articles, authors retain the copyright and grant the journal the right of first publication under a Creative Commons (CC-BY) license.
              </p>
            </div>
            
            <div>
              <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">7. Data Sharing Policy</h2>
              <p className="text-muted-foreground">
                Authors are strongly encouraged to share the underlying data supporting their findings in a public repository. Data availability statements are required in all published articles.
              </p>
            </div>
           
            <Separator className="my-8" />
            
            <div className="bg-muted/50 border border-border p-6 rounded-lg text-center">
              <h3 className="font-semibold text-foreground mb-2">Have questions about our policy?</h3>
              <p className="text-muted-foreground text-sm mb-4">Contact the editorial office for clarification on any of the points above.</p>
              <Link to="/contact" className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-6 rounded-md transition-colors text-sm">
                Contact Editorial Office
              </Link>
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
