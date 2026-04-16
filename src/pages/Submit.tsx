import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, Upload, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters.').max(500, 'Title is too long.'),
  abstract: z.string().min(100, 'Abstract must be at least 100 characters.').max(5000, 'Abstract is too long.'),
  coAuthors: z.string().optional(),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
  isRevision: z.boolean().default(false).optional(),
  originalSubmissionId: z.string().optional(),
});

export default function Submit() {
  const { user, profile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showRolePrompt, setShowRolePrompt] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<z.infer<typeof formSchema> | null>(null);
  const [revisionsNeeded, setRevisionsNeeded] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      abstract: '',
      coAuthors: '',
      keywords: '',
      isRevision: false,
      originalSubmissionId: '',
    },
  });

  const isRevision = form.watch('isRevision');
  const originalSubmissionId = form.watch('originalSubmissionId');

  useEffect(() => {
    const fetchRevisions = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'submissions'),
          where('authorUid', '==', user.uid),
          where('status', '==', 'revision_requested')
        );
        const snap = await getDocs(q);
        setRevisionsNeeded(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching revisions:", error);
      }
    };
    fetchRevisions();
  }, [user]);

  // Auto-fill form when a revision is selected
  useEffect(() => {
    if (isRevision && originalSubmissionId) {
      const selected = revisionsNeeded.find(r => r.id === originalSubmissionId);
      if (selected) {
        form.setValue('title', selected.title);
        form.setValue('abstract', selected.abstract);
        form.setValue('coAuthors', (selected.coAuthors || []).join(', '));
        form.setValue('keywords', (selected.keywords || []).join(', '));
      }
    } else if (!isRevision) {
      form.reset({
        title: '',
        abstract: '',
        coAuthors: '',
        keywords: '',
        isRevision: false,
        originalSubmissionId: '',
      });
    }
  }, [isRevision, originalSubmissionId, revisionsNeeded, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check file type (PDF or DOCX)
      if (selectedFile.type === 'application/pdf' || 
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(selectedFile);
      } else {
        toast.error('Invalid file type. Please upload a PDF or DOCX file.');
        e.target.value = '';
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !profile) {
      toast.error('You must be logged in to submit a manuscript.');
      return;
    }

    if (!file) {
      toast.error('Please upload your manuscript file.');
      return;
    }

    if (!['author', 'admin', 'editor'].includes(profile.role)) {
      setPendingSubmitData(values);
      setShowRolePrompt(true);
      return;
    }

    if (values.isRevision && !values.originalSubmissionId) {
      form.setError('originalSubmissionId', { type: 'manual', message: 'Please select the manuscript you are revising.' });
      return;
    }

    await processSubmission(values);
  };

  const handleConfirmRoleSwitch = async () => {
    if (!user || !pendingSubmitData) return;
    
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: 'author' });
      
      await processSubmission(pendingSubmitData);
      setShowRolePrompt(false);
      setPendingSubmitData(null);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role. Please try again.");
      setIsSubmitting(false);
    }
  };

  const processSubmission = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // 1. Upload file to Storage
      const fileRef = ref(storage, `manuscripts/${user!.uid}/${Date.now()}_${file!.name}`);
      await uploadBytes(fileRef, file!);
      const fileUrl = await getDownloadURL(fileRef);

      // 2. Process keywords and co-authors
      const keywordsList = values.keywords.split(',').map(k => k.trim()).filter(k => k);
      const coAuthorsList = values.coAuthors ? values.coAuthors.split(',').map(a => a.trim()).filter(a => a) : [];

      // 3. Save to Firestore
      if (values.isRevision && values.originalSubmissionId) {
        // Update existing submission
        const submissionRef = doc(db, 'submissions', values.originalSubmissionId);
        await updateDoc(submissionRef, {
          title: values.title,
          abstract: values.abstract,
          coAuthors: coAuthorsList,
          keywords: keywordsList,
          fileUrl,
          status: 'submitted', // Change status back to submitted
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new submission
        const submissionData = {
          id: crypto.randomUUID(), // Generate a unique ID for the document data
          authorUid: user!.uid,
          title: values.title,
          abstract: values.abstract,
          coAuthors: coAuthorsList,
          keywords: keywordsList,
          fileUrl,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addDoc(collection(db, 'submissions'), submissionData);
      }

      setIsSuccess(true);
      toast.success(values.isRevision ? 'Revised manuscript submitted successfully!' : 'Manuscript submitted successfully!');
      
    } catch (error) {
      console.error("Submission error:", error);
      toast.error('Failed to submit manuscript. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription className="text-lg mt-2">
              You must be logged in to submit a manuscript to UMAJ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signInWithGoogle} size="lg" className="bg-blue-700 hover:bg-blue-800 text-white mt-4">
              Log In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <Card className="text-center py-12 border-green-200 bg-green-50">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-green-800">Submission Successful!</CardTitle>
            <CardDescription className="text-lg mt-2 text-green-700">
              Your manuscript has been received and is now under editorial review.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4 mt-6">
            <Link to="/dashboard" className={buttonVariants({ variant: "outline", className: "bg-white" })}>Go to Dashboard</Link>
            <Button onClick={() => {
              form.reset();
              setFile(null);
              setIsSuccess(false);
            }} className="bg-blue-700 hover:bg-blue-800 text-white">
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit Manuscript</h1>
          <p className="text-slate-600">
            Please fill out the form below to submit your research for peer review. Ensure you have read our <Link to="/author-guidelines" className="text-blue-700 hover:underline font-medium">Author Guidelines</Link> before submitting.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm mb-8 bg-blue-50">
          <CardHeader className="border-b border-blue-100 pb-4">
            <CardTitle className="text-xl text-slate-800 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-700" />
              Submission Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full border border-blue-200 bg-white text-blue-700 flex items-center justify-center mr-2 text-xs">1</span>
                Formatting & Structure
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 ml-2">
                <li>Submit in DOCX or PDF format (Max 10MB).</li>
                <li>Use standard fonts (e.g., Times New Roman, 12pt), double-spaced.</li>
                <li>Structured abstract required (100-500 words) with Background, Methods, Results, and Conclusion.</li>
                <li>Standard sections: Introduction, Methods, Results, Discussion, References.</li>
                <li>Include 3-5 keywords to aid indexing.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full border border-blue-200 bg-white text-blue-700 flex items-center justify-center mr-2 text-xs">2</span>
                Peer Review Process
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 ml-2">
                <li>All submissions undergo strict double-blind peer review.</li>
                <li>Initial editorial screening takes 3-5 working days.</li>
                <li>Peer review feedback is typically provided within 4-6 weeks.</li>
                <li>Revisions may be requested based on the reviewers' evaluations.</li>
              </ul>
            </div>

            <div className="md:col-span-2 border-t border-blue-100 pt-4">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full border border-blue-200 bg-white text-blue-700 flex items-center justify-center mr-2 text-xs">3</span>
                Ethical Considerations
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 ml-2">
                <li>Research involving human or animal subjects must include Institutional Review Board (IRB) approval statements and informed consent declarations.</li>
                <li>Authors must declare any potential financial or non-financial conflicts of interest.</li>
                <li>The Uganda Medical Journal enforces a strict policy against plagiarism, duplicate submission, and data falsification.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100 pb-6">
            <CardTitle>Manuscript Details</CardTitle>
            <CardDescription>All fields marked with an asterisk (*) are required.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {revisionsNeeded.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <input 
                      type="checkbox" 
                      id="isRevision" 
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      {...form.register('isRevision')}
                    />
                    <Label htmlFor="isRevision" className="text-blue-900 font-semibold cursor-pointer">
                      This is a revised manuscript
                    </Label>
                  </div>
                  
                  {isRevision && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="originalSubmissionId" className="text-blue-900 font-medium">Select Manuscript to Revise *</Label>
                      <Select 
                        value={originalSubmissionId} 
                        onValueChange={(val) => form.setValue('originalSubmissionId', val)}
                      >
                        <SelectTrigger className="bg-white border-blue-200">
                          <SelectValue placeholder="Select a manuscript..." />
                        </SelectTrigger>
                        <SelectContent>
                          {revisionsNeeded.map(rev => (
                            <SelectItem key={rev.id} value={rev.id}>
                              {rev.title.substring(0, 50)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.originalSubmissionId && <p className="text-sm text-red-500">{form.formState.errors.originalSubmissionId.message}</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-900 font-semibold">Manuscript Title *</Label>
                <Input id="title" placeholder="Enter the full title of your manuscript" className="bg-slate-50" {...form.register('title')} />
                {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="abstract" className="text-slate-900 font-semibold">Abstract *</Label>
                <Textarea 
                  id="abstract"
                  placeholder="Paste your abstract here (100-500 words recommended)" 
                  className="min-h-[200px] bg-slate-50" 
                  {...form.register('abstract')} 
                />
                <p className="text-sm text-slate-500">Include Background, Methods, Results, and Conclusion.</p>
                {form.formState.errors.abstract && <p className="text-sm text-red-500">{form.formState.errors.abstract.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="coAuthors" className="text-slate-900 font-semibold">Co-Authors</Label>
                  <Input id="coAuthors" placeholder="e.g., John Doe, Jane Smith" className="bg-slate-50" {...form.register('coAuthors')} />
                  <p className="text-sm text-slate-500">Comma-separated list of co-authors. You are automatically included as the primary author.</p>
                  {form.formState.errors.coAuthors && <p className="text-sm text-red-500">{form.formState.errors.coAuthors.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-slate-900 font-semibold">Keywords *</Label>
                  <Input id="keywords" placeholder="e.g., Malaria, Public Health, Uganda" className="bg-slate-50" {...form.register('keywords')} />
                  <p className="text-sm text-slate-500">Comma-separated list of 3-5 keywords.</p>
                  {form.formState.errors.keywords && <p className="text-sm text-red-500">{form.formState.errors.keywords.message}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-900 font-semibold">Manuscript File *</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-10 w-10 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-blue-700 mb-1">Click to upload</span>
                    <span className="text-xs text-slate-500">PDF or DOCX (Max 10MB)</span>
                  </label>
                  {file && (
                    <div className="mt-4 p-3 bg-white rounded border border-slate-200 text-sm text-slate-700 font-medium flex items-center justify-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      {file.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="bg-blue-700 hover:bg-blue-800 text-white min-w-[150px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Manuscript'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRolePrompt} onOpenChange={setShowRolePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Role to Author</DialogTitle>
            <DialogDescription>
              You currently do not have the 'Author' role. To submit a manuscript, your profile needs to be updated to an Author. Do you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowRolePrompt(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-blue-700 hover:bg-blue-800 text-white" onClick={handleConfirmRoleSwitch} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm & Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
