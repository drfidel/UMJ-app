import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, FileText, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthorGuidelines() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Author Guidelines & Submission Requirements</h1>
          <p className="text-lg text-slate-600">
            Comprehensive instructions and requirements for submitting your manuscript to the Uganda Medical Association Journal (UMAJ). Please read these guidelines carefully before beginning your submission.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                <FileText className="mr-3 h-6 w-6 text-blue-700" />
                1. Types of Articles Accepted
              </h2>
              <ul className="space-y-3 text-slate-700 ml-9 list-disc">
                <li><strong>Original Research:</strong> Full-length reports of original clinical or basic science research. Maximum 3,500 words, 50 references, and 6 tables/figures.</li>
                <li><strong>Review Articles:</strong> Comprehensive reviews on topics of broad medical interest. Maximum 4,000 words, 75 references.</li>
                <li><strong>Case Reports:</strong> Brief reports of clinical cases of unusual interest. Maximum 1,500 words, 15 references, and 2 tables/figures.</li>
                <li><strong>Letters to the Editor:</strong> Brief comments on recently published articles or other topics of clinical interest. Maximum 500 words, 5 references.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                <CheckCircle2 className="mr-3 h-6 w-6 text-blue-700" />
                2. Manuscript Formatting
              </h2>
              <div className="text-slate-700 ml-9 space-y-4">
                <p>All submissions must adhere to the following formatting requirements:</p>
                <ul className="space-y-2 list-disc ml-5">
                  <li><strong>File Format:</strong> Microsoft Word (.docx) or PDF format.</li>
                  <li><strong>Font:</strong> Times New Roman, Arial, or Calibri, 12-point size.</li>
                  <li><strong>Spacing:</strong> Double-spaced throughout, including abstract, references, and tables.</li>
                  <li><strong>Margins:</strong> 1-inch (2.54 cm) margins on all sides.</li>
                  <li><strong>Page Numbers:</strong> Numbered consecutively, starting with the title page.</li>
                  <li><strong>Language:</strong> English (UK or US spelling is acceptable, but must be consistent).</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                <FileText className="mr-3 h-6 w-6 text-blue-700" />
                3. Manuscript Structure
              </h2>
              <div className="text-slate-700 ml-9 space-y-4">
                <p>Original research articles should be organized in the following sections:</p>
                <ol className="space-y-3 list-decimal ml-5">
                  <li><strong>Title Page:</strong> Include the article title, authors' full names, affiliations, and contact information for the corresponding author.</li>
                  <li><strong>Abstract:</strong> Structured abstract (Background, Methods, Results, Conclusion) of no more than 250 words.</li>
                  <li><strong>Keywords:</strong> 3 to 6 keywords for indexing purposes.</li>
                  <li><strong>Introduction:</strong> State the background and objective of the study.</li>
                  <li><strong>Methods:</strong> Describe the study design, participants, interventions, and statistical analysis.</li>
                  <li><strong>Results:</strong> Present findings logically with tables and figures where appropriate.</li>
                  <li><strong>Discussion:</strong> Interpret the results, compare with existing literature, and note limitations.</li>
                  <li><strong>Conclusion:</strong> Summarize the main findings and their implications.</li>
                  <li><strong>References:</strong> Vancouver style formatting.</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
                <AlertCircle className="mr-3 h-6 w-6 text-blue-700" />
                4. Ethical Guidelines
              </h2>
              <div className="text-slate-700 ml-9 space-y-4">
                <p>UMAJ strictly adheres to ethical standards in publishing:</p>
                <ul className="space-y-2 list-disc ml-5">
                  <li><strong>Plagiarism:</strong> All manuscripts are screened for plagiarism. Submissions with unoriginal content will be rejected immediately.</li>
                  <li><strong>IRB Approval:</strong> Research involving human subjects must include a statement of approval from an Institutional Review Board (IRB) or ethics committee.</li>
                  <li><strong>Informed Consent:</strong> Patient anonymity must be preserved. Any identifiable patient information requires explicit written consent.</li>
                  <li><strong>Conflict of Interest:</strong> Authors must declare any financial or personal relationships that could be viewed as potential conflicts of interest.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Submit?</h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Ensure your manuscript meets all the guidelines above before proceeding to the submission portal.
            </p>
            <Link to="/submit" className={buttonVariants({ size: "lg", className: "bg-blue-700 hover:bg-blue-800 text-white" })}>
              Proceed to Submission Portal <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
