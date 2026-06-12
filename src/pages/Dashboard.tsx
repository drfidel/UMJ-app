import { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, setDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
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
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, BookOpen, MessageSquare, Users, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

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

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<any | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewRecommendation, setReviewRecommendation] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [submissionToPublish, setSubmissionToPublish] = useState<any | null>(null);
  const [publishVolume, setPublishVolume] = useState('');
  const [publishIssue, setPublishIssue] = useState('');
  const [publishDoi, setPublishDoi] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Subscription management state
  const [isManageSubModalOpen, setIsManageSubModalOpen] = useState(false);
  const [subscriberToManage, setSubscriberToManage] = useState<any | null>(null);
  const [manageSubPlan, setManageSubPlan] = useState('');
  const [manageSubStatus, setManageSubStatus] = useState('');
  const [isUpdatingSub, setIsUpdatingSub] = useState(false);
  const [bookmarkedArticlesList, setBookmarkedArticlesList] = useState<any[]>([]);

  const isStaff = profile?.role === 'admin' || profile?.role === 'editor';
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
                assignedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
              },
              {
                id: 'rev-2',
                submissionId: 'sub-4',
                reviewerUid: user.uid,
                status: 'completed',
                assignedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
                completedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
                recommendation: 'minor_revision'
              }
            ]);
          }
          if (isStaff) {
            setAvailableReviewers([
              { uid: 'rev-user-1', displayName: 'Dr. Jane Smith', email: 'jane@example.com', specialties: ['AI', 'Machine Learning'] },
              { uid: 'rev-user-2', displayName: 'Prof. Alan Turing', email: 'alan@example.com', specialties: ['Computer Science', 'Cryptography'] }
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

  const handleOpenReviewModal = (review: any) => {
    setActiveReview(review);
    setReviewComments(review.comments || '');
    setReviewRecommendation(review.recommendation || '');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewRecommendation) {
      toast.error('Please select a recommendation');
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
        comments: reviewComments,
        completedAt: new Date().toISOString()
      });

      setReviews(prev => prev.map(r => r.id === activeReview.id ? {
        ...r,
        status: 'completed',
        recommendation: reviewRecommendation,
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

  const handleOpenPublishModal = (submission: any) => {
    setSubmissionToPublish(submission);
    setPublishVolume('1');
    setPublishIssue('1');
    setPublishDoi(`10.1234/umaj.${new Date().getFullYear()}.${submission.id.substring(0, 6)}`);
    setIsPublishModalOpen(true);
  };

  const handlePublishArticle = async () => {
    if (!submissionToPublish || !publishVolume || !publishIssue) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsPublishing(true);
    try {
      if (isDemoMode) {
        setTimeout(() => {
          setPublishedArticles(prev => [...prev, { id: submissionToPublish.id }]);
          setIsPublishModalOpen(false);
          toast.success('Article published successfully (Demo Mode)');
          setIsPublishing(false);
        }, 500);
        return;
      }

      const newArticle = {
        id: submissionToPublish.id,
        title: submissionToPublish.title,
        abstract: submissionToPublish.abstract,
        authors: [submissionToPublish.authorUid], // Simplified for now
        keywords: submissionToPublish.keywords || [],
        volume: parseInt(publishVolume),
        issue: parseInt(publishIssue),
        doi: publishDoi,
        pdfUrl: submissionToPublish.fileUrl || '#',
        publishedAt: new Date().toISOString(),
        views: 0,
        downloads: 0
      };

      await setDoc(doc(db, 'articles', submissionToPublish.id), newArticle);
      setPublishedArticles(prev => [...prev, newArticle]);
      
      setIsPublishModalOpen(false);
      toast.success('Article published successfully');
    } catch (error) {
      console.error('Error publishing article:', error);
      toast.error('Failed to publish article');
    } finally {
      if (!isDemoMode) setIsPublishing(false);
    }
  };

  const handleRetractArticle = async (articleId: string) => {
    if (!window.confirm('Are you sure you want to retract this article? It will be removed from the public articles list.')) {
      return;
    }

    try {
      if (isDemoMode) {
        setPublishedArticles(prev => prev.filter(a => a.id !== articleId));
        toast.success('Article retracted successfully (Demo Mode)');
        return;
      }

      await deleteDoc(doc(db, 'articles', articleId));
      setPublishedArticles(prev => prev.filter(a => a.id !== articleId));
      toast.success('Article retracted successfully');
    } catch (error) {
      console.error('Error retracting article:', error);
      toast.error('Failed to retract article');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="mr-1 h-3 w-3" /> Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Eye className="mr-1 h-3 w-3" /> Under Review</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="mr-1 h-3 w-3" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      case 'revision_requested':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><AlertCircle className="mr-1 h-3 w-3" /> Revision Required</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {profile.displayName}. Role: <span className="font-semibold capitalize text-blue-700">{profile.role}</span></p>
          </div>
        </div>

        <Tabs defaultValue={isReviewer ? 'reviews' : isAuthor ? 'submissions' : 'reader'} className="w-full">
          <TabsList className="mb-6 bg-white border border-slate-200">
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
            {isStaff && (
              <TabsTrigger value="admin-subscriptions">Subscriptions</TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="admin-users">Users</TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="admin-analytics">Analytics</TabsTrigger>
            )}
            {isReader && (
              <TabsTrigger value="reader">Reader Access</TabsTrigger>
            )}
            <TabsTrigger value="bookmarks">Saved Articles</TabsTrigger>
          </TabsList>

          {isAuthor && (
            <TabsContent value="submissions">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100">
                  <CardTitle>Manuscript Submissions</CardTitle>
                  <CardDescription>Track the status of your submitted research.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {dataLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading submissions...</div>
                  ) : submissions.filter(s => s.authorUid === user.uid).length > 0 ? (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[400px]">Title</TableHead>
                          <TableHead>Date Submitted</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.filter(s => s.authorUid === user.uid).map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium text-slate-900">
                              <div className="line-clamp-2">{sub.title}</div>
                            </TableCell>
                            <TableCell className="text-slate-500">
                              {format(new Date(sub.submittedAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(sub.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-700"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-1">No submissions yet</h3>
                      <p className="text-slate-500">You haven't submitted any manuscripts.</p>
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
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
                      <BookOpen className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">
                        {publishedArticles.length}
                      </div>
                      <p className="text-xs text-slate-500">Total lifetime publications</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Global Views</CardTitle>
                      <Eye className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">
                        {publishedArticles.reduce((acc, curr) => acc + (curr.views || 0), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-500">Across all published works</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Citations</CardTitle>
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">
                        {publishedArticles.reduce((acc, curr) => acc + (curr.citations || 0), 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-500">Tracked citations via DOI</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-transparent shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-blue-100">Author Rank</CardTitle>
                      <BarChart3 className="h-4 w-4 text-blue-300" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        Top {publishedArticles.length > 0 ? Math.max(5, Math.ceil(100 / publishedArticles.length)) : 100}%
                      </div>
                      <p className="text-xs text-blue-200">Of UMAJ contributing authors</p>
                    </CardContent>
                  </Card>
                </div>
                
                {publishedArticles.length > 0 ? (
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-xl">Readership Engagement</CardTitle>
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
                  <Card className="border-slate-200 border-dashed bg-slate-50 shadow-none">
                    <CardContent className="p-12 text-center">
                      <BarChart3 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-1">No analytics available yet</h3>
                      <p className="text-slate-500">Submit a manuscript to get started tracking your impact.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {isReviewer && (
            <TabsContent value="reviews">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100">
                  <CardTitle>Assigned Reviews</CardTitle>
                  <CardDescription>Manuscripts assigned to you for peer review.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {dataLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading reviews...</div>
                  ) : reviews.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Submission ID</TableHead>
                          <TableHead>Assigned Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell className="font-medium text-slate-900">
                              {review.submissionId.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="text-slate-500">
                              {format(new Date(review.assignedAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {review.status === 'pending' ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenReviewModal(review)}
                              >
                                {review.status === 'pending' ? 'Start Review' : 'View Review'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-1">No pending reviews</h3>
                      <p className="text-slate-500">You have no manuscripts assigned for review at this time.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isStaff && (
            <TabsContent value="admin">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100">
                  <CardTitle>All Submissions (Admin View)</CardTitle>
                  <CardDescription>Manage all manuscripts across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[300px]">Title</TableHead>
                        <TableHead>Author UID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium text-slate-900">
                            <div className="line-clamp-1">{sub.title}</div>
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs font-mono">
                            {sub.authorUid.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(sub.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            {sub.status === 'accepted' && !publishedArticles.some(a => a.id === sub.id) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mr-2 border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                                onClick={() => handleOpenPublishModal(sub)}
                              >
                                Publish
                              </Button>
                            )}
                            {publishedArticles.some(a => a.id === sub.id) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mr-2 border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                                onClick={() => handleRetractArticle(sub.id)}
                              >
                                Retract
                              </Button>
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
                              className="text-blue-700"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setIsDetailsOpen(true);
                              }}
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isStaff && (
            <TabsContent value="admin-subscriptions">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Subscription Management</CardTitle>
                    <CardDescription>View and manage user subscriptions.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">Export Data</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
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
                              <div className="font-medium text-slate-900">{subscriber.displayName || 'Unknown User'}</div>
                              <div className="text-xs text-slate-500">{subscriber.email}</div>
                            </TableCell>
                            <TableCell>{subscriber.subscriptionPlan || 'Unknown'}</TableCell>
                            <TableCell>
                              {isExpired ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expired</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-500">
                              {subscriber.subscriptionDate ? format(new Date(subscriber.subscriptionDate), 'MMM d, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-700"
                                onClick={() => handleOpenManageSub(subscriber)}
                              >
                                Manage
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500">
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
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>User Role Management</CardTitle>
                    <CardDescription>Assign roles and permissions to users.</CardDescription>
                  </div>
                  <Users className="h-5 w-5 text-slate-400" />
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead className="text-right">Change Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersList.length > 0 ? usersList.map((u) => (
                        <TableRow key={u.uid}>
                          <TableCell className="font-medium text-slate-900">{u.displayName || 'Unknown'}</TableCell>
                          <TableCell className="text-slate-500">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize bg-slate-50 text-slate-700">
                              {u.role?.replace('_', ' ') || 'None'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select 
                              disabled={isUpdatingRole === u.uid || u.uid === user.uid} 
                              value={u.role || ''} 
                              onValueChange={(val) => handleRoleChange(u.uid, val)}
                            >
                              <SelectTrigger className="w-[180px] ml-auto">
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
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500">
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
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Submissions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-slate-900">{submissions.length}</div>
                    <p className="text-xs text-slate-500 mt-1">All time manuscripts</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-slate-900">{usersList.length}</div>
                    <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="text-sm font-medium text-slate-500">Active Subscribers</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-slate-900">
                      {subscribers.filter(s => s.role !== 'unsubscribed_reader' && (!s.subscriptionDate || new Date(s.subscriptionDate).getTime() >= Date.now() - 86400000 * 365)).length}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Paid & Institutional</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-white border-b border-slate-100">
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-blue-700" />
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
                          <Cell fill="#3b82f6" /> {/* blue-500 */}
                          <Cell fill="#f59e0b" /> {/* amber-500 */}
                          <Cell fill="#a855f7" /> {/* purple-500 */}
                          <Cell fill="#22c55e" /> {/* green-500 */}
                          <Cell fill="#ef4444" /> {/* red-500 */}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-white border-b border-slate-100">
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-blue-700" />
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
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-white border-b border-slate-100">
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-blue-700" />
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
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-100">
                  <CardTitle>Reader Access</CardTitle>
                  <CardDescription>Manage your reading preferences and subscriptions.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">Welcome, Reader</h3>
                  <p className="text-slate-500 mb-6">
                    {profile.role === 'subscribed_reader' 
                      ? "You have full access to all published articles." 
                      : profile.role === 'institutional' 
                      ? "You have institutional access to all published articles."
                      : "You have limited access. Consider subscribing for full access."}
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link to="/articles" className={buttonVariants({ variant: "outline" })}>Browse Articles</Link>
                    {!['subscribed_reader', 'institutional', 'admin', 'editor'].includes(profile.role) && (
                      <Link to="/subscription" className={buttonVariants({ className: "bg-blue-700 hover:bg-blue-800 text-white" })}>
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
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-white border-b border-slate-100">
                <CardTitle>Saved Articles</CardTitle>
                <CardDescription>Your personal reading list.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {bookmarkedArticlesList.length > 0 ? (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Authors</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookmarkedArticlesList.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium text-slate-900">
                            {article.title}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {article.authors?.join(', ')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/article/${article.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                              Read Bookmarked
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                    <p>You haven't bookmarked any articles yet.</p>
                    <Link to="/articles" className="mt-4 text-blue-600 hover:underline">
                      Explore Articles
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
                <h4 className="text-sm font-medium text-slate-500 mb-1">Title</h4>
                <p className="text-base font-medium text-slate-900">{selectedSubmission.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Status</h4>
                  <div>{getStatusBadge(selectedSubmission.status)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Submitted On</h4>
                  <p className="text-sm text-slate-900">{format(new Date(selectedSubmission.submittedAt), 'MMMM d, yyyy')}</p>
                </div>
              </div>

              {selectedSubmission.abstract && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Abstract</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                    {selectedSubmission.abstract}
                  </p>
                </div>
              )}

              {selectedSubmission.editorFeedback && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Editor Feedback
                  </h4>
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-md">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">
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
                className="bg-blue-700 hover:bg-blue-800 text-white"
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

      <Dialog open={isAssignReviewerOpen} onOpenChange={setIsAssignReviewerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Reviewer</DialogTitle>
            <DialogDescription>
              Select a reviewer to assign to this manuscript.
            </DialogDescription>
          </DialogHeader>
          
          {submissionToAssign && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Manuscript</h4>
                <p className="text-sm font-medium text-slate-900 line-clamp-2">{submissionToAssign.title}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-500">Select Reviewer</h4>
                <Select value={selectedReviewerId} onValueChange={setSelectedReviewerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reviewer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReviewers.length > 0 ? (
                      availableReviewers.map((reviewer) => (
                        <SelectItem key={reviewer.uid} value={reviewer.uid}>
                          <div className="flex flex-col">
                            <span className="font-medium">{reviewer.displayName}</span>
                            {reviewer.specialties && reviewer.specialties.length > 0 && (
                              <span className="text-xs text-slate-500">
                                {reviewer.specialties.join(', ')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No reviewers available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignReviewerOpen(false)} disabled={isAssigning}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-700 hover:bg-blue-800 text-white" 
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
            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation</Label>
              <Select 
                value={reviewRecommendation} 
                onValueChange={setReviewRecommendation}
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
              <Label htmlFor="comments">Reviewer Comments</Label>
              <Textarea 
                id="comments" 
                placeholder="Provide detailed feedback for the authors and editors..."
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
                className="bg-blue-700 hover:bg-blue-800 text-white" 
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Article Modal */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Publish Article</DialogTitle>
            <DialogDescription>
              Assign this manuscript to a volume and issue to publish it.
            </DialogDescription>
          </DialogHeader>
          
          {submissionToPublish && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Manuscript</h4>
                <p className="text-sm font-medium text-slate-900 line-clamp-2">{submissionToPublish.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <Input 
                    id="volume" 
                    type="number" 
                    value={publishVolume} 
                    onChange={(e) => setPublishVolume(e.target.value)} 
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue">Issue</Label>
                  <Input 
                    id="issue" 
                    type="number" 
                    value={publishIssue} 
                    onChange={(e) => setPublishIssue(e.target.value)} 
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doi">DOI (Optional)</Label>
                <Input 
                  id="doi" 
                  value={publishDoi} 
                  onChange={(e) => setPublishDoi(e.target.value)} 
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishModalOpen(false)} disabled={isPublishing}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={handlePublishArticle}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Publish Article'}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subPlan">Subscription Plan</Label>
                  <Select value={manageSubPlan} onValueChange={setManageSubPlan}>
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
                  <Select value={manageSubStatus} onValueChange={setManageSubStatus}>
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
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleSaveSubscription}
              disabled={isUpdatingSub}
            >
              {isUpdatingSub ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
