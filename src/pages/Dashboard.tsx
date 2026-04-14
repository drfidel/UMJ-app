import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye, BookOpen, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, profile, loading, isDemoMode } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isStaff = profile?.role === 'admin' || profile?.role === 'editor';
  const isReviewer = profile?.role === 'reviewer' || isStaff;
  const isAuthor = profile?.role === 'author' || isStaff;
  const isReader = ['subscribed_reader', 'unsubscribed_reader', 'institutional'].includes(profile?.role || '');

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

        // If Admin/Editor, fetch all pending submissions
        if (isStaff) {
           const adminQuery = query(
            collection(db, 'submissions'),
            where('status', 'in', ['submitted', 'under_review'])
          );
          const adminSnap = await getDocs(adminQuery);
          // Only add if not already in submissions list
          const existingIds = new Set(submissions.map(s => s.id));
          const adminSubs = adminSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(s => !existingIds.has(s.id));
          
          setSubmissions(prev => [...prev, ...adminSubs].sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
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
            {isReviewer && (
              <TabsTrigger value="reviews">My Reviews</TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="admin">Admin Panel</TabsTrigger>
            )}
            {isReader && (
              <TabsTrigger value="reader">Reader Access</TabsTrigger>
            )}
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
                  ) : submissions.length > 0 ? (
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
                              <Button variant="outline" size="sm">
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
                            <Button variant="outline" size="sm" className="mr-2">Assign Reviewer</Button>
                            <Button variant="ghost" size="sm" className="text-blue-700">Manage</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
                  <Link to="/articles" className={buttonVariants({ className: "bg-blue-700 hover:bg-blue-800 text-white" })}>Browse Articles</Link>
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
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                Submit Revision
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
