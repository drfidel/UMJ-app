import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { AlertCircle, Upload, CheckCircle2, FileText, X, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters.').max(500, 'Title is too long.'),
  abstract: z.string().min(100, 'Abstract must be at least 100 characters.').max(5000, 'Abstract is too long.'),
  coAuthors: z.array(z.object({ name: z.string().min(2, "Name must be at least 2 characters") })).optional(),
  keywords: z.string().min(3, 'Please provide at least one keyword.'),
  specialty: z.string().min(1, 'Please select a medical specialty.'),
  coverLetter: z.string().optional(),
  isRevision: z.boolean().default(false).optional(),
  originalSubmissionId: z.string().optional(),
});

export const medicalSpecialties = [
  "General Medicine",
  "Internal Medicine",
  "Surgery",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Public Health",
  "Infectious Diseases",
  "Tropical Medicine",
  "Cardiology",
  "Neurology",
  "Oncology",
  "Psychiatry",
  "Dermatology",
  "Family Medicine",
  "Other"
];

export default function Submit() {
  const { user, profile, signInWithGoogle, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRevisionParam = searchParams.get('revision') === 'true';
  const revisionIdParam = searchParams.get('id') || '';

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
      coAuthors: [],
      keywords: '',
      specialty: '',
      coverLetter: '',
      isRevision: isRevisionParam,
      originalSubmissionId: revisionIdParam,
    },
  });

  const { fields: coAuthorFields, append: appendCoAuthor, remove: removeCoAuthor } = useFieldArray({
    control: form.control,
    name: "coAuthors",
  });

  const isRevision = form.watch('isRevision');
  const originalSubmissionId = form.watch('originalSubmissionId');

  useEffect(() => {
    const fetchRevisions = async () => {
      if (!user) return;
      if (isDemoMode) {
        // Mock demo revisions if author
        if (user.uid.includes('author') || isRevisionParam) {
          setRevisionsNeeded([
            { 
              id: revisionIdParam || 'sub-2', 
              title: 'Quantum Computing: A Review of Current Algorithms', 
              abstract: 'A comprehensive review of quantum algorithms, highlighting their potential advantages over classical counterparts in specific computational domains.', 
              coAuthors: [], 
              keywords: ['Quantum', 'Algorithms'], 
              status: 'revision_requested' 
            }
          ]);
        }
        return;
      }
      try {
        const q = query(
          collection(db, 'submissions'),
          where('authorUid', '==', user.uid),
          where('status', '==', 'revision_requested')
        );
        const snap = await getDocs(q);
        setRevisionsNeeded(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          // Silent fallback
        } else {
          console.error("Error fetching revisions:", error);
        }
      }
    };
    fetchRevisions();
  }, [user, isDemoMode]);

  // Auto-fill form when a revision is selected
  useEffect(() => {
    if (isRevision && originalSubmissionId) {
      const selected = revisionsNeeded.find(r => r.id === originalSubmissionId);
      if (selected) {
        form.setValue('title', selected.title);
        form.setValue('abstract', selected.abstract);
        form.setValue('coAuthors', (selected.coAuthors || []).map((name: string) => ({ name })));
        form.setValue('keywords', (selected.keywords || []).join(', '));
        if (selected.specialty) form.setValue('specialty', selected.specialty);
      }
    }
  }, [isRevision, originalSubmissionId, revisionsNeeded, form]);

  // Draft saving and loading
  const [draftRestored, setDraftRestored] = useState(false);
  const watchedValues = form.watch();

  useEffect(() => {
    if (!draftRestored) {
      const savedDraft = localStorage.getItem('umaj_draft_submission');
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          // Only restore if we are not forcing a revision via URL params
          if (!isRevisionParam && !revisionIdParam) {
            form.reset(parsedDraft);
            toast.info('Restored unsaved draft');
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
      setDraftRestored(true);
    }
  }, [draftRestored, form, isRevisionParam, revisionIdParam]);

  useEffect(() => {
    if (draftRestored) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('umaj_draft_submission', JSON.stringify(watchedValues));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, draftRestored]);

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

    if (isDemoMode) {
      setTimeout(() => {
        setIsSuccess(true);
        localStorage.removeItem('umaj_draft_submission');
        toast.success(values.isRevision ? 'Demo: Revised manuscript submitted successfully!' : 'Demo: Manuscript submitted successfully!');
        setIsSubmitting(false);
      }, 1500);
      return;
    }

    try {
      // 1. Upload file to Storage
      const fileRef = ref(storage, `manuscripts/${user!.uid}/${Date.now()}_${file!.name}`);
      await uploadBytes(fileRef, file!);
      const fileUrl = await getDownloadURL(fileRef);

      // 2. Process keywords and co-authors
      const keywordsList = values.keywords.split(',').map(k => k.trim()).filter(k => k);
      const coAuthorsList = values.coAuthors ? values.coAuthors.map(a => a.name.trim()).filter(a => a) : [];

      // 3. Save to Firestore
      if (values.isRevision && values.originalSubmissionId) {
        // Update existing submission
        const submissionRef = doc(db, 'submissions', values.originalSubmissionId);
        await updateDoc(submissionRef, {
          title: values.title,
          abstract: values.abstract,
          coAuthors: coAuthorsList,
          keywords: keywordsList,
          specialty: values.specialty,
          coverLetter: values.coverLetter || '',
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
          specialty: values.specialty,
          coverLetter: values.coverLetter || '',
          fileUrl,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addDoc(collection(db, 'submissions'), submissionData);
      }

      setIsSuccess(true);
      localStorage.removeItem('umaj_draft_submission');
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
      <div className="bg-background min-h-screen py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12 border-border bg-card">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7" />
              </div>
              <CardTitle className="font-editorial text-2xl text-foreground">Authentication Required</CardTitle>
              <CardDescription className="text-base mt-2 text-muted-foreground">
                You must be signed in to submit a manuscript to the Uganda Medical Journal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={signInWithGoogle} size="lg" className="mt-4">
                Sign In with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-background min-h-screen py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12 border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30">
            <CardHeader>
              <div className="mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <CardTitle className="font-editorial text-2xl text-emerald-900 dark:text-emerald-200">Submission Received</CardTitle>
              <CardDescription className="text-base mt-2 text-emerald-800 dark:text-emerald-300/90">
                Your manuscript has been logged into our editorial workflow for initial screening.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4 mt-6">
              <Link to="/dashboard" className={buttonVariants({ variant: "outline" })}>Go to Dashboard</Link>
              <Button onClick={() => {
                form.reset();
                setFile(null);
                setIsSuccess(false);
              }}>
                Submit Another
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Editorial Submission Portal
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground mb-2">Submit Manuscript</h1>
          <p className="text-muted-foreground">
            Submit your original research, clinical trial, or case report for double-blind peer review. Read our <Link to="/author-guidelines" className="text-primary hover:underline font-medium">Author Guidelines</Link> prior to submission.
          </p>
        </div>

        <Card className="border-border shadow-sm mb-8 bg-muted/40">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="font-editorial text-xl text-foreground flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Submission Guidelines & Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-foreground/85">
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full border border-border bg-card text-primary flex items-center justify-center mr-2 text-xs font-mono">1</span>
                Formatting & Structure
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground ml-2 mb-4">
                <li>Submit in DOCX or PDF format (Max 10MB).</li>
                <li>Use standard fonts (Times New Roman, 12pt), double-spaced.</li>
                <li>Structured abstract required (100–500 words): Background, Methods, Results, Conclusion.</li>
                <li>Include 3–5 keywords to aid indexing.</li>
              </ul>
              
              <div className="p-4 rounded-lg border border-border bg-card">
                <h4 className="font-semibold text-foreground mb-1.5 flex items-center text-sm">
                  <Download className="mr-2 h-4 w-4 text-primary" />
                  Manuscript Templates
                </h4>
                <p className="text-xs text-muted-foreground mb-3">Download our pre-formatted templates to meet UMJ formatting requirements.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a href="/templates/UMAJ_Manuscript_Template.docx" download className="flex-1">
                    <Button type="button" variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <FileText className="mr-2 h-3.5 w-3.5 text-primary" /> Word (.docx)
                    </Button>
                  </a>
                  <a href="/templates/UMAJ_LaTeX_Template.zip" download className="flex-1">
                    <Button type="button" variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <FileText className="mr-2 h-3.5 w-3.5 text-primary" /> LaTeX (.zip)
                    </Button>
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full border border-border bg-card text-primary flex items-center justify-center mr-2 text-xs font-mono">2</span>
                Peer Review Process
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground ml-2">
                <li>All submissions undergo strict double-blind peer review.</li>
                <li>Initial editorial screening takes 3–5 working days.</li>
                <li>Peer review feedback is typically provided within 4–6 weeks.</li>
                <li>Your form progress auto-saves locally as you type.</li>
              </ul>
            </div>

            <div className="md:col-span-2 border-t border-border pt-4">
              <h3 className="font-bold text-foreground mb-2 flex items-center">
                <span className="w-6 h-6 rounded-full border border-border bg-card text-primary flex items-center justify-center mr-2 text-xs font-mono">3</span>
                Ethical Considerations
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground ml-2">
                <li>Research involving human or animal subjects must include IRB approval statements and informed consent declarations.</li>
                <li>Authors must declare any potential financial or non-financial conflicts of interest.</li>
                <li>UMJ enforces a strict policy against plagiarism, duplicate submission, and data falsification.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-6">
            <CardTitle className="font-editorial text-2xl text-foreground">Manuscript Details</CardTitle>
            <CardDescription>All fields marked with an asterisk (*) are required.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {revisionsNeeded.length > 0 && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <input 
                      type="checkbox" 
                      id="isRevision" 
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                      {...form.register('isRevision')}
                    />
                    <Label htmlFor="isRevision" className="text-foreground font-semibold cursor-pointer">
                      This is a revised manuscript
                    </Label>
                  </div>
                  
                  {isRevision && (
                    <div className="space-y-3 pl-5 mt-4 border-l-2 border-primary py-1">
                      <div>
                        <Label htmlFor="originalSubmissionId" className="text-foreground font-semibold text-base">Select Manuscript to Revise *</Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">Locate and select the original submission entry below to link manuscript versions.</p>
                      </div>
                      <Select 
                        value={originalSubmissionId || ''} 
                        onValueChange={(val) => form.setValue('originalSubmissionId', val || '')}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Locate and select the original submission..." />
                        </SelectTrigger>
                        <SelectContent>
                          {revisionsNeeded.map(rev => (
                            <SelectItem key={rev.id} value={rev.id}>
                              {rev.title.substring(0, 50)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.originalSubmissionId && <p className="text-sm text-red-500 font-medium">{form.formState.errors.originalSubmissionId.message}</p>}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground font-semibold">Manuscript Title *</Label>
                <Input id="title" placeholder="Enter the full title of your manuscript" className="bg-background" {...form.register('title')} />
                {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="abstract" className="text-foreground font-semibold">Abstract *</Label>
                <Textarea 
                  id="abstract"
                  placeholder="Paste your abstract here (100-500 words recommended)" 
                  className="min-h-[200px] bg-background" 
                  {...form.register('abstract')} 
                />
                <p className="text-sm text-muted-foreground">Include Background, Methods, Results, and Conclusion.</p>
                {form.formState.errors.abstract && <p className="text-sm text-red-500">{form.formState.errors.abstract.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-foreground font-semibold">Medical Specialty *</Label>
                <Select
                  onValueChange={(val) => form.setValue('specialty', val || '')}
                  defaultValue={form.getValues('specialty')}
                >
                  <SelectTrigger className="bg-background w-full sm:w-72">
                    <SelectValue placeholder="Select a specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicalSpecialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.specialty && <p className="text-sm text-red-500">{form.formState.errors.specialty.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground font-semibold mb-2 block">Co-Authors</Label>
                    <p className="text-sm text-muted-foreground mb-2">You are automatically included as the primary author.</p>
                  </div>
                  <div className="space-y-3">
                    {coAuthorFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Input 
                          placeholder="e.g., Dr. Peter Okello" 
                          className="bg-background flex-grow" 
                          {...form.register(`coAuthors.${index}.name` as const)} 
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeCoAuthor(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {form.formState.errors.coAuthors && <p className="text-sm text-red-500">Please enter valid names for all co-authors.</p>}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => appendCoAuthor({ name: '' })}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Co-Author
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-foreground font-semibold">Keywords *</Label>
                  <Input id="keywords" placeholder="e.g., Malaria, Public Health, Uganda" className="bg-background" {...form.register('keywords')} />
                  <p className="text-sm text-muted-foreground">Comma-separated list of 3–5 keywords.</p>
                  {form.formState.errors.keywords && <p className="text-sm text-red-500">{form.formState.errors.keywords.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter" className="text-foreground font-semibold">Cover Letter (Optional)</Label>
                <Textarea 
                  id="coverLetter"
                  placeholder="Paste or write your cover letter here..." 
                  className="min-h-[150px] bg-background" 
                  {...form.register('coverLetter')} 
                />
                <p className="text-sm text-muted-foreground">Address your letter to the Editor-in-Chief. Briefly explain the significance of your research and confirm it is original and not under consideration elsewhere.</p>
                {form.formState.errors.coverLetter && <p className="text-sm text-red-500">{form.formState.errors.coverLetter.message}</p>}
              </div>

              <div className="space-y-3">
                <Label className="text-foreground font-semibold">Manuscript File *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    <span className="text-sm font-medium text-primary mb-1">Click to upload manuscript</span>
                    <span className="text-xs text-muted-foreground">PDF or DOCX (Max 10MB)</span>
                  </label>
                  {file && (
                    <div className="mt-4 p-3 bg-card rounded border border-border text-sm text-foreground font-medium inline-flex items-center justify-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      {file.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="min-w-[170px]"
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
            <Button onClick={handleConfirmRoleSwitch} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm & Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
