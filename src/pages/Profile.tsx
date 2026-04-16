import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Mail, Building, Shield, GraduationCap, FileText, CheckCircle, Clock } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAffiliation(profile.affiliation || '');
    }
  }, [profile]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      setLoadingHistory(true);
      try {
        // Fetch user's submissions
        const subQuery = query(
          collection(db, 'submissions'),
          where('authorUid', '==', user.uid)
        );
        const subSnap = await getDocs(subQuery);
        const subs = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        subs.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setSubmissions(subs);

        // Fetch user's completed reviews
        const revQuery = query(
          collection(db, 'reviews'),
          where('reviewerUid', '==', user.uid),
          where('status', '==', 'completed')
        );
        const revSnap = await getDocs(revQuery);
        const revs = revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        revs.sort((a: any, b: any) => new Date(b.completedAt || b.assignedAt).getTime() - new Date(a.completedAt || a.assignedAt).getTime());
        setReviews(revs);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        affiliation: affiliation.trim(),
      });
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      // Note: The profile in AuthContext will automatically update via the onSnapshot listener
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Under Review</Badge>;
      case 'revision_requested':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Revision Requested</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
        <p className="text-slate-600">Manage your personal information and account settings.</p>
      </div>

      <div className="space-y-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center text-xl">
              <User className="mr-2 h-5 w-5 text-blue-700" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your display name and institutional affiliation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center text-slate-700">
                <Mail className="mr-2 h-4 w-4 text-slate-400" /> Email Address
              </Label>
              <Input id="email" value={profile.email} disabled className="bg-slate-50 text-slate-500" />
              <p className="text-xs text-slate-500">Your email address cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center text-slate-700">
                <Shield className="mr-2 h-4 w-4 text-slate-400" /> Account Role
              </Label>
              <div className="h-10 flex items-center px-3 border border-slate-200 rounded-md bg-slate-50">
                <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-100">
                  {profile.role?.replace('_', ' ') || 'User'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center text-slate-700">
                <User className="mr-2 h-4 w-4 text-slate-400" /> Display Name
              </Label>
              {isEditing ? (
                <Input 
                  id="displayName" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="e.g., Dr. Jane Doe"
                />
              ) : (
                <div className="h-10 flex items-center px-3 border border-transparent font-medium text-slate-900">
                  {profile.displayName || 'Not set'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliation" className="flex items-center text-slate-700">
                <Building className="mr-2 h-4 w-4 text-slate-400" /> Affiliation
              </Label>
              {isEditing ? (
                <>
                  <Input 
                    id="affiliation" 
                    value={affiliation} 
                    onChange={(e) => setAffiliation(e.target.value)} 
                    placeholder="e.g., Makerere University"
                    list="ugandan-institutions"
                  />
                  <datalist id="ugandan-institutions">
                    <option value="Makerere University" />
                    <option value="Mbarara University of Science and Technology (MUST)" />
                    <option value="Gulu University" />
                    <option value="Busitema University" />
                    <option value="Kampala International University (KIU)" />
                    <option value="Uganda Christian University (UCU)" />
                    <option value="Mulago National Referral Hospital" />
                    <option value="Uganda Virus Research Institute (UVRI)" />
                    <option value="Infectious Diseases Institute (IDI)" />
                    <option value="Joint Clinical Research Centre (JCRC)" />
                  </datalist>
                </>
              ) : (
                <div className="h-10 flex items-center px-3 border border-transparent text-slate-700">
                  {profile.affiliation || <span className="text-slate-400 italic">Not specified</span>}
                </div>
              )}
            </div>
          </div>

          {profile.specialties && profile.specialties.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <Label className="flex items-center text-slate-700 mb-3">
                <GraduationCap className="mr-2 h-4 w-4 text-slate-400" /> Specialties
              </Label>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-slate-50 text-slate-700">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end space-x-3 py-4">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(profile.displayName || '');
                    setAffiliation(profile.affiliation || '');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-700 hover:bg-blue-800 text-white" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button 
                className="bg-blue-700 hover:bg-blue-800 text-white" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Submission History */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center text-xl">
              <FileText className="mr-2 h-5 w-5 text-blue-700" />
              Submission History
            </CardTitle>
            <CardDescription>
              Manuscripts you have submitted to the journal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
              </div>
            ) : submissions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">{sub.title}</h3>
                        <div className="flex items-center text-sm text-slate-500 gap-4">
                          <span className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {format(new Date(sub.submittedAt), 'MMM d, yyyy')}
                          </span>
                          <span className="font-mono text-xs">ID: {sub.id.substring(0, 8)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(sub.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>You haven't submitted any manuscripts yet.</p>
                <Link to="/submit" className="text-blue-700 hover:underline mt-2 inline-block text-sm font-medium">
                  Submit a manuscript
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Reviews */}
        {['reviewer', 'editor', 'admin'].includes(profile.role) && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex items-center text-xl">
                <CheckCircle className="mr-2 h-5 w-5 text-blue-700" />
                Completed Reviews
              </CardTitle>
              <CardDescription>
                Peer reviews you have completed.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
                </div>
              ) : reviews.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-1">
                            Review for Submission #{review.submissionId.substring(0, 8)}
                          </h3>
                          <div className="flex items-center text-sm text-slate-500 gap-4">
                            <span className="flex items-center">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Completed: {review.completedAt ? format(new Date(review.completedAt), 'MMM d, yyyy') : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 capitalize">
                            {review.recommendation?.replace('_', ' ') || 'Completed'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>You haven't completed any reviews yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
