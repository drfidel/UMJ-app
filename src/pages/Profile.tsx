import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { User, Mail, Building, Shield, GraduationCap, FileText, CheckCircle, Clock, CalendarIcon, Link2 } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { user, profile, loading, isDemoMode } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [orcid, setOrcid] = useState('');
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [unavailableDate, setUnavailableDate] = useState<Date>();
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAffiliation(profile.affiliation || '');
      setOrcid(profile.orcid || '');
      setIsUnavailable(profile.isUnavailable || false);
      if (profile.unavailableDate) {
        setUnavailableDate(new Date(profile.unavailableDate));
      } else {
        setUnavailableDate(undefined);
      }
    }
  }, [profile]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      setLoadingHistory(true);

      if (isDemoMode) {
        setSubmissions([]);
        setReviews([]);
        setLoadingHistory(false);
        return;
      }

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
        if (error instanceof Error && error.message.includes('offline')) {
          // Silent fallback
        } else {
          console.error("Error fetching history:", error);
        }
      } finally {
        setLoadingHistory(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user, isDemoMode]);

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
        orcid: orcid.trim(),
        isUnavailable,
        unavailableDate: unavailableDate ? unavailableDate.toISOString() : null,
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
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">Under Review</Badge>;
      case 'revision_requested':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800">Revision Requested</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Account & Credentials</p>
          <h1 className="font-editorial text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information, ORCID iD, and account settings.</p>
        </div>

        <div className="space-y-8">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="bg-muted/40 border-b border-border">
              <CardTitle className="flex items-center text-xl text-foreground">
                <User className="mr-2 h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your display name, institutional affiliation, and ORCID iD.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center text-foreground">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email Address
                  </Label>
                  <Input id="email" value={profile.email} disabled className="bg-muted text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center text-foreground">
                    <Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Account Role
                  </Label>
                  <div className="h-10 flex items-center px-3 border border-border rounded-md bg-muted/50">
                    <span className="capitalize text-sm font-semibold text-primary">
                      {profile.role?.replace('_', ' ') || 'User'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center text-foreground">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" /> Display Name
                  </Label>
                  {isEditing ? (
                    <Input 
                      id="displayName" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="e.g., Dr. Jane Doe"
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 border border-transparent font-medium text-foreground">
                      {profile.displayName || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliation" className="flex items-center text-foreground">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" /> Affiliation
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
                    <div className="h-10 flex items-center px-3 border border-transparent text-foreground">
                      {profile.affiliation || <span className="text-muted-foreground italic">Not specified</span>}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orcid" className="flex items-center text-foreground">
                    <Link2 className="mr-2 h-4 w-4 text-muted-foreground" /> ORCID iD
                  </Label>
                  {isEditing ? (
                    <Input 
                      id="orcid" 
                      value={orcid} 
                      onChange={(e) => setOrcid(e.target.value)} 
                      placeholder="e.g., 0000-0000-0000-0000"
                    />
                  ) : (
                    <div className="h-10 flex items-center px-3 border border-transparent text-foreground font-mono text-sm">
                      {profile.orcid ? (
                        <a href={`https://orcid.org/${profile.orcid}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">iD</span>
                          {profile.orcid}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic font-sans">Not specified</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {profile.specialties && profile.specialties.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <Label className="flex items-center text-foreground mb-2">
                    <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" /> Specialties
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {profile.specialties.join(' · ')}
                  </p>
                </div>
              )}

              {['reviewer', 'editor', 'admin'].includes(profile.role) && (
                <div className="pt-6 mt-4 border-t border-border">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center text-foreground">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        Reviewer Availability
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Mark yourself as unavailable to receive new review requests.
                      </p>
                    </div>
                    <Switch
                      checked={isUnavailable}
                      onCheckedChange={setIsUnavailable}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  {isUnavailable && (
                    <div className="mt-4 pl-5 border-l-2 border-amber-400">
                      <Label className="text-sm font-medium text-foreground">Unavailable Until</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select a date when you will be available again.</p>
                      <Popover>
                        <PopoverTrigger render={<Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
                              !unavailableDate && "text-muted-foreground",
                              !isEditing && "opacity-50 cursor-not-allowed pointer-events-none"
                            )}
                            disabled={!isEditing}
                          />}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {unavailableDate ? format(unavailableDate, "PPP") : <span>Pick a date</span>}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={unavailableDate}
                            onSelect={setUnavailableDate as any}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/40 border-t border-border flex justify-end space-x-3 py-4">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(profile.displayName || '');
                      setAffiliation(profile.affiliation || '');
                      setOrcid(profile.orcid || '');
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Submission History */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="bg-muted/40 border-b border-border">
              <CardTitle className="flex items-center text-xl text-foreground">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Submission History
              </CardTitle>
              <CardDescription>
                Manuscripts you have submitted to the journal.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : submissions.length > 0 ? (
                <div className="divide-y divide-border">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{sub.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground gap-4">
                            <span className="flex items-center tabular-nums">
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
                <div className="p-8 text-center text-muted-foreground">
                  <p>You haven't submitted any manuscripts yet.</p>
                  <Link to="/submit" className="text-primary hover:underline mt-2 inline-block text-sm font-medium">
                    Submit a manuscript
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Reviews */}
          {['reviewer', 'editor', 'admin'].includes(profile.role) && (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="bg-muted/40 border-b border-border">
                <CardTitle className="flex items-center text-xl text-foreground">
                  <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                  Completed Reviews
                </CardTitle>
                <CardDescription>
                  Peer reviews you have completed.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="divide-y divide-border">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">
                              Review for Submission #{review.submissionId.substring(0, 8)}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground gap-4">
                              <span className="flex items-center tabular-nums">
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Completed: {review.completedAt ? format(new Date(review.completedAt), 'MMM d, yyyy') : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 capitalize">
                              {review.recommendation?.replace('_', ' ') || 'Completed'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>You haven't completed any reviews yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
