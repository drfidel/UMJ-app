import { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, setDoc, doc, updateDoc, deleteDoc, getDoc, arrayRemove } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, BookOpen, MessageSquare, Users, BarChart3, Search, Check, AlertTriangle, Flag, ShieldCheck, ShieldAlert, Star, Award, TrendingUp, Calendar, ArrowUp, ArrowDown, ArrowUpDown, Bookmark, Save, Trash2, Library, Plus, ExternalLink, Edit, Lock, Unlock, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from '@/components/QRScanner';
import { ScanLine } from 'lucide-react';
import {
  MEDICAL_SPECIALTIES,
  ARTICLE_TYPES,
  PUBLISH_PLACEMENTS,
  ArticleCategoryType,
  FeaturedPlacementType,
} from '@/data/journalData';

const SubmissionProgressTracker = ({ submission }: { submission: any }) => {
  const status = submission.status;
  const isRejected = status === 'rejected';
  const isAccepted = status === 'accepted' || status === 'published';
  const isRevision = status === 'revision_requested';
  
  const submittedDate = submission.submittedAt ? format(new Date(submission.submittedAt), 'MMM d, yyyy') : null;
  const assignedDate = submission.assignedAt ? format(new Date(submission.assignedAt), 'MMM d, yyyy') : (['under_review', 'revision_requested', 'accepted', 'rejected', 'published'].includes(status) && submission.submittedAt ? format(new Date(new Date(submission.submittedAt).getTime() + 86400000), 'MMM d, yyyy') : null);
  const reviewedDate = submission.updatedAt && ['revision_requested', 'accepted', 'rejected', 'published'].includes(status) ? format(new Date(submission.updatedAt), 'MMM d, yyyy') : null;

  const steps = [
    { id: 'submitted', label: 'Submitted', date: submittedDate },
    { id: 'under_review', label: 'Under Review', date: assignedDate },
    { id: 'final', label: isRejected ? 'Rejected' : isRevision ? 'Revision Req.' : 'Accepted', date: reviewedDate }
  ];

  let currentStepIndex = 0;
  if (['submitted'].includes(status)) currentStepIndex = 0;
  else if (['under_review', 'decision_pending'].includes(status)) currentStepIndex = 1;
  else if (['accepted', 'rejected', 'revision_requested', 'published'].includes(status)) currentStepIndex = 2;

  return (
    <div className="w-full py-4 pb-8 max-w-2xl mx-auto">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -mt-[1px] w-full h-1 bg-border rounded-full"></div>
        <div 
          className={`absolute left-0 top-1/2 -mt-[1px] h-1 rounded-full transition-all duration-500 ease-in-out ${isRejected && currentStepIndex === 2 ? 'bg-red-500' : isRevision && currentStepIndex === 2 ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isFinalRejected = isRejected && index === 2;
          const isFinalRevision = isRevision && index === 2;
          
          let stepColorClass = 'border-border bg-card';
          if (isCompleted) stepColorClass = 'border-primary bg-primary';
          else if (isCurrent) {
            if (isFinalRejected) stepColorClass = 'border-red-500 bg-card';
            else if (isFinalRevision) stepColorClass = 'border-amber-500 bg-card';
            else stepColorClass = 'border-primary bg-card';
          }

          return (
            <div key={step.id} className="relative flex flex-col items-center justify-center">
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center border-2 z-10 transition-colors duration-300 ${stepColorClass}`}
              >
                {isCompleted ? (
                   <Check className="w-3 h-3 text-primary-foreground" />
                ) : isCurrent ? (
                   <div className={`w-2 h-2 rounded-full ${isFinalRejected ? 'bg-red-500' : isFinalRevision ? 'bg-amber-500' : 'bg-primary'}`}></div>
                ) : null}
              </div>
              <div className={`mt-2 text-[10px] sm:text-xs font-medium text-center absolute top-full w-28 -ml-14 left-1/2 ${isCompleted || isCurrent ? (isFinalRejected ? 'text-red-600 dark:text-red-400' : isFinalRevision ? 'text-amber-600 dark:text-amber-400' : 'text-foreground') : 'text-muted-foreground'}`}>
                <div className="mb-0.5">{step.label}</div>
                {step.date && (
                   <div className={`text-[9px] sm:text-[10px] font-normal tabular-nums ${isFinalRejected || isFinalRevision ? 'opacity-80' : 'text-muted-foreground'}`}>{step.date}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, isDemoMode } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [availableReviewers, setAvailableReviewers] = useState<any[]>([]);
  const [isAssignReviewerOpen, setIsAssignReviewerOpen] = useState(false);
  const [submissionToAssign, setSubmissionToAssign] = useState<any | null>(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  const [userSortField, setUserSortField] = useState<'displayName' | 'role'>('displayName');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedUsersList = [...usersList].sort((a, b) => {
    const valA = (a[userSortField] || '').toLowerCase();
    const valB = (b[userSortField] || '').toLowerCase();
    if (valA < valB) return userSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return userSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleUserSort = (field: 'displayName' | 'role') => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDirection('asc');
    }
  };
  
  const [isSpecialtiesModalOpen, setIsSpecialtiesModalOpen] = useState(false);
  const [selectedUserForSpecialties, setSelectedUserForSpecialties] = useState<any | null>(null);
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [isUpdatingSpecialties, setIsUpdatingSpecialties] = useState(false);

  const handleOpenSpecialties = (u: any) => {
    setSelectedUserForSpecialties(u);
    setSpecialtiesInput(u.specialties?.join(', ') || '');
    setIsSpecialtiesModalOpen(true);
  };

  const handleSaveSpecialties = async () => {
    if (!selectedUserForSpecialties) return;
    setIsUpdatingSpecialties(true);
    try {
      const specialtiesArray = specialtiesInput.split(',').map(s => s.trim()).filter(s => s);
      await updateDoc(doc(db, 'users', selectedUserForSpecialties.uid), {
        specialties: specialtiesArray
      });
      setUsersList(prev => prev.map(u => u.uid === selectedUserForSpecialties.uid ? { ...u, specialties: specialtiesArray } : u));
      toast.success('Specialties updated successfully');
      setIsSpecialtiesModalOpen(false);
    } catch (error) {
      toast.error('Failed to update specialties');
    } finally {
      setIsUpdatingSpecialties(false);
    }
  };

  const [flaggedCOI, setFlaggedCOI] = useState<Record<string, string[]>>({});


  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<any | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewTemplates, setReviewTemplates] = useState<{id: string, name: string, content: string}[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isTemplatePopoverOpen, setIsTemplatePopoverOpen] = useState(false);
  const [reviewRecommendation, setReviewRecommendation] = useState('');
  const [rubricScores, setRubricScores] = useState({
    methodology: '',
    originality: '',
    clarity: '',
    relevance: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<'submission' | 'direct' | 'edit'>('submission');
  const [submissionToPublish, setSubmissionToPublish] = useState<any | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishAbstract, setPublishAbstract] = useState('');
  const [publishAuthors, setPublishAuthors] = useState('');
  const [publishSpecialty, setPublishSpecialty] = useState('General Medicine');
  const [publishKeywords, setPublishKeywords] = useState('');
  const [publishPdfUrl, setPublishPdfUrl] = useState('');
  const [publishVolume, setPublishVolume] = useState('46');
  const [publishIssue, setPublishIssue] = useState('2');
  const [publishDoi, setPublishDoi] = useState('');
  const [publishAccessType, setPublishAccessType] = useState<'open_access' | 'subscription'>('open_access');
  const [publishArticleType, setPublishArticleType] = useState<ArticleCategoryType>('Original Investigation');
  const [publishFeaturedPlacement, setPublishFeaturedPlacement] = useState<FeaturedPlacementType>('standard');
  const [publishReadTime, setPublishReadTime] = useState('8 min read');
  const [publishCmeEligible, setPublishCmeEligible] = useState(false);
  const [catalogFilterAccess, setCatalogFilterAccess] = useState<'all' | 'open_access' | 'subscription'>('all');
  const [catalogFilterCategory, setCatalogFilterCategory] = useState<string>('all');
  const [isPublishing, setIsPublishing] = useState(false);
  const [retractArticleId, setRetractArticleId] = useState<string | null>(null);
  const [isRetracting, setIsRetracting] = useState(false);

  // Subscription management state
  const [isManageSubModalOpen, setIsManageSubModalOpen] = useState(false);
  const [subscriberToManage, setSubscriberToManage] = useState<any | null>(null);
  const [manageSubPlan, setManageSubPlan] = useState('');
  const [manageSubStatus, setManageSubStatus] = useState('');
  const [isUpdatingSub, setIsUpdatingSub] = useState(false);
  const [bookmarkedArticlesList, setBookmarkedArticlesList] = useState<any[]>([]);
  const [registeredEventsList, setRegisteredEventsList] = useState<any[]>([]);

  // Event Ticket handling state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleViewTicket = (evt: any) => {
    setSelectedTicket(evt);
    setIsTicketModalOpen(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'event_ticket') {
        toast.success(`Ticket Validated! Attendee ID: ${data.userId} for Event ID: ${data.eventId}`);
      } else {
        toast.error("Invalid ticket");
      }
    } catch (e) {
      toast.error("Invalid QR Code FORMAT");
    }
  };
  const [isEditorialFeedbackOpen, setIsEditorialFeedbackOpen] = useState(false);
  const [feedbackSubmission, setFeedbackSubmission] = useState<any | null>(null);
  const [editorialFeedback, setEditorialFeedback] = useState('');
  const [editorialDecision, setEditorialDecision] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [reviewerSearchQuery, setReviewerSearchQuery] = useState('');
  
  const [isPlagiarismModalOpen, setIsPlagiarismModalOpen] = useState(false);
  const [plagiarismSubmission, setPlagiarismSubmission] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [plagiarismResult, setPlagiarismResult] = useState<any | null>(null);
  
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [discussionSubmission, setDiscussionSubmission] = useState<any | null>(null);
  const [newDiscussionComment, setNewDiscussionComment] = useState('');
  
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveySubmission, setSurveySubmission] = useState<any | null>(null);
  const [surveyRating, setSurveyRating] = useState<number>(0);
  const [surveyFeedback, setSurveyFeedback] = useState('');
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  
  const [newsEvents, setNewsEvents] = useState<any[]>([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventType, setNewEventType] = useState('Conference');
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const isStaff = profile?.role === 'admin' || profile?.role === 'editor';
  const isEditorBoard = profile?.role === 'editor' || profile?.role === 'admin';
  const isReviewer = profile?.role === 'reviewer' || isStaff;
  const isAuthor = profile?.role === 'author' || isStaff;
  const isReader = ['subscribed_reader', 'unsubscribed_reader', 'institutional'].includes(profile?.role || '');

  // Mock data for article views and downloads per month
  const analyticsDataMonthByMonth = [
    { name: 'May', views: 3400, downloads: 1200 },
    { name: 'Jun', views: 4000, downloads: 1500 },
    { name: 'Jul', views: 4200, downloads: 1800 },
    { name: 'Aug', views: 3800, downloads: 1600 },
    { name: 'Sep', views: 5100, downloads: 2400 },
    { name: 'Oct', views: 6300, downloads: 2800 },
    { name: 'Nov', views: 5800, downloads: 2600 },
    { name: 'Dec', views: 4900, downloads: 2100 },
    { name: 'Jan', views: 5500, downloads: 2700 },
    { name: 'Feb', views: 6800, downloads: 3200 },
    { name: 'Mar', views: 7200, downloads: 3900 },
    { name: 'Apr', views: 8100, downloads: 4400 },
  ];

  // Mock data for author acceptance history and citations
  const authorHistoryData = [
    { year: '2021', acceptanceRate: 65, citations: 12 },
    { year: '2022', acceptanceRate: 70, citations: 28 },
    { year: '2023', acceptanceRate: 68, citations: 45 },
    { year: '2024', acceptanceRate: 75, citations: 76 },
    { year: '2025', acceptanceRate: 82, citations: 110 },
    { year: '2026', acceptanceRate: 85, citations: 145 },
  ];

  const editorAnalyticsSubmissions = [
    { name: 'Jan', received: 42, published: 12, rejected: 15 },
    { name: 'Feb', received: 58, published: 18, rejected: 25 },
    { name: 'Mar', received: 65, published: 20, rejected: 22 },
    { name: 'Apr', received: 70, published: 25, rejected: 30 },
    { name: 'May', received: 60, published: 22, rejected: 28 },
    { name: 'Jun', received: 45, published: 15, rejected: 20 },
  ];

  const editorAnalyticsReviewTime = [
    { name: 'Jan', 'Average Days': 55 },
    { name: 'Feb', 'Average Days': 52 },
    { name: 'Mar', 'Average Days': 48 },
    { name: 'Apr', 'Average Days': 45 },
    { name: 'May', 'Average Days': 38 },
    { name: 'Jun', 'Average Days': 34 },
  ];

  const topReviewersData = [
    { id: '1', name: 'Dr. Sarah Nabirye', specialty: 'Infectious Diseases', completed: 14, avgTurnaround: 18, rating: 4.8 },
    { id: '2', name: 'Prof. Joseph Mukasa', specialty: 'Public Health', completed: 12, avgTurnaround: 22, rating: 4.6 },
    { id: '3', name: 'Dr. Emily Chen', specialty: 'Cardiology', completed: 11, avgTurnaround: 15, rating: 4.9 },
    { id: '4', name: 'Dr. Robert Kigongo', specialty: 'Pediatrics', completed: 9, avgTurnaround: 25, rating: 4.5 },
    { id: '5', name: 'Dr. Alice Ocen', specialty: 'Surgery', completed: 8, avgTurnaround: 21, rating: 4.7 },
  ];

  useEffect(() => {
    const savedTemplates = localStorage.getItem('umaj_review_templates');
    if (savedTemplates) {
      try {
        setReviewTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Failed to parse review templates", e);
      }
    }
  }, []);

  const saveReviewTemplate = () => {
    if (!newTemplateName.trim() || !reviewComments.trim()) {
      toast.error('Please enter a template name and ensure comments are not empty');
      return;
    }
    const newTemplate = { id: Date.now().toString(), name: newTemplateName.trim(), content: reviewComments };
    const updatedTemplates = [...reviewTemplates, newTemplate];
    setReviewTemplates(updatedTemplates);
    localStorage.setItem('umaj_review_templates', JSON.stringify(updatedTemplates));
    setNewTemplateName('');
    setIsTemplatePopoverOpen(false);
    toast.success('Template saved successfully');
  };

  const loadReviewTemplate = (content: string) => {
    setReviewComments(content);
    toast.info('Template loaded into comments');
  };
  
  const deleteReviewTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTemplates = reviewTemplates.filter(t => t.id !== id);
    setReviewTemplates(updatedTemplates);
    localStorage.setItem('umaj_review_templates', JSON.stringify(updatedTemplates));
    toast.success('Template deleted');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !profile) return;

      setDataLoading(true);
      
      if (isDemoMode) {
        // Load mock data for demo mode
        setTimeout(() => {
          if (isAuthor || isStaff) {
            setSubmissions([
              {
                id: 'sub-1',
                title: 'The Impact of AI on Modern Healthcare',
                status: 'under_review',
                submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                authorUid: user.uid,
                abstract: 'This paper explores the transformative effects of artificial intelligence in clinical settings, focusing on diagnostic accuracy and patient outcomes.',
              },
              {
                id: 'sub-2',
                title: 'Quantum Computing: A Review of Current Algorithms',
                status: 'revision_requested',
                submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                authorUid: user.uid,
                abstract: 'A comprehensive review of quantum algorithms, highlighting their potential advantages over classical counterparts in specific computational domains.',
                editorFeedback: 'The reviewers found your paper interesting, but it requires major revisions. Please address the comments regarding the scalability of the proposed algorithms and provide more concrete examples in section 3.',
              },
              {
                id: 'sub-3',
                title: 'Climate Change Mitigation Strategies in Urban Environments',
                status: 'accepted',
                submittedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
                authorUid: 'other-author',
              }
            ]);
            
            // Mock published articles for the author
            setPublishedArticles([
              {
                id: 'pub-1',
                title: 'A Comprehensive Study on Malaria Prevention',
                abstract: 'This study explores various prevention methods...',
                authorUid: user.uid,
                authors: [profile.displayName || 'Jane Doe'],
                volume: '45',
                issue: '3',
                doi: '10.1234/umaj.2023.45.3',
                publishedAt: new Date(Date.now() - 86400000 * 100).toISOString(),
                views: 1245,
                downloads: 340,
                citations: 12
              },
              {
                id: 'pub-2',
                title: 'Healthcare Infrastructure in Rural Communities',
                abstract: 'Analyzing the challenges and opportunities...',
                authorUid: user.uid,
                authors: [profile.displayName || 'Jane Doe', 'John Smith'],
                volume: '44',
                issue: '1',
                doi: '10.1234/umaj.2022.44.1',
                publishedAt: new Date(Date.now() - 86400000 * 400).toISOString(),
                views: 3502,
                downloads: 890,
                citations: 45
              }
            ]);
          }
          if (isReviewer || isStaff) {
            setReviews([
              {
                id: 'rev-1',
                submissionId: 'sub-1',
                reviewerUid: user.uid,
                status: 'pending',
                invitationStatus: 'pending',
                assignedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
              },
              {
                id: 'rev-2',
                submissionId: 'sub-4',
                reviewerUid: user.uid,
                status: 'completed',
                invitationStatus: 'accepted',
                assignedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
                completedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
                recommendation: 'minor_revision'
              }
            ]);
          }
          if (isStaff) {
            setAvailableReviewers([
              { uid: 'rev-user-1', displayName: 'Dr. Jane Smith', email: 'jane@example.com', specialties: ['AI', 'Machine Learning'], publications: ['Deep Learning for Medical Diagnosis', 'Neural Networks in Bioinformatics'] },
              { uid: 'rev-user-2', displayName: 'Prof. Alan Turing', email: 'alan@example.com', specialties: ['Computer Science', 'Cryptography'], publications: ['Computing Machinery and Intelligence', 'On Computable Numbers'] },
              { uid: 'rev-user-3', displayName: 'Dr. Grace Hopper', email: 'grace@example.com', specialties: ['Software Engineering', 'Compilers'], publications: ['The Education of a Computer', 'A Manual of Operation for the Automatic Sequence Controlled Calculator'] },
              { uid: 'rev-user-4', displayName: 'Dr. John Doe', email: 'john@example.com', specialties: ['Dermatology', 'Oncology'], publications: ['Melanoma Detection using CNNs', 'Skin Cancer and AI'] }
            ]);
            setSubscribers([
              { uid: 'sub-user-1', displayName: 'Dr. Alice Johnson', email: 'alice@example.com', subscriptionPlan: 'Individual', subscriptionDate: new Date(Date.now() - 86400000 * 30).toISOString(), role: 'subscribed_reader' },
              { uid: 'sub-user-2', displayName: 'Makerere University Library', email: 'library@mak.ac.ug', subscriptionPlan: 'Institutional', subscriptionDate: new Date(Date.now() - 86400000 * 120).toISOString(), role: 'institutional' },
              { uid: 'sub-user-3', displayName: 'Dr. Robert Kintu', email: 'robert.k@example.com', subscriptionPlan: 'Individual', subscriptionDate: new Date(Date.now() - 86400000 * 400).toISOString(), role: 'unsubscribed_reader' }
            ]);
            setUsersList([
              { uid: user.uid, displayName: profile.displayName || 'Admin User', email: profile.email || 'admin@example.com', role: profile.role || 'admin' },
              { uid: 'user-2', displayName: 'Dr. Jane Smith', email: 'jane@example.com', role: 'reviewer' },
              { uid: 'user-3', displayName: 'John Doe', email: 'john@example.com', role: 'author' },
              { uid: 'user-4', displayName: 'Alice Johnson', email: 'alice@example.com', role: 'subscribed_reader' },
            ]);
            setNewsEvents([
                { id: '1', title: 'Annual Uganda Medical Association Scientific Conference', date: 'August 12 - 14, 2026', location: 'Kampala Serena Hotel, Kampala', type: 'Conference' },
                { id: '2', title: 'East African Health Research Symposium', date: 'September 5 - 7, 2026', location: 'Imperial Resort Beach Hotel, Entebbe', type: 'Symposium' },
                { id: '3', title: 'National Summit on Maternal & Child Health', date: 'October 20 - 21, 2026', location: 'Mbarara University of Science and Technology', type: 'Summit' },
            ]);
          }
          if (profile?.bookmarkedArticles && profile.bookmarkedArticles.length > 0) {
            setBookmarkedArticlesList([
              {
                id: profile.bookmarkedArticles[0],
                title: 'Advances in Tropical Medicine',
                authors: ['Dr. Samuel Mukasa', 'Dr. Sarah Kizza'],
                abstract: 'A comprehensive review of recent developments...',
                volume: '44',
                issue: '2',
                doi: '10.1234/umaj.2023.44.2',
                publishedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
              }
            ]);
          }
          setDataLoading(false);
        }, 500);
        return;
      }

      try {
        // Fetch Author Submissions
        if (isAuthor) {
          const subQuery = query(
            collection(db, 'submissions'),
            where('authorUid', '==', user.uid)
          );
          const subSnap = await getDocs(subQuery);
          const subs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort manually since we can't easily compound query without index
          subs.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setSubmissions(subs);

          if (!isStaff) {
            const authorArticlesQuery = query(
              collection(db, 'articles'),
              where('authorUid', '==', user.uid)
            );
            const authorArticlesSnap = await getDocs(authorArticlesQuery);
            setPublishedArticles(authorArticlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
        }

        // Fetch Reviewer Assignments
        if (isReviewer) {
          const revQuery = query(
            collection(db, 'reviews'),
            where('reviewerUid', '==', user.uid)
          );
          const revSnap = await getDocs(revQuery);
          setReviews(revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // If Admin/Editor, fetch all pending submissions and available reviewers
        if (isStaff) {
           const adminQuery = query(
            collection(db, 'submissions')
          );
          const adminSnap = await getDocs(adminQuery);
          // Only add if not already in submissions list
          const existingIds = new Set(submissions.map(s => s.id));
          const adminSubs = adminSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(s => !existingIds.has(s.id));
          
          setSubmissions(prev => [...prev, ...adminSubs].sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));

          // Fetch published articles
          const articlesQuery = query(collection(db, 'articles'));
          const articlesSnap = await getDocs(articlesQuery);
          setPublishedArticles(articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Fetch available reviewers
          const reviewersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'reviewer')
          );
          const reviewersSnap = await getDocs(reviewersQuery);
          setAvailableReviewers(reviewersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));

          // Fetch subscribers
          const subscribersQuery = query(
            collection(db, 'users'),
            where('subscriptionPlan', '!=', null)
          );
          const subscribersSnap = await getDocs(subscribersQuery);
          setSubscribers(subscribersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));

          // Fetch all users for role management
          const usersQuery = query(collection(db, 'users'));
          const usersSnap = await getDocs(usersQuery);
          setUsersList(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
          
          // Fetch events
          const eventsQuery = query(collection(db, 'events'));
          const eventsSnap = await getDocs(eventsQuery);
          setNewsEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // Fetch bookmarked articles
        if (profile?.bookmarkedArticles && profile.bookmarkedArticles.length > 0) {
          const promises = profile.bookmarkedArticles.map(async (id) => {
            const articleSnap = await getDoc(doc(db, 'articles', id));
            return articleSnap.exists() ? { id: articleSnap.id, ...articleSnap.data() } : null;
          });
          const bookmarkedData = (await Promise.all(promises)).filter(Boolean);
          setBookmarkedArticlesList(bookmarkedData);
        }

        // Fetch registered events
        if (profile?.registeredEvents && profile.registeredEvents.length > 0) {
          const promises = profile.registeredEvents.map(async (id) => {
            const eventSnap = await getDoc(doc(db, 'events', id));
            return eventSnap.exists() ? { id: eventSnap.id, ...eventSnap.data() } : null;
          });
          const rsvpData = (await Promise.all(promises)).filter(Boolean);
          setRegisteredEventsList(rsvpData);
        }

      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setDataLoading(false);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [user, profile, loading, isAuthor, isReviewer, isStaff, isDemoMode]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div></div>;
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  const handleToggleCOI = (e: React.MouseEvent, reviewerId: string) => {
    e.stopPropagation();
    if (!submissionToAssign) return;
    
    setFlaggedCOI(prev => {
      const currentFlags = prev[submissionToAssign.id] || [];
      const isAlreadyFlagged = currentFlags.includes(reviewerId);
      
      const newFlags = isAlreadyFlagged 
        ? currentFlags.filter(id => id !== reviewerId)
        : [...currentFlags, reviewerId];
        
      if (!isAlreadyFlagged && selectedReviewerId === reviewerId) {
        setSelectedReviewerId(''); // Deselect if flagging an already selected reviewer
      }
      
      if (!isAlreadyFlagged) {
        toast.info("Reviewer flagged for potential conflict of interest");
      }
      
      return {
        ...prev,
        [submissionToAssign.id]: newFlags
      };
    });
  };

  const handleAssignReviewer = async () => {
    if (!submissionToAssign || !selectedReviewerId) return;

    setIsAssigning(true);
    try {
      if (isDemoMode) {
        // Mock assignment
        setTimeout(() => {
          setIsAssigning(false);
          setIsAssignReviewerOpen(false);
          setSubmissionToAssign(null);
          setSelectedReviewerId('');
          // Update submission status locally
          setSubmissions(prev => prev.map(s => s.id === submissionToAssign.id ? { ...s, status: 'under_review' } : s));
          toast.success('Reviewer assigned successfully (Demo)');
        }, 500);
        return;
      }

      const reviewId = `${submissionToAssign.id}_${selectedReviewerId}`;
      const newReview = {
        id: reviewId,
        submissionId: submissionToAssign.id,
        reviewerUid: selectedReviewerId,
        status: 'pending',
        invitationStatus: 'pending',
        assignedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'reviews', reviewId), newReview);
      
      // Update submission status to under_review
      await updateDoc(doc(db, 'submissions', submissionToAssign.id), {
        status: 'under_review',
        updatedAt: new Date().toISOString()
      });

      // Send a notification to the reviewer
      const notificationId = crypto.randomUUID();
      const notification = {
        id: notificationId,
        userId: selectedReviewerId,
        title: "New Manuscript Assignment",
        message: `You have been assigned to review the manuscript: "${submissionToAssign.title.substring(0, 50)}...". Please visit your dashboard to accept or decline.`,
        read: false,
        createdAt: new Date().toISOString(),
        link: '/dashboard',
      };
      await setDoc(doc(db, 'notifications', notificationId), notification);

      // Update local state
      setSubmissions(prev => prev.map(s => s.id === submissionToAssign.id ? { ...s, status: 'under_review' } : s));
      
      setIsAssignReviewerOpen(false);
      setSubmissionToAssign(null);
      setSelectedReviewerId('');
      toast.success('Reviewer assigned successfully');
    } catch (error) {
      console.error("Error assigning reviewer", error);
      toast.error('Failed to assign reviewer. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate.trim() || !newEventLocation.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSavingEvent(true);
    try {
      if (isDemoMode) {
        setTimeout(() => {
          const newEvent = {
            id: `event-${Date.now()}`,
            title: newEventTitle,
            date: newEventDate,
            location: newEventLocation,
            type: newEventType,
          };
          setNewsEvents(prev => [...prev, newEvent]);
          setIsSavingEvent(false);
          setIsAddEventModalOpen(false);
          setNewEventTitle('');
          setNewEventDate('');
          setNewEventLocation('');
          setNewEventType('Conference');
          toast.success('Event added successfully (Demo Mode)');
        }, 500);
        return;
      }

      const newEventRef = doc(collection(db, 'events'));
      const eventData = {
        title: newEventTitle,
        date: newEventDate,
        location: newEventLocation,
        type: newEventType,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(newEventRef, eventData);
      
      setNewsEvents(prev => [...prev, { id: newEventRef.id, ...eventData }]);
      setIsAddEventModalOpen(false);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventLocation('');
      setNewEventType('Conference');
      toast.success('Event published successfully');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    } finally {
      if (!isDemoMode) setIsSavingEvent(false);
    }
  };

  const handleRoleChange = async (targetUid: string, newRole: string) => {
    setIsUpdatingRole(targetUid);
    try {
      if (isDemoMode) {
        setTimeout(() => {
          setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
          setIsUpdatingRole(null);
          toast.success('Role updated successfully (Demo Mode)');
        }, 500);
        return;
      }

      await updateDoc(doc(db, 'users', targetUid), { role: newRole });
      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      if (!isDemoMode) setIsUpdatingRole(null);
    }
  };

  const handleSubmitEditorialFeedback = async () => {
    if (!editorialDecision) {
      toast.error('Please select an editorial decision');
      return;
    }
    if (!editorialFeedback.trim()) {
      toast.error('Please provide editorial feedback');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      if (isDemoMode) {
        setTimeout(() => {
          setSubmissions(prev => prev.map(s => s.id === feedbackSubmission.id ? {
            ...s,
            status: editorialDecision === 'accept' ? 'accepted' : editorialDecision === 'reject' ? 'rejected' : 'revision_requested',
            editorFeedback: editorialFeedback,
            updatedAt: new Date().toISOString()
          } : s));
          setIsEditorialFeedbackOpen(false);
          setEditorialFeedback('');
          setEditorialDecision('');
          toast.success('Editorial feedback submitted successfully (Demo Mode)');
          setIsSubmittingFeedback(false);
        }, 500);
        return;
      }

      await updateDoc(doc(db, 'submissions', feedbackSubmission.id), {
        status: editorialDecision === 'accept' ? 'accepted' : editorialDecision === 'reject' ? 'rejected' : 'revision_requested',
        editorFeedback: editorialFeedback,
        updatedAt: new Date().toISOString()
      });

      setSubmissions(prev => prev.map(s => s.id === feedbackSubmission.id ? {
        ...s,
        status: editorialDecision === 'accept' ? 'accepted' : editorialDecision === 'reject' ? 'rejected' : 'revision_requested',
        editorFeedback: editorialFeedback,
        updatedAt: new Date().toISOString()
      } : s));

      setIsEditorialFeedbackOpen(false);
      setEditorialFeedback('');
      setEditorialDecision('');
      toast.success('Editorial feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      if (!isDemoMode) setIsSubmittingFeedback(false);
    }
  };

  const handleOpenReviewModal = (review: any) => {
    setActiveReview(review);
    setReviewComments(review.comments || '');
    setReviewRecommendation(review.recommendation || '');
    setRubricScores(review.rubricScores || {
      methodology: '',
      originality: '',
      clarity: '',
      relevance: ''
    });
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewRecommendation) {
      toast.error('Please select a recommendation');
      return;
    }
    if (!rubricScores.methodology || !rubricScores.originality || !rubricScores.clarity || !rubricScores.relevance) {
      toast.error('Please complete all rubric scores');
      return;
    }
    if (!reviewComments.trim()) {
      toast.error('Please provide comments');
      return;
    }

    setIsSubmittingReview(true);
    try {
      if (isDemoMode) {
        setTimeout(() => {
          setReviews(prev => prev.map(r => r.id === activeReview.id ? {
            ...r,
            status: 'completed',
            recommendation: reviewRecommendation,
            rubricScores: rubricScores,
            comments: reviewComments,
            completedAt: new Date().toISOString()
          } : r));
          setIsReviewModalOpen(false);
          toast.success('Review submitted successfully (Demo Mode)');
          setIsSubmittingReview(false);
        }, 500);
        return;
      }

      await updateDoc(doc(db, 'reviews', activeReview.id), {
        status: 'completed',
        recommendation: reviewRecommendation,
        rubricScores: rubricScores,
        comments: reviewComments,
        completedAt: new Date().toISOString()
      });

      setReviews(prev => prev.map(r => r.id === activeReview.id ? {
        ...r,
        status: 'completed',
        recommendation: reviewRecommendation,
        rubricScores: rubricScores,
        comments: reviewComments,
        completedAt: new Date().toISOString()
      } : r));
      
      setIsReviewModalOpen(false);
      toast.success('Review submitted successfully');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      if (!isDemoMode) setIsSubmittingReview(false);
    }
  };

  const handleAcceptReview = async (reviewId: string) => {
    try {
      if (isDemoMode) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, invitationStatus: 'accepted' } : r));
        toast.success("Review assignment accepted");
        return;
      }
      await updateDoc(doc(db, 'reviews', reviewId), {
        invitationStatus: 'accepted',
        updatedAt: new Date().toISOString()
      });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, invitationStatus: 'accepted' } : r));
      toast.success("Review assignment accepted");
    } catch (error) {
      console.error("Error accepting review:", error);
      toast.error("Failed to accept review assignment");
    }
  };

  const handleDeclineReview = async (reviewId: string) => {
    try {
      if (isDemoMode) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, invitationStatus: 'declined' } : r));
        toast.success("Review assignment declined");
        return;
      }
      await updateDoc(doc(db, 'reviews', reviewId), {
        invitationStatus: 'declined',
        updatedAt: new Date().toISOString()
      });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, invitationStatus: 'declined' } : r));
      toast.success("Review assignment declined");
    } catch (error) {
      console.error("Error declining review:", error);
      toast.error("Failed to decline review assignment");
    }
  };

  const handleOpenPlagiarismModal = (submission: any) => {
    setPlagiarismSubmission(submission);
    setPlagiarismResult(submission.plagiarismReport || null);
    setIsPlagiarismModalOpen(true);
    setScanProgress(0);
  };

  const handleRunPlagiarismCheck = () => {
    setIsScanning(true);
    setScanProgress(0);
    setPlagiarismResult(null);
    
    // Simulate scan progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Provide mock result
    setTimeout(() => {
      clearInterval(interval);
      setIsScanning(false);
      setScanProgress(100);
      
      const newScore = Math.floor(Math.random() * 15) + 2; // Score between 2 and 16
      
      const result = {
        score: newScore,
        status: newScore > 15 ? 'warning' : 'clear',
        lastChecked: new Date().toISOString(),
        sources: [
          { name: 'Crossref', match: Math.floor(newScore * 0.5) },
          { name: 'PubMed', match: Math.floor(newScore * 0.3) },
          { name: 'arXiv', match: Math.floor(newScore * 0.2) }
        ]
      };
      
      setPlagiarismResult(result);
      
      // Update submission locally (and DB if needed)
      setSubmissions(prev => prev.map(s => s.id === plagiarismSubmission.id ? {
        ...s,
        plagiarismReport: result
      } : s));
      
      toast.success('Plagiarism check completed. Similarity is acceptable.');
    }, 3000);
  };

  const handleOpenDiscussionModal = (submission: any) => {
    setDiscussionSubmission(submission);
    setIsDiscussionModalOpen(true);
    setNewDiscussionComment('');
  };

  const handlePostDiscussionComment = () => {
    if (!newDiscussionComment.trim()) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      authorName: profile?.displayName || 'Editorial User',
      authorRole: profile?.role || 'editor',
      content: newDiscussionComment,
      timestamp: new Date().toISOString()
    };

    setSubmissions(prev => prev.map(s => {
      if (s.id === discussionSubmission.id) {
        const updatedDiscussions = [...(s.internalDiscussion || []), newComment];
        return { ...s, internalDiscussion: updatedDiscussions };
      }
      return s;
    }));

    setDiscussionSubmission((prev: any) => ({
      ...prev,
      internalDiscussion: [...(prev.internalDiscussion || []), newComment]
    }));

    setNewDiscussionComment('');
    toast.success('Internal comment posted');
  };

  const handleOpenSurveyModal = (submission: any) => {
    setSurveySubmission(submission);
    setSurveyRating(0);
    setSurveyFeedback('');
    setIsSurveyModalOpen(true);
  };

  const handleSubmitSurvey = () => {
    if (surveyRating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmittingSurvey(true);
    
    setTimeout(() => {
      setSubmissions(prev => prev.map(s => {
        if (s.id === surveySubmission.id) {
          return { ...s, hasCompletedSurvey: true };
        }
        return s;
      }));
      
      setIsSubmittingSurvey(false);
      setIsSurveyModalOpen(false);
      toast.success('Thank you for your feedback!');
    }, 800);
  };

  const resolveAuthorNames = (submission: any) => {
    const matchedUser = usersList.find((u) => u.uid === submission.authorUid);
    const primaryAuthor =
      submission.authorName ||
      matchedUser?.displayName ||
      (submission.authorUid === user?.uid ? profile?.displayName : '') ||
      'Corresponding Author';
    const coAuthorsList = Array.isArray(submission.coAuthors) ? submission.coAuthors.filter(Boolean) : [];
    return [primaryAuthor, ...coAuthorsList].filter((v, idx, arr) => v && arr.indexOf(v) === idx).join(', ');
  };

  const handleOpenPublishModal = (submission: any) => {
    setPublishMode('submission');
    setSubmissionToPublish(submission);
    setEditingArticleId(null);
    setPublishTitle(submission.title || '');
    setPublishAbstract(submission.abstract || '');
    setPublishAuthors(resolveAuthorNames(submission));
    setPublishSpecialty(submission.specialty || 'General Medicine');
    setPublishKeywords(Array.isArray(submission.keywords) ? submission.keywords.join(', ') : '');
    const rawUrl = submission.fileUrl || '';
    const validHttpUrl = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `https://umaj.ug/articles/${submission.id}.pdf`;
    setPublishPdfUrl(validHttpUrl);
    setPublishVolume('46');
    setPublishIssue('2');
    setPublishDoi(`10.1234/umaj.${new Date().getFullYear()}.46.2.${submission.id.substring(0, 6)}`);
    setPublishAccessType(submission.isOpenAccess === false ? 'subscription' : 'open_access');
    setPublishArticleType((submission.articleType as ArticleCategoryType) || 'Original Investigation');
    setPublishFeaturedPlacement((submission.featuredPlacement as FeaturedPlacementType) || 'standard');
    setPublishReadTime(submission.readTime || '8 min read');
    setPublishCmeEligible(Boolean(submission.cmeEligible));
    setIsPublishModalOpen(true);
  };

  const handleOpenDirectPublishModal = () => {
    const year = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setPublishMode('direct');
    setSubmissionToPublish(null);
    setEditingArticleId(null);
    setPublishTitle('');
    setPublishAbstract('');
    setPublishAuthors(profile?.displayName || '');
    setPublishSpecialty('General Medicine');
    setPublishKeywords('');
    setPublishPdfUrl(`https://umaj.ug/articles/${year}-${randomSuffix.toLowerCase()}.pdf`);
    setPublishVolume('46');
    setPublishIssue('2');
    setPublishDoi(`10.1234/umaj.${year}.46.2.${randomSuffix}`);
    setPublishAccessType('open_access');
    setPublishArticleType('Original Investigation');
    setPublishFeaturedPlacement('standard');
    setPublishReadTime('8 min read');
    setPublishCmeEligible(false);
    setIsPublishModalOpen(true);
  };

  const handleOpenEditArticleModal = (article: any) => {
    setPublishMode('edit');
    setSubmissionToPublish(null);
    setEditingArticleId(article.id);
    setPublishTitle(article.title || '');
    setPublishAbstract(article.abstract || '');
    setPublishAuthors(Array.isArray(article.authors) ? article.authors.join(', ') : '');
    setPublishSpecialty(article.specialty || 'General Medicine');
    setPublishKeywords(Array.isArray(article.keywords) ? article.keywords.join(', ') : '');
    setPublishPdfUrl(article.pdfUrl || `https://umaj.ug/articles/${article.id}.pdf`);
    setPublishVolume(String(article.volume || '46'));
    setPublishIssue(String(article.issue || '2'));
    setPublishDoi(article.doi || '');
    setPublishAccessType(article.isOpenAccess === false ? 'subscription' : 'open_access');
    setPublishArticleType((article.articleType as ArticleCategoryType) || 'Original Investigation');
    setPublishFeaturedPlacement((article.featuredPlacement as FeaturedPlacementType) || 'standard');
    setPublishReadTime(article.readTime || '8 min read');
    setPublishCmeEligible(Boolean(article.cmeEligible));
    setIsPublishModalOpen(true);
  };

  const handlePublishArticle = async () => {
    const volNum = parseInt(publishVolume, 10);
    const issNum = parseInt(publishIssue, 10);
    const authorsList = publishAuthors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    const keywordsList = publishKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 20);
    const normalizedPdfUrl = publishPdfUrl.trim();

    if (!publishTitle.trim() || !publishAbstract.trim() || authorsList.length === 0 || isNaN(volNum) || volNum <= 0 || isNaN(issNum) || issNum <= 0) {
      toast.error('Please fill in title, authors, abstract, volume, and issue');
      return;
    }

    if (!/^https?:\/\/.+/i.test(normalizedPdfUrl)) {
      toast.error('PDF URL must start with https:// or http://');
      return;
    }

    const articleId =
      publishMode === 'edit' && editingArticleId
        ? editingArticleId
        : publishMode === 'submission' && submissionToPublish
        ? submissionToPublish.id
        : `art-${Date.now()}`;

    const existingArticle =
      publishMode === 'edit'
        ? publishedArticles.find((a) => a.id === articleId)
        : undefined;

    const articlePayload = {
      id: articleId,
      title: publishTitle.trim().slice(0, 490),
      abstract: publishAbstract.trim().slice(0, 4900),
      authors: authorsList.slice(0, 50),
      keywords: keywordsList,
      pdfUrl: normalizedPdfUrl,
      doi: publishDoi.trim().slice(0, 95) || `10.1234/umaj.${new Date().getFullYear()}.${volNum}.${issNum}`,
      volume: volNum,
      issue: issNum,
      publishedAt: existingArticle?.publishedAt || new Date().toISOString(),
      views: existingArticle?.views ?? 0,
      downloads: existingArticle?.downloads ?? 0,
      citations: existingArticle?.citations ?? 0,
      specialty: publishSpecialty || 'General Medicine',
      isOpenAccess: publishAccessType === 'open_access',
      articleType: publishArticleType || 'Original Investigation',
      featuredPlacement: publishFeaturedPlacement || 'standard',
      cmeEligible: publishCmeEligible,
      readTime: publishReadTime || '8 min read',
    };

    setIsPublishing(true);
    try {
      if (isDemoMode) {
        setTimeout(() => {
          if (publishMode === 'edit') {
            setPublishedArticles((prev) =>
              prev.map((a) => (a.id === articleId ? { ...a, ...articlePayload } : a))
            );
            toast.success('Published article updated (Demo Mode)');
          } else {
            setPublishedArticles((prev) => [
              articlePayload,
              ...prev.filter((a) => a.id !== articleId),
            ]);
            if (publishMode === 'submission' && submissionToPublish) {
              setSubmissions((prev) =>
                prev.map((s) =>
                  s.id === submissionToPublish.id
                    ? { ...s, status: 'accepted', updatedAt: new Date().toISOString() }
                    : s
                )
              );
            }
            toast.success('Article published to the live journal catalog (Demo Mode)');
          }
          setIsPublishModalOpen(false);
          setIsPublishing(false);
        }, 400);
        return;
      }

      await setDoc(doc(db, 'articles', articleId), articlePayload, {
        merge: publishMode === 'edit',
      });

      if (publishMode === 'submission' && submissionToPublish) {
        if (submissionToPublish.status !== 'accepted') {
          await updateDoc(doc(db, 'submissions', submissionToPublish.id), {
            status: 'accepted',
            updatedAt: new Date().toISOString(),
          });
          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === submissionToPublish.id
                ? { ...s, status: 'accepted', updatedAt: new Date().toISOString() }
                : s
            )
          );
        }

        if (submissionToPublish.authorUid) {
          const notifId = `pub-${articleId}-${Date.now()}`;
          setDoc(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: submissionToPublish.authorUid,
            title: 'Manuscript Published',
            message: `Your manuscript "${articlePayload.title}" has been published in Vol ${volNum}, Issue ${issNum}.`,
            read: false,
            createdAt: new Date().toISOString(),
            link: `/articles/${articleId}`,
          }).catch(() => {});
        }
      }

      if (publishMode === 'edit') {
        setPublishedArticles((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, ...articlePayload } : a))
        );
        toast.success('Published article updated successfully');
      } else {
        setPublishedArticles((prev) => [
          articlePayload,
          ...prev.filter((a) => a.id !== articleId),
        ]);
        toast.success('Article published successfully');
      }

      setIsPublishModalOpen(false);
    } catch (error) {
      console.error('Error publishing article:', error);
      toast.error('Failed to publish article');
    } finally {
      if (!isDemoMode) setIsPublishing(false);
    }
  };

  const handleRetractArticle = (articleId: string) => {
    setRetractArticleId(articleId);
  };

  const confirmRetractArticle = async () => {
    if (!retractArticleId) return;
    setIsRetracting(true);
    try {
      if (isDemoMode) {
        setPublishedArticles((prev) => prev.filter((a) => a.id !== retractArticleId));
        toast.success('Article retracted successfully (Demo Mode)');
        setRetractArticleId(null);
        return;
      }

      await deleteDoc(doc(db, 'articles', retractArticleId));
      setPublishedArticles((prev) => prev.filter((a) => a.id !== retractArticleId));
      toast.success('Article retracted successfully');
      setRetractArticleId(null);
    } catch (error) {
      console.error('Error retracting article:', error);
      toast.error('Failed to retract article');
    } finally {
      setIsRetracting(false);
    }
  };

  const handleOpenManageSub = (subscriber: any) => {
    setSubscriberToManage(subscriber);
    setManageSubPlan(subscriber.subscriptionPlan || 'Individual');
    const isExpired = subscriber.role === 'unsubscribed_reader' || 
      (subscriber.subscriptionDate && new Date(subscriber.subscriptionDate).getTime() < Date.now() - 86400000 * 365);
    setManageSubStatus(isExpired ? 'expired' : 'active');
    setIsManageSubModalOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!subscriberToManage) return;
    setIsUpdatingSub(true);

    try {
      const role = manageSubStatus === 'expired' ? 'unsubscribed_reader' : (manageSubPlan === 'Institutional' ? 'institutional' : 'subscribed_reader');
      const subscriptionDate = manageSubStatus === 'active' && (!subscriberToManage.subscriptionDate || new Date(subscriberToManage.subscriptionDate).getTime() < Date.now() - 86400000 * 365) 
         ? new Date().toISOString() 
         : subscriberToManage.subscriptionDate;
         
      const updates = {
        subscriptionPlan: manageSubPlan,
        role: role,
        subscriptionDate: subscriptionDate
      };

      if (isDemoMode) {
        setTimeout(() => {
          setSubscribers(prev => prev.map(s => s.uid === subscriberToManage.uid ? { ...s, ...updates } : s));
          setUsersList(prev => prev.map(u => u.uid === subscriberToManage.uid ? { ...u, role: role } : u));
          setIsManageSubModalOpen(false);
          setIsUpdatingSub(false);
          toast.success('Subscription updated successfully (Demo Mode)');
        }, 500);
        return;
      }

      await updateDoc(doc(db, 'users', subscriberToManage.uid), updates);
      setSubscribers(prev => prev.map(s => s.uid === subscriberToManage.uid ? { ...s, ...updates } : s));
      setUsersList(prev => prev.map(u => u.uid === subscriberToManage.uid ? { ...u, role: role } : u));
      
      setIsManageSubModalOpen(false);
      toast.success('Subscription updated successfully');
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      if (!isDemoMode) setIsUpdatingSub(false);
    }
  };

  const handleCancelReaderSubscription = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to cancel your subscription? Your premium access will be revoked immediately.")) return;

    try {
      if (isDemoMode) {
        toast.success('Subscription cancelled successfully (Demo Mode)');
        window.location.reload();
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        role: 'unsubscribed_reader',
      });
      toast.success('Subscription cancelled successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleCancelRsvp = async (eventId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to cancel your RSVP for this event?")) return;

    try {
      if (isDemoMode) {
        setRegisteredEventsList(prev => prev.filter(e => e.id !== eventId));
        toast.success("RSVP cancelled successfully (Demo Mode)");
        return;
      }
      
      const userRef = doc(db, 'users', user.uid);
      const eventRef = doc(db, 'events', eventId);
      
      await updateDoc(userRef, {
        registeredEvents: arrayRemove(eventId)
      });
      await updateDoc(eventRef, {
        attendees: arrayRemove(user.uid)
      });
      setRegisteredEventsList(prev => prev.filter(e => e.id !== eventId));
      toast.success("RSVP cancelled successfully");
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
      toast.error('Failed to cancel RSVP');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"><Clock className="mr-1 h-3 w-3" /> Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"><Eye className="mr-1 h-3 w-3" /> Under Review</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800"><CheckCircle className="mr-1 h-3 w-3" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      case 'revision_requested':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"><AlertCircle className="mr-1 h-3 w-3" /> Revision Required</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-background min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Editorial & Author Portal
            </p>
            <h1 className="font-editorial text-3xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Welcome back, {profile.displayName}. Role: <span className="font-semibold capitalize text-primary">{profile.role?.replace('_', ' ')}</span></p>
          </div>
        </div>

        <Tabs defaultValue={isReviewer ? 'reviews' : isAuthor ? 'submissions' : 'reader'} className="w-full">
          <TabsList className="mb-6 bg-card border border-border w-full justify-start overflow-x-auto overflow-y-hidden flex-nowrap h-auto py-1.5 px-1 hide-scrollbar">
            {isAuthor && (
              <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            )}
            {isAuthor && (
              <TabsTrigger value="author-analytics">My Analytics</TabsTrigger>
            )}
            {isReviewer && (
              <TabsTrigger value="reviews">My Reviews</TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="admin">Admin Panel</TabsTrigger>
            )}
            {isEditorBoard && (
              <TabsTrigger value="editor-tasks">Editorial Tasks</TabsTrigger>
            )}
            {isEditorBoard && (
              <TabsTrigger value="find-reviewers">Find Reviewers</TabsTrigger>
            )}
            {isEditorBoard && (
              <TabsTrigger value="editor-analytics">Editorial Analytics</TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="admin-subscriptions">Subscriptions</TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="admin-users">Users</TabsTrigger>
            )}
            {isEditorBoard && (
              <TabsTrigger value="news-events">News & Events</TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="admin-analytics">Analytics</TabsTrigger>
            )}
            {isReader && (
              <TabsTrigger value="reader">Reader Access</TabsTrigger>
            )}
            <TabsTrigger value="bookmarks">Saved Articles</TabsTrigger>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
          </TabsList>

          {isAuthor && (
            <TabsContent value="submissions">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border">
                  <CardTitle className="font-editorial text-xl text-foreground">Manuscript Submissions</CardTitle>
                  <CardDescription>Track the status of your submitted research.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {dataLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading submissions...</div>
                  ) : submissions.filter(s => s.authorUid === user.uid).length > 0 ? (
                    <div className="p-4 space-y-4 bg-muted/20">
                      {submissions.filter(s => s.authorUid === user.uid).map((sub) => (
                        <Card key={sub.id} className="border-border shadow-sm transition-shadow hover:shadow-md bg-card">
                          <CardContent className="p-5">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                              <div className="flex-1 space-y-2">
                                <h4 className="font-editorial font-semibold text-foreground text-lg line-clamp-2 leading-snug">{sub.title}</h4>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center tabular-nums"><Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground"/> {format(new Date(sub.submittedAt), 'MMMM d, yyyy')}</span>
                                  <span>·</span>
                                  {getStatusBadge(sub.status)}
                                </div>
                              </div>
                              <div className="flex-shrink-0 pt-1 flex flex-col gap-2">
                                {['published', 'rejected', 'revision_requested'].includes(sub.status) && !sub.hasCompletedSurvey && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenSurveyModal(sub)}
                                    className="w-full lg:w-auto text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Provide Feedback
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedSubmission(sub);
                                    setIsDetailsOpen(true);
                                  }}
                                  className="w-full lg:w-auto"
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-border">
                              <SubmissionProgressTracker submission={sub} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-1">No submissions yet</h3>
                      <p className="text-muted-foreground">You haven't submitted any manuscripts.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAuthor && (
            <TabsContent value="author-analytics">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Published Articles</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
                        {publishedArticles.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Total lifetime publications</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Global Views</CardTitle>
                      <Eye className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
                        {publishedArticles.reduce((acc, curr) => acc + (curr.views || 0), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Across all published works</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Citations</CardTitle>
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
                        {publishedArticles.reduce((acc, curr) => acc + (curr.citations || 0), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Tracked citations via DOI</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-[#0f2d52] to-[#13294b] text-white border-transparent shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-100">Author Rank</CardTitle>
                      <BarChart3 className="h-4 w-4 text-blue-300" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-mono tabular-nums text-white">
                        Top {publishedArticles.length > 0 ? Math.max(5, Math.ceil(100 / publishedArticles.length)) : 100}%
                      </div>
                      <p className="text-xs text-blue-200">Of UMJ contributing authors</p>
                    </CardContent>
                  </Card>
                </div>
                
                {publishedArticles.length > 0 ? (
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="font-editorial text-xl text-foreground">Readership Engagement</CardTitle>
                      <CardDescription>Monthly abstract views vs. full PDF downloads</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analyticsDataMonthByMonth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748B', fontSize: 12 }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#64748B', fontSize: 12 }}
                              dx={-10}
                            />
                            <RechartsTooltip 
                              cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line 
                              type="monotone" 
                              name="Abstract Views"
                              dataKey="views" 
                              stroke="#1E40AF" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#1E40AF', strokeWidth: 0 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line 
                              type="monotone" 
                              name="PDF Downloads"
                              dataKey="downloads" 
                              stroke="#38BDF8" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#38BDF8', strokeWidth: 0 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border border-dashed bg-muted/30 shadow-none">
                    <CardContent className="p-12 text-center">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-1">No analytics available yet</h3>
                      <p className="text-muted-foreground">Submit a manuscript to get started tracking your impact.</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-editorial text-xl text-foreground">Acceptance Rate & Citations</CardTitle>
                    <CardDescription>Historical trend of your manuscript acceptance rates vs total citations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={authorHistoryData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis 
                            dataKey="year" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            dx={-10}
                            tickFormatter={(val) => `${val}%`}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            dx={10}
                          />
                          <RechartsTooltip 
                            cursor={{ fill: '#F1F5F9' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar 
                            yAxisId="right"
                            name="Citations" 
                            dataKey="citations" 
                            barSize={30} 
                            fill="#F97316"
                            radius={[4, 4, 0, 0]}
                          />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            name="Acceptance Rate (%)" 
                            dataKey="acceptanceRate" 
                            stroke="#1E40AF" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#1E40AF', strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isReviewer && (
            <TabsContent value="reviews" className="space-y-6">
              {reviews.filter(r => r.invitationStatus === 'pending').length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-editorial text-lg font-medium text-foreground border-b border-border pb-2">Pending Review Requests</h3>
                  <div className="grid gap-4">
                    {reviews.filter(r => r.invitationStatus === 'pending').map(review => {
                      const submission = submissions.find(s => s.id === review.submissionId);
                      return (
                        <Card key={review.id} className="border-primary/30 shadow-sm bg-primary/5">
                          <CardContent className="p-5">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">New Request</Badge>
                                  <span className="text-sm text-muted-foreground tabular-nums">
                                    Assigned on {format(new Date(review.assignedAt), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                <h4 className="font-editorial font-semibold text-foreground text-lg">
                                  {submission ? submission.title : `Submission ID: ${review.submissionId}`}
                                </h4>
                                {submission?.abstract && (
                                  <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{submission.abstract}</p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 shrink-0 justify-center">
                                <Button 
                                  className="w-full md:w-auto"
                                  onClick={() => handleAcceptReview(review.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Accept Review
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="w-full md:w-auto"
                                  onClick={() => handleDeclineReview(review.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border">
                  <CardTitle className="font-editorial text-xl text-foreground">My Reviews</CardTitle>
                  <CardDescription>Active and completed peer reviews.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {dataLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading reviews...</div>
                  ) : reviews.filter(r => r.invitationStatus === 'accepted' || (r.status === 'completed' && r.invitationStatus !== 'declined')).length > 0 ? (
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Manuscript</TableHead>
                          <TableHead>Assigned Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviews.filter(r => r.invitationStatus === 'accepted' || (r.status === 'completed' && r.invitationStatus !== 'declined')).map((review) => {
                          const submission = submissions.find(s => s.id === review.submissionId);
                          return (
                            <TableRow key={review.id}>
                              <TableCell className="font-medium text-foreground">
                                <div className="line-clamp-2 max-w-[400px]">
                                  {submission ? submission.title : `Submission ID: ${review.submissionId}`}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground tabular-nums">
                                {format(new Date(review.assignedAt), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                {review.status === 'pending' ? (
                                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">In Progress</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Completed</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenReviewModal(review)}
                                >
                                  {review.status === 'pending' ? 'Continue Review' : 'View Review'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-1">No active reviews</h3>
                      <p className="text-muted-foreground">You have no active or completed reviews at this time.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isStaff && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-editorial text-xl text-foreground">All Submissions & Publishing (Admin Panel)</CardTitle>
                    <CardDescription>Review submitted manuscripts, assign reviewers, and publish accepted articles to an issue.</CardDescription>
                  </div>
                  <Button
                    onClick={handleOpenDirectPublishModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Publish New Article
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[300px]">Manuscript Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.length > 0 ? submissions.map((sub) => {
                        const isPublished = publishedArticles.some((a) => a.id === sub.id);
                        const authorDisplay =
                          sub.authorName ||
                          usersList.find((u) => u.uid === sub.authorUid)?.displayName ||
                          `${sub.authorUid?.substring(0, 8)}...`;
                        return (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium text-foreground">
                              <div className="line-clamp-1">{sub.title}</div>
                              {sub.specialty && (
                                <span className="text-xs text-muted-foreground">{sub.specialty}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              <div className="font-medium text-foreground">{authorDisplay}</div>
                              <div className="font-mono text-[11px]">{sub.authorUid?.substring(0, 8)}...</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {getStatusBadge(sub.status)}
                                {isPublished && (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                    Live
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {!isPublished && sub.status !== 'rejected' && (
                                <Button
                                  variant={sub.status === 'accepted' ? 'default' : 'outline'}
                                  size="sm"
                                  className={
                                    sub.status === 'accepted'
                                      ? 'mr-2 bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'mr-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40'
                                  }
                                  onClick={() => handleOpenPublishModal(sub)}
                                >
                                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                  Publish
                                </Button>
                              )}
                              {isPublished && (
                                <>
                                  <Link
                                    to={`/articles/${sub.id}`}
                                    className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mr-2`}
                                  >
                                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                    View
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40"
                                    onClick={() => handleRetractArticle(sub.id)}
                                  >
                                    Retract
                                  </Button>
                                </>
                              )}
                              {['submitted', 'under_review'].includes(sub.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={() => {
                                    setSubmissionToAssign(sub);
                                    setIsAssignReviewerOpen(true);
                                  }}
                                >
                                  Assign Reviewer
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                Manage
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No manuscripts found. Use "Publish New Article" above to publish directly.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-editorial text-xl text-foreground">Published Articles Catalog</CardTitle>
                    <CardDescription>Filter by access model or editorial category, update issue placement, or retract live articles.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-background border border-border rounded-md p-0.5">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'open_access', label: 'Open Access' },
                          { id: 'subscription', label: 'Subscription' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCatalogFilterAccess(opt.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                            catalogFilterAccess === opt.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <Select value={catalogFilterCategory} onValueChange={(v) => setCatalogFilterCategory(v || 'all')}>
                      <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {ARTICLE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs font-mono tabular-nums text-muted-foreground ml-1">
                      {publishedArticles.length} Total
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {(() => {
                    const filteredCatalog = publishedArticles.filter((art) => {
                      const accessMatch =
                        catalogFilterAccess === 'all' ||
                        (catalogFilterAccess === 'open_access' && art.isOpenAccess !== false) ||
                        (catalogFilterAccess === 'subscription' && art.isOpenAccess === false);
                      const catMatch =
                        catalogFilterCategory === 'all' ||
                        (art.articleType || 'Original Investigation') === catalogFilterCategory;
                      return accessMatch && catMatch;
                    });
                    return filteredCatalog.length > 0 ? (
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="w-[320px]">Article Title & Metadata</TableHead>
                            <TableHead>Category & Access</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Published</TableHead>
                            <TableHead>Reach</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCatalog.map((art) => (
                            <TableRow key={art.id}>
                              <TableCell>
                                <div className="font-medium text-foreground line-clamp-1">{art.title || 'Untitled Article'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {Array.isArray(art.authors) && art.authors.length > 0 ? art.authors.join(', ') : 'UMAJ Author'}
                                  {art.doi ? <span className="font-mono ml-2">· {art.doi}</span> : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1 text-xs">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`font-semibold ${
                                      art.articleType === 'Lead Investigation' || art.featuredPlacement === 'lead_investigation'
                                        ? 'text-red-700 dark:text-red-400'
                                        : 'text-foreground'
                                    }`}>
                                      {art.articleType || 'Original Investigation'}
                                    </span>
                                    {art.featuredPlacement === 'editors_pick' && (
                                      <span className="text-[11px] font-medium text-primary">· Editor&apos;s Pick</span>
                                    )}
                                    {art.featuredPlacement === 'special_issue' && (
                                      <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">· Special Issue</span>
                                    )}
                                    {art.cmeEligible && (
                                      <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">· CME</span>
                                    )}
                                  </div>
                                  {art.isOpenAccess !== false ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                      <Unlock className="h-3 w-3" /> Open Access
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                      <Lock className="h-3 w-3" /> Subscription
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                                Vol {art.volume || '—'}, Issue {art.issue || '—'}
                              </TableCell>
                              <TableCell className="text-xs tabular-nums text-muted-foreground">
                                {art.publishedAt ? format(new Date(art.publishedAt), 'MMM d, yyyy') : '—'}
                              </TableCell>
                              <TableCell className="text-xs font-mono tabular-nums text-muted-foreground">
                                {(art.views || 0).toLocaleString()} views · {(art.downloads || 0).toLocaleString()} dl
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <Link
                                  to={`/articles/${art.id}`}
                                  className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mr-1 text-primary`}
                                >
                                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                  View
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={() => handleOpenEditArticleModal(art)}
                                >
                                  <Edit className="mr-1 h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40"
                                  onClick={() => handleRetractArticle(art.id)}
                                >
                                  Retract
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        {publishedArticles.length === 0
                          ? 'No custom articles have been published yet. Click "Publish New Article" or publish an accepted submission above.'
                          : 'No published articles match the selected access or category filter.'}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isEditorBoard && (
            <TabsContent value="editor-tasks">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-editorial text-xl text-foreground">Editorial Board Tasks</CardTitle>
                    <CardDescription>Manage your assigned manuscripts and provide editorial feedback.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {dataLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading manuscripts...</div>
                  ) : submissions.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.filter(s => ['submitted', 'under_review', 'revision_requested'].includes(s.status)).map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium text-foreground">
                              {sub.title.substring(0, 50)}...
                            </TableCell>
                            <TableCell className="text-muted-foreground tabular-nums">
                              {format(new Date(sub.submittedAt || Date.now()), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(sub.status)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {['submitted', 'under_review'].includes(sub.status) && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="mr-2"
                                  onClick={() => {
                                    setSubmissionToAssign(sub);
                                    setIsAssignReviewerOpen(true);
                                  }}
                                >
                                  Assign Reviewer
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mr-2"
                                onClick={() => {
                                  setFeedbackSubmission(sub);
                                  setIsEditorialFeedbackOpen(true);
                                }}
                              >
                                Provide Feedback
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mr-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40"
                                onClick={() => handleOpenPlagiarismModal(sub)}
                              >
                                <ShieldCheck className="w-4 h-4 mr-1" />
                                Similarity
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mr-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40"
                                onClick={() => handleOpenDiscussionModal(sub)}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                {sub.internalDiscussion?.length ? `Discuss (${sub.internalDiscussion.length})` : 'Discuss'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No active manuscripts currently require your attention.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isEditorBoard && (
            <TabsContent value="find-reviewers">
              <Card className="border-border bg-card shadow-sm h-[600px] flex flex-col">
                <CardHeader className="bg-muted/40 border-b border-border flex-shrink-0">
                  <CardTitle className="font-editorial text-xl text-foreground">Reviewer Directory</CardTitle>
                  <CardDescription>Search and discover peer reviewers based on subject matter expertise and previous publications.</CardDescription>
                  <div className="mt-4 relative max-w-xl">
                    <Input
                      placeholder="Search by name, expertise, or publications..."
                      value={reviewerSearchQuery}
                      onChange={(e) => setReviewerSearchQuery(e.target.value)}
                      className="pl-9 bg-background"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 overflow-y-auto bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableReviewers
                      .filter(r => {
                        if (!reviewerSearchQuery) return true;
                        const q = reviewerSearchQuery.toLowerCase();
                        return (
                          r.displayName?.toLowerCase().includes(q) ||
                          r.email?.toLowerCase().includes(q) ||
                          r.specialties?.some((s: string) => s.toLowerCase().includes(q)) ||
                          r.publications?.some((p: string) => p.toLowerCase().includes(q))
                        );
                      })
                      .map((reviewer) => (
                        <div key={reviewer.uid} className="p-4 rounded-md border border-border bg-card shadow-sm hover:shadow transition-shadow">
                          <h4 className="font-semibold text-foreground mb-1">{reviewer.displayName}</h4>
                          <a href={`mailto:${reviewer.email}`} className="text-xs text-primary hover:underline mb-3 inline-block">
                            {reviewer.email}
                          </a>
                          
                          {reviewer.specialties && reviewer.specialties.length > 0 && (
                            <div className="mb-3">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Expertise:</span>
                              <p className="text-xs text-foreground">{reviewer.specialties.join(' · ')}</p>
                            </div>
                          )}
                          
                          {reviewer.publications && reviewer.publications.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Publications:</span>
                              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                                {reviewer.publications.map((pub: string, idx: number) => (
                                  <li key={idx}>{pub}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                    ))}
                    {availableReviewers.filter(r => {
                        if (!reviewerSearchQuery) return true;
                        const q = reviewerSearchQuery.toLowerCase();
                        return (
                          r.displayName?.toLowerCase().includes(q) ||
                          r.email?.toLowerCase().includes(q) ||
                          r.specialties?.some((s: string) => s.toLowerCase().includes(q)) ||
                          r.publications?.some((p: string) => p.toLowerCase().includes(q))
                        );
                      }).length === 0 && (
                        <div className="col-span-full p-8 text-center text-muted-foreground bg-card rounded-md border border-border">
                          No reviewers match your search criteria. Try a different keyword or specialty.
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isEditorBoard && (
            <TabsContent value="editor-analytics">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="bg-muted/40 border-b border-border">
                      <CardTitle className="font-editorial text-xl text-foreground">Submissions Activity</CardTitle>
                      <CardDescription>Monthly breakdown of manuscripts received, published, and rejected.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] p-4 pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={editorAnalyticsSubmissions}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                          <RechartsTooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '8px', border: '1px solid #E2E8F0'}} />
                          <Legend wrapperStyle={{paddingTop: '20px'}} />
                          <Bar dataKey="received" name="Received" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="published" name="Published" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="rejected" name="Rejected" fill="#F87171" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="bg-muted/40 border-b border-border">
                      <CardTitle className="font-editorial text-xl text-foreground">Average Turnaround Time</CardTitle>
                      <CardDescription>Average time taken for peer review (days).</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] p-4 pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={editorAnalyticsReviewTime}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                          <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #E2E8F0'}} />
                          <Legend wrapperStyle={{paddingTop: '20px'}} />
                          <Line type="monotone" dataKey="Average Days" stroke="#10B981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="bg-muted/40 border-b border-border flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 font-editorial text-xl text-foreground">
                          <Award className="h-5 w-5 text-amber-500" />
                          Top Reviewers
                        </CardTitle>
                        <CardDescription>Ranked by completed reviews and timeliness.</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="w-16 text-center">Rank</TableHead>
                            <TableHead>Reviewer</TableHead>
                            <TableHead>Specialty</TableHead>
                            <TableHead className="text-center">Completed Reviews</TableHead>
                            <TableHead className="text-center">Avg. Turnaround (Days)</TableHead>
                            <TableHead className="text-right">Editorial Rating</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topReviewersData.map((reviewer, index) => (
                            <TableRow key={reviewer.id}>
                              <TableCell className="text-center font-medium font-mono tabular-nums">
                                {index === 0 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">1</span> :
                                 index === 1 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-foreground">2</span> :
                                 index === 2 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">3</span> :
                                 `${index + 1}`}
                              </TableCell>
                              <TableCell className="font-medium text-foreground">{reviewer.name}</TableCell>
                              <TableCell className="text-muted-foreground">{reviewer.specialty}</TableCell>
                              <TableCell className="text-center font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                                {reviewer.completed}
                              </TableCell>
                              <TableCell className="text-center font-mono tabular-nums">
                                <span className={`inline-flex items-center text-xs font-medium ${reviewer.avgTurnaround < 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {reviewer.avgTurnaround < 20 ? <TrendingUp className="w-3 h-3 mr-1" /> : null}
                                  {reviewer.avgTurnaround}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="font-medium text-foreground">{reviewer.rating}</span>
                                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}

          {isStaff && (
            <TabsContent value="admin-subscriptions">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-editorial text-xl text-foreground">Subscription Management</CardTitle>
                    <CardDescription>View and manage user subscriptions.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">Export Data</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Subscribed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.length > 0 ? subscribers.map((subscriber) => {
                        const isExpired = subscriber.role === 'unsubscribed_reader' || 
                          (subscriber.subscriptionDate && new Date(subscriber.subscriptionDate).getTime() < Date.now() - 86400000 * 365);
                        
                        return (
                          <TableRow key={subscriber.uid}>
                            <TableCell>
                              <div className="font-medium text-foreground">{subscriber.displayName || 'Unknown User'}</div>
                              <div className="text-xs text-muted-foreground">{subscriber.email}</div>
                            </TableCell>
                            <TableCell className="text-foreground">{subscriber.subscriptionPlan || 'Unknown'}</TableCell>
                            <TableCell>
                              {isExpired ? (
                                <Badge variant="outline" className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Expired</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground tabular-nums">
                              {subscriber.subscriptionDate ? format(new Date(subscriber.subscriptionDate), 'MMM d, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary"
                                onClick={() => handleOpenManageSub(subscriber)}
                              >
                                Manage
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No subscribers found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          {isStaff && (
            <TabsContent value="admin-users">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-editorial text-xl text-foreground">User Role Management</CardTitle>
                    <CardDescription>Assign roles and permissions to users.</CardDescription>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>
                          <div 
                            className="flex items-center cursor-pointer hover:text-foreground select-none"
                            onClick={() => handleUserSort('displayName')}
                          >
                            Display Name
                            {userSortField === 'displayName' ? (
                              userSortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>
                          <div 
                            className="flex items-center cursor-pointer hover:text-foreground select-none"
                            onClick={() => handleUserSort('role')}
                          >
                            Current Role
                            {userSortField === 'role' ? (
                              userSortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground opacity-50" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Specialties</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUsersList.length > 0 ? sortedUsersList.map((u) => (
                        <TableRow key={u.uid}>
                          <TableCell className="font-medium text-foreground">{u.displayName || 'Unknown'}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <span className="capitalize text-xs font-medium text-foreground">
                              {u.role?.replace('_', ' ') || 'None'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {u.role === 'reviewer' && (
                              <div className="text-xs text-muted-foreground">
                                {u.specialties && u.specialties.length > 0 ? (
                                  u.specialties.join(' · ')
                                ) : (
                                  <span className="italic">None set</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.role === 'reviewer' && (
                                <Button variant="outline" size="sm" onClick={() => handleOpenSpecialties(u)}>
                                  Edit Specialties
                                </Button>
                              )}
                              <Select 
                                disabled={isUpdatingRole === u.uid || u.uid === user.uid} 
                                value={u.role || ''} 
                                onValueChange={(val) => handleRoleChange(u.uid, val || '')}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="reviewer">Reviewer</SelectItem>
                                  <SelectItem value="author">Author</SelectItem>
                                  <SelectItem value="subscribed_reader">Subscribed Reader</SelectItem>
                                  <SelectItem value="unsubscribed_reader">Free Reader</SelectItem>
                                  <SelectItem value="institutional">Institutional</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isStaff && (
            <TabsContent value="admin-analytics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 border-b border-border pb-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold font-mono tabular-nums text-foreground">{submissions.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time manuscripts</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 border-b border-border pb-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold font-mono tabular-nums text-foreground">{usersList.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 border-b border-border pb-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscribers</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold font-mono tabular-nums text-foreground">
                      {subscribers.filter(s => s.role !== 'unsubscribed_reader' && (!s.subscriptionDate || new Date(s.subscriptionDate).getTime() >= Date.now() - 86400000 * 365)).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Paid & Institutional</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 border-b border-border">
                    <CardTitle className="flex items-center font-editorial text-xl text-foreground">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Submissions by Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Submitted', value: submissions.filter(s => s.status === 'submitted').length },
                            { name: 'Under Review', value: submissions.filter(s => s.status === 'under_review').length },
                            { name: 'Revision', value: submissions.filter(s => s.status === 'revision_requested').length },
                            { name: 'Accepted', value: submissions.filter(s => s.status === 'accepted').length },
                            { name: 'Rejected', value: submissions.filter(s => s.status === 'rejected').length }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#a855f7" />
                          <Cell fill="#22c55e" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 border-b border-border">
                    <CardTitle className="flex items-center font-editorial text-xl text-foreground">
                      <Users className="mr-2 h-5 w-5 text-primary" />
                      Users by Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Admin', count: usersList.filter(u => u.role === 'admin').length },
                          { name: 'Editor', count: usersList.filter(u => u.role === 'editor').length },
                          { name: 'Reviewer', count: usersList.filter(u => u.role === 'reviewer').length },
                          { name: 'Author', count: usersList.filter(u => u.role === 'author').length },
                          { name: 'Reader', count: usersList.filter(u => ['subscribed_reader', 'unsubscribed_reader', 'institutional'].includes(u.role)).length }
                        ].filter(d => d.count > 0)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="bg-muted/40 border-b border-border">
                    <CardTitle className="flex items-center font-editorial text-xl text-foreground">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Article Views & Downloads (Last 12 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analyticsDataMonthByMonth}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="views" name="Total Views" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="downloads" name="PDF Downloads" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {isReader && (
            <TabsContent value="reader">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border">
                  <CardTitle className="font-editorial text-xl text-foreground">Reader Access</CardTitle>
                  <CardDescription>Manage your reading preferences and subscriptions.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="font-editorial text-lg font-medium text-foreground mb-1">Welcome, Reader</h3>
                  <p className="text-muted-foreground mb-6">
                    {profile.role === 'subscribed_reader' 
                      ? "You have full access to all published articles." 
                      : profile.role === 'institutional' 
                      ? "You have institutional access to all published articles."
                      : "You have limited access. Consider subscribing for full access."}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link to="/articles" className={buttonVariants({ variant: "outline" })}>Browse Articles</Link>
                    {!['subscribed_reader', 'institutional', 'admin', 'editor'].includes(profile.role) && (
                      <Link to="/subscription" className={buttonVariants({ variant: "default" })}>
                        View Subscription Options
                      </Link>
                    )}
                    {['subscribed_reader', 'institutional'].includes(profile.role) && (
                      <Button variant="destructive" onClick={handleCancelReaderSubscription}>
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="bookmarks">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="bg-muted/40 border-b border-border">
                <CardTitle className="font-editorial text-xl text-foreground">Saved Articles</CardTitle>
                <CardDescription>Your personal reading list.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {bookmarkedArticlesList.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Authors</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookmarkedArticlesList.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium text-foreground">
                            {article.title}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {article.authors?.join(', ')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/articles/${article.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                              Read Bookmarked
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p>You haven't bookmarked any articles yet.</p>
                    <Link to="/articles" className="mt-4 inline-block text-primary hover:underline">
                      Explore Articles
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-events">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="bg-muted/40 border-b border-border">
                <CardTitle className="font-editorial text-xl text-foreground">My Events</CardTitle>
                <CardDescription>Conferences and events you have RSVP'd to.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {registeredEventsList.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Event Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registeredEventsList.map((evt) => (
                        <TableRow key={evt.id}>
                          <TableCell><span className="text-xs font-semibold text-primary uppercase">{evt.type}</span></TableCell>
                          <TableCell className="font-medium text-foreground">{evt.title}</TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">{evt.date}</TableCell>
                          <TableCell className="text-muted-foreground">{evt.location}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewTicket(evt)} className="text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                View Ticket
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleCancelRsvp(evt.id)} className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                                Cancel RSVP
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p>You haven't registered for any events yet.</p>
                    <Link to="/events" className="mt-4 inline-block text-primary hover:underline">
                      Discover Events
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isEditorBoard && (
            <TabsContent value="news-events">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <div>
                  <h2 className="font-editorial text-xl font-bold text-foreground">News & Events</h2>
                  <p className="text-sm text-muted-foreground">Manage journal announcements and upcoming conferences.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
                    <ScanLine className="mr-2 h-4 w-4" /> Scan Tickets
                  </Button>
                  <Button onClick={() => setIsAddEventModalOpen(true)}>Add Event</Button>
                </div>
              </div>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="bg-muted/40 border-b border-border">
                  <CardTitle className="font-editorial text-xl text-foreground">Current Events</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {newsEvents.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newsEvents.map((evt) => (
                          <TableRow key={evt.id}>
                            <TableCell><span className="text-xs font-semibold text-primary uppercase">{evt.type}</span></TableCell>
                            <TableCell className="font-medium text-foreground">{evt.title}</TableCell>
                            <TableCell className="text-muted-foreground tabular-nums">{evt.date}</TableCell>
                            <TableCell className="text-muted-foreground">{evt.location}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No events found. Add your first event!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Review the status and feedback for your manuscript.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6 py-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Title</h4>
                <p className="text-base font-medium text-foreground">{selectedSubmission.title}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <div>{getStatusBadge(selectedSubmission.status)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Submitted On</h4>
                  <p className="text-sm text-foreground tabular-nums">{format(new Date(selectedSubmission.submittedAt), 'MMMM d, yyyy')}</p>
                </div>
              </div>

              {selectedSubmission.abstract && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Abstract</h4>
                  <p className="text-sm text-foreground/85 leading-relaxed bg-muted/40 p-3 rounded-md border border-border">
                    {selectedSubmission.abstract}
                  </p>
                </div>
              )}

              {selectedSubmission.editorFeedback && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Editor Feedback
                  </h4>
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-md">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedSubmission.editorFeedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedSubmission?.status === 'revision_requested' && (
              <Button 
                onClick={() => {
                  navigate(`/submit?revision=true&id=${selectedSubmission.id}`);
                }}
              >
                Submit Revision
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Reviewer Modal */}
      <Dialog open={isAssignReviewerOpen} onOpenChange={setIsAssignReviewerOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Reviewer</DialogTitle>
            <DialogDescription>
              Search and select a peer reviewer based on expertise and previous publications.
            </DialogDescription>
          </DialogHeader>
          
          {submissionToAssign && (
            <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Manuscript</h4>
                <p className="text-sm font-medium text-foreground line-clamp-2">{submissionToAssign.title}</p>
              </div>
              
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="relative">
                  <Input
                    placeholder="Search by name, expertise, or publications..."
                    value={reviewerSearchQuery}
                    onChange={(e) => setReviewerSearchQuery(e.target.value)}
                    className="pl-9 bg-background"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-border rounded-md p-2 bg-muted/30">
                  {availableReviewers
                    .filter(r => {
                      if (!reviewerSearchQuery) return true;
                      const q = reviewerSearchQuery.toLowerCase();
                      return (
                        r.displayName?.toLowerCase().includes(q) ||
                        r.email?.toLowerCase().includes(q) ||
                        r.specialties?.some((s: string) => s.toLowerCase().includes(q)) ||
                        r.publications?.some((p: string) => p.toLowerCase().includes(q))
                      );
                    })
                    .map((reviewer) => {
                      const isFlagged = flaggedCOI[submissionToAssign.id]?.includes(reviewer.uid);
                      
                      return (
                        <div 
                          key={reviewer.uid} 
                          className={`p-3 rounded-md border transition-colors ${
                            isFlagged 
                              ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 opacity-80' 
                              : selectedReviewerId === reviewer.uid 
                                ? 'border-primary bg-primary/10 cursor-pointer' 
                                : 'border-border bg-card hover:bg-muted/50 cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isFlagged) {
                              setSelectedReviewerId(reviewer.uid);
                            } else {
                              toast.warning("This reviewer is flagged for a potential conflict of interest.");
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isFlagged ? 'text-amber-800 dark:text-amber-300' : 'text-foreground'}`}>{reviewer.displayName}</span>
                              {isFlagged && (
                                <Badge variant="outline" className="text-[10px] py-0 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 uppercase" title="Conflict of Interest">
                                  <AlertTriangle className="mr-1 h-3 w-3" /> COI Flagged
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`h-6 px-2 text-xs border ${isFlagged ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200' : 'text-muted-foreground border-transparent hover:bg-muted'}`}
                                onClick={(e) => handleToggleCOI(e, reviewer.uid)}
                              >
                                <Flag className={`mr-1 h-3 w-3 ${isFlagged ? 'fill-amber-700' : ''}`} />
                                {isFlagged ? 'Unflag' : 'Flag COI'}
                              </Button>
                              {selectedReviewerId === reviewer.uid && !isFlagged && (
                                <Check className="h-4 w-4 text-primary ml-1" />
                              )}
                            </div>
                          </div>
                          {reviewer.specialties && reviewer.specialties.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">Expertise:</span>
                              <span className="text-xs text-foreground">{reviewer.specialties.join(' · ')}</span>
                            </div>
                          )}
                          {reviewer.publications && reviewer.publications.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Key Publications:</span>
                              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                                {reviewer.publications.slice(0, 2).map((pub: string, idx: number) => (
                                  <li key={idx} className="line-clamp-1" title={pub}>{pub}</li>
                                ))}
                                {reviewer.publications.length > 2 && (
                                  <li className="text-muted-foreground/70 italic">+{reviewer.publications.length - 2} more...</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {availableReviewers.filter(r => {
                      if (!reviewerSearchQuery) return true;
                      const q = reviewerSearchQuery.toLowerCase();
                      return (
                        r.displayName?.toLowerCase().includes(q) ||
                        r.email?.toLowerCase().includes(q) ||
                        r.specialties?.some((s: string) => s.toLowerCase().includes(q)) ||
                        r.publications?.some((p: string) => p.toLowerCase().includes(q))
                      );
                    }).length === 0 && (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No reviewers match your search criteria.
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsAssignReviewerOpen(false)} disabled={isAssigning}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignReviewer}
              disabled={!selectedReviewerId || isAssigning}
            >
              {isAssigning ? 'Assigning...' : 'Assign Reviewer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Submission Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {activeReview?.status === 'pending' ? 'Submit Review' : 'View Review'}
            </DialogTitle>
            <DialogDescription>
              Provide your feedback and recommendation for Submission #{activeReview?.submissionId.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4 rounded-md border border-border bg-muted/40 p-4">
              <h4 className="font-semibold text-foreground border-b border-border pb-2">Evaluation Rubric</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Methodology (1-5) *</Label>
                  <Select 
                    value={rubricScores.methodology}
                    onValueChange={(val) => setRubricScores(prev => ({ ...prev, methodology: val || '' }))}
                    disabled={activeReview?.status === 'completed'}
                  >
                    <SelectTrigger><SelectValue placeholder="Select score" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Originality (1-5) *</Label>
                  <Select 
                    value={rubricScores.originality}
                    onValueChange={(val) => setRubricScores(prev => ({ ...prev, originality: val || '' }))}
                    disabled={activeReview?.status === 'completed'}
                  >
                    <SelectTrigger><SelectValue placeholder="Select score" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Clarity (1-5) *</Label>
                  <Select 
                    value={rubricScores.clarity}
                    onValueChange={(val) => setRubricScores(prev => ({ ...prev, clarity: val || '' }))}
                    disabled={activeReview?.status === 'completed'}
                  >
                    <SelectTrigger><SelectValue placeholder="Select score" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Relevance (1-5) *</Label>
                  <Select 
                    value={rubricScores.relevance}
                    onValueChange={(val) => setRubricScores(prev => ({ ...prev, relevance: val || '' }))}
                    disabled={activeReview?.status === 'completed'}
                  >
                    <SelectTrigger><SelectValue placeholder="Select score" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Very Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation *</Label>
              <Select 
                value={reviewRecommendation} 
                onValueChange={(v) => setReviewRecommendation(v || '')}
                disabled={activeReview?.status === 'completed'}
              >
                <SelectTrigger id="recommendation">
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">Accept Submission</SelectItem>
                  <SelectItem value="minor_revision">Minor Revision</SelectItem>
                  <SelectItem value="major_revision">Major Revision</SelectItem>
                  <SelectItem value="reject">Reject Submission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="comments">Reviewer Comments *</Label>
                {activeReview?.status !== 'completed' && (
                  <Popover open={isTemplatePopoverOpen} onOpenChange={setIsTemplatePopoverOpen}>
                    <PopoverTrigger 
                      render={<Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1" />}
                    >
                      <Library className="h-3 w-3" /> Templates
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-3 border-b border-border">
                        <h4 className="font-semibold text-sm mb-2 text-foreground">Saved Templates</h4>
                        {reviewTemplates.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No templates saved yet.</p>
                        ) : (
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {reviewTemplates.map(template => (
                              <div key={template.id} className="flex items-center justify-between group hover:bg-muted p-1.5 rounded-md cursor-pointer" onClick={() => loadReviewTemplate(template.content)}>
                                <span className="text-sm truncate mr-2 text-foreground" title={template.name}>{template.name}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={(e) => deleteReviewTemplate(template.id, e)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-muted/40 rounded-b-md">
                        <h4 className="font-semibold text-sm mb-2 text-foreground">Save Current as Template</h4>
                        <div className="flex gap-2">
                          <Input 
                            value={newTemplateName} 
                            onChange={e => setNewTemplateName(e.target.value)} 
                            placeholder="Template name..." 
                            className="h-8 text-sm"
                            onKeyDown={e => e.key === 'Enter' && saveReviewTemplate()}
                          />
                          <Button size="sm" className="h-8" onClick={saveReviewTemplate} disabled={!reviewComments.trim()}>
                            <Save className="h-3 w-3 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <Textarea 
                id="comments" 
                placeholder="Provide detailed feedback for the authors and editors based on your rubric scores..."
                className="min-h-[150px]"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                disabled={activeReview?.status === 'completed'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              {activeReview?.status === 'completed' ? 'Close' : 'Cancel'}
            </Button>
            {activeReview?.status === 'pending' && (
              <Button 
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish / Edit Article Modal */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-editorial text-xl">
              {publishMode === 'edit'
                ? 'Edit Published Article'
                : publishMode === 'direct'
                ? 'Publish New Article'
                : 'Publish Manuscript to Journal'}
            </DialogTitle>
            <DialogDescription>
              {publishMode === 'edit'
                ? 'Update category, access tier, issue assignment, DOI, or metadata for this live article.'
                : publishMode === 'direct'
                ? 'Directly publish a curated or special editorial article with access controls and category classification.'
                : 'Classify access rights, editorial category, and issue placement before publishing immediately.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {publishMode === 'submission' && submissionToPublish && submissionToPublish.status !== 'accepted' && (
              <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                Note: This manuscript is currently marked <strong className="capitalize">{submissionToPublish.status.replace('_', ' ')}</strong>. Publishing will automatically mark the submission as <strong>Accepted</strong>.
              </div>
            )}

            {/* Access & License Tier Selector */}
            <div className="space-y-1.5">
              <Label>Access &amp; Licensing Model *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPublishAccessType('open_access')}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    publishAccessType === 'open_access'
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/35 dark:border-emerald-500'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <Unlock className={`h-4 w-4 mt-0.5 shrink-0 ${publishAccessType === 'open_access' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Open Access</p>
                    <p className="text-xs text-muted-foreground">Freely accessible full text &amp; PDF (CC BY 4.0)</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishAccessType('subscription')}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    publishAccessType === 'subscription'
                      ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/35 dark:border-amber-500'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <Lock className={`h-4 w-4 mt-0.5 shrink-0 ${publishAccessType === 'subscription' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Subscription</p>
                    <p className="text-xs text-muted-foreground">Subscriber &amp; institutional access required</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Category, Editorial Placement & Read Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="publish-article-type">Publish Category *</Label>
                <Select
                  value={publishArticleType}
                  onValueChange={(v) => {
                    const selected = (v || 'Original Investigation') as ArticleCategoryType;
                    setPublishArticleType(selected);
                    if (selected === 'Lead Investigation') {
                      setPublishFeaturedPlacement('lead_investigation');
                    }
                  }}
                >
                  <SelectTrigger id="publish-article-type" className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_TYPES.map((typeOpt) => (
                      <SelectItem key={typeOpt} value={typeOpt}>
                        {typeOpt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="publish-placement">Editorial Placement</Label>
                <Select
                  value={publishFeaturedPlacement}
                  onValueChange={(v) => setPublishFeaturedPlacement((v || 'standard') as FeaturedPlacementType)}
                >
                  <SelectTrigger id="publish-placement" className="w-full">
                    <SelectValue placeholder="Select placement" />
                  </SelectTrigger>
                  <SelectContent>
                    {PUBLISH_PLACEMENTS.map((pl) => (
                      <SelectItem key={pl.value} value={pl.value}>
                        {pl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="publish-readtime">Estimated Read Time</Label>
                <Select value={publishReadTime} onValueChange={(v) => setPublishReadTime(v || '8 min read')}>
                  <SelectTrigger id="publish-readtime" className="w-full">
                    <SelectValue placeholder="Select read time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4 min read">4 min read</SelectItem>
                    <SelectItem value="6 min read">6 min read</SelectItem>
                    <SelectItem value="8 min read">8 min read</SelectItem>
                    <SelectItem value="10 min read">10 min read</SelectItem>
                    <SelectItem value="12 min read">12 min read</SelectItem>
                    <SelectItem value="15 min read">15 min read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publish-title">Article Title *</Label>
              <Input
                id="publish-title"
                value={publishTitle}
                onChange={(e) => setPublishTitle(e.target.value)}
                placeholder="Enter full peer-reviewed article title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="publish-authors">Authors (comma-separated) *</Label>
                <Input
                  id="publish-authors"
                  value={publishAuthors}
                  onChange={(e) => setPublishAuthors(e.target.value)}
                  placeholder="Dr. Jane Namukasa, Dr. Peter Okello"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publish-specialty">Specialty</Label>
                <Select value={publishSpecialty} onValueChange={(v) => setPublishSpecialty(v || 'General Medicine')}>
                  <SelectTrigger id="publish-specialty" className="w-full">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICAL_SPECIALTIES.map((sp) => (
                      <SelectItem key={sp} value={sp}>
                        {sp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publish-abstract">Abstract *</Label>
              <Textarea
                id="publish-abstract"
                value={publishAbstract}
                onChange={(e) => setPublishAbstract(e.target.value)}
                placeholder="Background, Methods, Results, Conclusion..."
                className="min-h-[110px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="volume">Volume *</Label>
                <Input
                  id="volume"
                  type="number"
                  value={publishVolume}
                  onChange={(e) => setPublishVolume(e.target.value)}
                  min="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issue">Issue *</Label>
                <Input
                  id="issue"
                  type="number"
                  value={publishIssue}
                  onChange={(e) => setPublishIssue(e.target.value)}
                  min="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={publishDoi}
                  onChange={(e) => setPublishDoi(e.target.value)}
                  placeholder="10.1234/umaj.2026.46.2.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="publish-keywords">Keywords (comma-separated)</Label>
                <Input
                  id="publish-keywords"
                  value={publishKeywords}
                  onChange={(e) => setPublishKeywords(e.target.value)}
                  placeholder="Malaria, Public Health, Uganda"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publish-pdf">Manuscript PDF URL *</Label>
                <Input
                  id="publish-pdf"
                  type="url"
                  value={publishPdfUrl}
                  onChange={(e) => setPublishPdfUrl(e.target.value)}
                  placeholder="https://umaj.ug/articles/article.pdf"
                />
              </div>
            </div>

            {/* Additional Journal Options */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={publishCmeEligible}
                onChange={(e) => setPublishCmeEligible(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <span className="font-semibold text-foreground inline-flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  Eligible for Continuing Medical Education (1.0 CME Credit)
                </span>
                <p className="text-muted-foreground mt-0.5">
                  Marks this article for clinician continuing professional development verification.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsPublishModalOpen(false)} disabled={isPublishing}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handlePublishArticle}
              disabled={isPublishing}
            >
              {isPublishing
                ? 'Saving...'
                : publishMode === 'edit'
                ? 'Save Changes'
                : 'Publish Article'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retract Article Confirmation Modal */}
      <Dialog open={Boolean(retractArticleId)} onOpenChange={(open) => !open && setRetractArticleId(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-editorial text-xl text-red-700 dark:text-red-400">
              Retract Published Article
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to retract this article? It will be removed from the public journal catalog immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetractArticleId(null)} disabled={isRetracting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRetractArticle} disabled={isRetracting}>
              {isRetracting ? 'Retracting...' : 'Confirm Retract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Subscription Modal */}
      <Dialog open={isManageSubModalOpen} onOpenChange={setIsManageSubModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {subscriberToManage?.displayName || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          
          {subscriberToManage && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subPlan">Subscription Plan</Label>
                  <Select value={manageSubPlan} onValueChange={(v) => setManageSubPlan(v || 'Individual')}>
                    <SelectTrigger id="subPlan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Institutional">Institutional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subStatus">Status</Label>
                  <Select value={manageSubStatus} onValueChange={(v) => setManageSubStatus(v || 'active')}>
                    <SelectTrigger id="subStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired / Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageSubModalOpen(false)} disabled={isUpdatingSub}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSubscription}
              disabled={isUpdatingSub}
            >
              {isUpdatingSub ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editorial Feedback Modal */}
      <Dialog open={isEditorialFeedbackOpen} onOpenChange={setIsEditorialFeedbackOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Editorial Decision & Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback and record your editorial decision for
              {feedbackSubmission && <span className="font-semibold text-foreground"> "{feedbackSubmission.title}"</span>}.
            </DialogDescription>
          </DialogHeader>

          {feedbackSubmission && (
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Editorial Decision *</Label>
                <Select value={editorialDecision} onValueChange={(v) => setEditorialDecision(v || '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">Accept Manuscript</SelectItem>
                    <SelectItem value="revision_requested">Request Revisions</SelectItem>
                    <SelectItem value="reject">Reject Manuscript</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This decision will update the status of the manuscript and notify the author.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editorFeedback" className="text-foreground font-semibold">Editorial Feedback *</Label>
                <Textarea
                  id="editorFeedback"
                  placeholder="Provide detailed feedback for the author..."
                  className="min-h-[200px]"
                  value={editorialFeedback}
                  onChange={(e) => setEditorialFeedback(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  This feedback will be visible to the author on their dashboard. Be constructive and specific.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorialFeedbackOpen(false)} disabled={isSubmittingFeedback}>
              Cancel
            </Button>
            <Button 
              className={
                editorialDecision === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                editorialDecision === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                ''
              }
              onClick={handleSubmitEditorialFeedback}
              disabled={isSubmittingFeedback || !editorialDecision || !editorialFeedback.trim()}
            >
              {isSubmittingFeedback ? 'Submitting...' : 'Submit Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plagiarism Check Modal */}
      <Dialog open={isPlagiarismModalOpen} onOpenChange={setIsPlagiarismModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Automated Plagiarism Check
            </DialogTitle>
            <DialogDescription>
              Cross-reference the manuscript against public databases (Crossref, PubMed, arXiv) to detect potential similarities.
            </DialogDescription>
          </DialogHeader>

          {plagiarismSubmission && (
            <div className="py-4 space-y-6">
              <div className="p-4 bg-muted/40 border border-border rounded-lg">
                <h4 className="font-semibold text-foreground mb-1">Target Manuscript</h4>
                <p className="text-sm text-muted-foreground">{plagiarismSubmission.title}</p>
              </div>

              {!isScanning && !plagiarismResult && (
                <div className="text-center py-8">
                  <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No active report</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Run the automated similarity checker to scan this submission across multiple datasets.
                  </p>
                  <Button onClick={handleRunPlagiarismCheck} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Run Plagiarism Scan
                  </Button>
                </div>
              )}

              {isScanning && (
                <div className="py-12 px-6">
                  <div className="flex justify-between text-sm font-medium mb-2 tabular-nums">
                    <span className="text-indigo-600 dark:text-indigo-400">Scanning databases...</span>
                    <span className="font-mono">{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Querying Crossref, PubMed, and arXiv...
                  </p>
                </div>
              )}

              {plagiarismResult && !isScanning && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 rounded-xl border border-border">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-muted"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={226.2}
                          strokeDashoffset={226.2 - (226.2 * plagiarismResult.score) / 100}
                          className={plagiarismResult.status === 'warning' ? 'text-amber-500 transition-all duration-1000' : 'text-emerald-500 transition-all duration-1000'}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold font-mono tabular-nums text-foreground">{plagiarismResult.score}%</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {plagiarismResult.status === 'warning' ? 'High Similarity Detected' : 'Acceptable Similarity'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {plagiarismResult.status === 'warning' 
                          ? 'This manuscript shares a high percentage of text with existing publications. A detailed manual review is recommended.'
                          : 'The overall similarity index is within acceptable limits for original research.'}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Last checked: {format(new Date(plagiarismResult.lastChecked), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Database Breakdown</h4>
                    <div className="space-y-2">
                      {plagiarismResult.sources.map((source: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                          <span className="font-medium text-foreground">{source.name}</span>
                          <span className="text-sm font-mono tabular-nums text-muted-foreground">
                            {source.match}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button variant="outline" className="mr-2" onClick={() => handleRunPlagiarismCheck()}>
                      Re-run Check
                    </Button>
                    <Button onClick={() => setIsPlagiarismModalOpen(false)}>
                      Close Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Internal Discussion Modal */}
      <Dialog open={isDiscussionModalOpen} onOpenChange={setIsDiscussionModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Internal Private Discussion
            </DialogTitle>
            <DialogDescription>
              Discuss reviewer discrepancies and editorial decisions internally. These comments are not visible to the author.
            </DialogDescription>
          </DialogHeader>

          {discussionSubmission && (
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="p-3 bg-muted/40 border border-border rounded-lg mb-4">
                <h4 className="font-semibold text-foreground text-sm">Target Manuscript</h4>
                <p className="text-sm text-muted-foreground font-medium">{discussionSubmission.title}</p>
              </div>

              {!discussionSubmission.internalDiscussion || discussionSubmission.internalDiscussion.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No internal comments yet. Start the discussion below.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {discussionSubmission.internalDiscussion.map((comment: any) => (
                    <div key={comment.id} className={`flex flex-col p-4 rounded-lg border ${comment.authorName === profile?.displayName ? 'bg-purple-50/40 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' : 'bg-card border-border'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-sm text-foreground">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground ml-2 capitalize">({comment.authorRole})</span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {format(new Date(comment.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/85 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
            <Textarea
              placeholder="Type your comment..."
              value={newDiscussionComment}
              onChange={(e) => setNewDiscussionComment(e.target.value)}
              className="min-h-[100px] mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDiscussionModalOpen(false)}>
                Close
              </Button>
              <Button 
                onClick={handlePostDiscussionComment} 
                disabled={!newDiscussionComment.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Post Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post-Submission Feedback Survey Modal */}
      <Dialog open={isSurveyModalOpen} onOpenChange={setIsSurveyModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Help us improve our editorial process by providing feedback on your experience.
            </DialogDescription>
          </DialogHeader>

          {surveySubmission && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-foreground">How would you rate your overall experience with the submission and review process?</Label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none transition-transform hover:scale-110"
                      onClick={() => setSurveyRating(star)}
                    >
                      <Star 
                        className={`w-8 h-8 ${surveyRating >= star ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} transition-colors`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedbackText" className="text-sm font-semibold text-foreground">Additional Comments (Optional)</Label>
                <Textarea
                  id="feedbackText"
                  placeholder="What did we do well? What could we improve?"
                  value={surveyFeedback}
                  onChange={(e) => setSurveyFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSurveyModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSurvey} 
              disabled={isSubmittingSurvey || surveyRating === 0}
            >
              {isSubmittingSurvey ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Specialties Modal */}
      <Dialog open={isSpecialtiesModalOpen} onOpenChange={setIsSpecialtiesModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Reviewer Specialties</DialogTitle>
            <DialogDescription>
              Manage specialties for {selectedUserForSpecialties?.displayName || 'this reviewer'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input 
                id="specialties" 
                placeholder="e.g. Cardiology, Neurology"
                value={specialtiesInput}
                onChange={(e) => setSpecialtiesInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                These will be visible when assigning reviewers to submissions.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSpecialtiesModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSpecialties} disabled={isUpdatingSpecialties}>
              {isUpdatingSpecialties ? 'Saving...' : 'Save Specialties'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add News & Events Modal */}
      <Dialog open={isAddEventModalOpen} onOpenChange={setIsAddEventModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>
              Publish a new medical conference, symposium, or journal announcement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={newEventType} onValueChange={(v) => setNewEventType(v || 'Conference')}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Symposium">Symposium</SelectItem>
                  <SelectItem value="Summit">Summit</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventTitle">Event Title</Label>
              <Input 
                id="eventTitle" 
                placeholder="e.g. Annual Medical Conference 2026"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Date & Time</Label>
              <Input 
                id="eventDate" 
                placeholder="e.g. August 12 - 14, 2026"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventLocation">Location</Label>
              <Input 
                id="eventLocation" 
                placeholder="e.g. Kampala Serena Hotel"
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={isSavingEvent || !newEventTitle || !newEventDate || !newEventLocation}>
              {isSavingEvent ? 'Publishing...' : 'Publish Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Your Event Ticket</DialogTitle>
            <DialogDescription>Show this QR code at the event check-in desk.</DialogDescription>
          </DialogHeader>
          {selectedTicket && user && (
            <div className="flex flex-col items-center justify-center p-6 bg-muted/40 rounded-xl border border-border mt-4">
              <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <QRCodeSVG
                  value={JSON.stringify({ eventId: selectedTicket.id, userId: user.uid, type: 'event_ticket' })}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <h3 className="font-editorial font-bold text-center text-lg text-foreground">{selectedTicket.title}</h3>
              <p className="text-muted-foreground text-sm mt-1 tabular-nums">{selectedTicket.date}</p>
              <p className="text-muted-foreground text-sm">{selectedTicket.location}</p>
              
              <div className="mt-6 w-full pt-4 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Attendee:</span>
                  <span className="font-medium text-foreground">{profile?.displayName || user.email}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-muted-foreground">Ticket ID:</span>
                  <span className="font-mono text-foreground text-xs">{btoa(`${selectedTicket.id}-${user.uid}`).substring(0, 10).toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="default" className="w-full" onClick={() => setIsTicketModalOpen(false)}>Close Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Scanner Modal */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Scan Attendee Tickets</DialogTitle>
            <DialogDescription>Use your camera to scan attendee QR codes for check-in.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isScannerOpen && (
              <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
