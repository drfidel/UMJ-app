import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function About() {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">About UMJ</h1>
        
        <div className="prose prose-slate prose-lg max-w-none">
          <p className="lead text-xl text-slate-600 mb-8">
            The Uganda Medical Journal (UMJ) is the official publication of the Uganda Medical Association. It is a peer-reviewed, open-access medical journal dedicated to publishing high-quality research and clinical studies.
          </p>

          <Card className="bg-blue-50 border-none shadow-none mb-10">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 mt-0">Aims & Scope</h2>
              <p className="text-blue-800 mb-0">
                UMAJ aims to provide a platform for healthcare professionals, researchers, and academicians to share their findings, discuss critical health issues, and contribute to the advancement of medical knowledge and practice in Uganda and the broader African context. We welcome original research, review articles, case reports, and perspectives across all medical specialties, with a particular focus on infectious diseases, maternal and child health, public health, and health systems strengthening.
              </p>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Open Access Policy</h2>
          <p>
            This journal provides immediate open access to its content on the principle that making research freely available to the public supports a greater global exchange of knowledge. All articles are published under a Creative Commons Attribution License (CC BY), allowing others to read, download, copy, distribute, print, search, or link to the full texts of articles.
          </p>

          <Separator className="my-10" />

          <h2 className="text-2xl font-bold text-slate-900 mb-4">Peer Review Process</h2>
          <p>
            UMAJ employs a rigorous double-blind peer review process. All submitted manuscripts are initially evaluated by the Editorial Board for suitability. Manuscripts deemed appropriate are then sent to at least two independent expert reviewers to assess the scientific quality of the paper. The Editor-in-Chief makes the final decision regarding acceptance or rejection based on the reviewers' reports.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">Indexing and Abstracting</h2>
          <p>
            The Uganda Medical Journal (UMJ) is committed to ensuring the widest possible dissemination and discoverability of its published research. UMJ is currently indexed, abstracted, or listed in the following prominent databases and services:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">PubMed / MEDLINE</h3>
                <p className="text-slate-600 text-sm">
                  UMAJ articles are discoverable through PubMed, the premier database of biomedical literature maintained by the National Center for Biotechnology Information (NCBI) at the U.S. National Library of Medicine.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">African Journals Online (AJOL)</h3>
                <p className="text-slate-600 text-sm">
                  As a leading African medical journal, UMJ is proudly hosted and indexed on AJOL, the world's largest and pre-eminent collection of peer-reviewed, African-published scholarly journals.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Google Scholar</h3>
                <p className="text-slate-600 text-sm">
                  All published articles are comprehensively indexed by Google Scholar, ensuring high visibility and easy access for researchers globally searching for academic literature.
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">DOAJ</h3>
                <p className="text-slate-600 text-sm">
                  UMAJ is listed in the Directory of Open Access Journals (DOAJ), a community-curated online directory that indexes and provides access to high-quality, open access, peer-reviewed journals.
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-10" />

          <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Information</h2>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2">Editorial Office</h3>
            <p className="mb-1">Uganda Medical Association Headquarters</p>
            <p className="mb-1">Plot 8, Katonga Road, Nakasero</p>
            <p className="mb-1">P.O. Box 29874, Kampala, Uganda</p>
            <p className="mb-1"><strong>Email:</strong> editor@umaj.org.ug</p>
            <p><strong>Phone:</strong> +256 414 123 456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
