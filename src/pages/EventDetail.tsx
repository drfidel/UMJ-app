import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import QRScanner from '@/components/QRScanner';
import { QrCode, ScanLine, Calendar, MapPin, CheckCircle, ArrowLeft, Users, ExternalLink } from 'lucide-react';

import SEO from '@/components/SEO';
import { toast } from 'sonner';

// Mock speakers data
const MOCK_SPEAKERS: Record<string, any[]> = {
  '1': [
    { name: 'Dr. Sarah Nabwire', role: 'Chief Medical Officer', affiliation: 'Mulago National Referral Hospital', bio: 'Expert in clinical epidemiology and infectious diseases.' },
    { name: 'Prof. John Ouma', role: 'Head of Research', affiliation: 'Makerere University', bio: 'Pioneer in maternal health innovations.' }
  ],
  '2': [
    { name: 'Dr. Jane Katureebe', role: 'Director', affiliation: 'Uganda Virus Research Institute', bio: 'Leading researcher in viral pathogens.' }
  ],
  '3': [
    { name: 'Dr. Isaac Musisi', role: 'Pediatric Specialist', affiliation: 'Nsambya Hospital', bio: 'Specializes in neonatal care and child health policies.' },
    { name: 'Dr. Grace Akello', role: 'Public Health Advocate', affiliation: 'Ministry of Health', bio: 'Focuses on integrating community-based maternal health strategies.' }
  ],
  default: [
    { name: 'Dr. A. Researcher', role: 'Keynote Speaker', affiliation: 'Regional Health Board', bio: 'Expert presentation on medical advancements.' }
  ]
};

// Mock events data matching Events.tsx
const MOCK_EVENTS = [
  { id: '1', title: 'Annual Uganda Medical Association Scientific Conference', date: 'August 12 - 14, 2026', location: 'Kampala Serena Hotel, Kampala', type: 'Conference', description: 'Join us for the 2026 Annual Scientific Conference featuring keynote speakers, workshops, and abstract presentations on the latest advancements in medical science across East Africa.' },
  { id: '2', title: 'East African Health Research Symposium', date: 'September 5 - 7, 2026', location: 'Imperial Resort Beach Hotel, Entebbe', type: 'Symposium', description: 'A regional gathering of health researchers to discuss public health challenges, epidemiological trends, and innovative healthcare solutions in the region.' },
  { id: '3', title: 'National Summit on Maternal & Child Health', date: 'October 20 - 21, 2026', location: 'Mbarara University of Science and Technology', type: 'Summit', description: 'Focused discussions on policy, practice, and research to improve maternal and child health outcomes in Uganda.' },
  { id: '4', title: 'Workshop on Advanced Clinical Trials Management', date: 'November 10 - 11, 2026', location: 'Makerere University College of Health Sciences', type: 'Workshop', description: 'A hands-on workshop designed for early-career researchers and clinical trial coordinators.' }
];

export default function EventDetail() {
  const { id } = useParams();
  const { user, profile, isDemoMode } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingRsvp, setProcessingRsvp] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const isAdminOrEditor = profile?.role === 'admin' || profile?.role === 'editor';

  const handleScanSuccess = (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'event_ticket' && data.eventId === event?.id) {
        toast.success(`Ticket Validated! Attendee ID: ${data.userId}`);
        // Here you would typically mark attendance in Firestore
      } else {
        toast.error("Invalid ticket for this event");
      }
    } catch (e) {
      toast.error("Invalid QR Code FORMAT");
    }
    // Optional: wait a moment before allowing next scan if using continuous
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchEvent = async () => {
      try {
        if (isDemoMode) {
          setTimeout(() => {
            if (isMounted) {
              const mockEvent = MOCK_EVENTS.find(e => e.id === id || e.id === String(id));
              setEvent(mockEvent || null);
              setLoading(false);
            }
          }, 500);
          return;
        }

        if (id) {
          const eventRef = doc(db, 'events', id);
          const eventSnap = await getDoc(eventRef);
          
          if (eventSnap.exists()) {
            setEvent({ id: eventSnap.id, ...eventSnap.data() });
          } else {
            // Check mock data as fallback if not found in db
            const mockEvent = MOCK_EVENTS.find(e => e.id === id || e.id === String(id));
            setEvent(mockEvent || null);
          }
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        const mockEvent = MOCK_EVENTS.find(e => e.id === id || e.id === String(id));
        setEvent(mockEvent || null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvent();
    
    return () => { isMounted = false; };
  }, [id, isDemoMode]);

  const handleRsvp = async () => {
    if (!user) {
      toast.error('Please sign in to RSVP');
      return;
    }
    if (isDemoMode) {
      toast.success('RSVP status updated (Demo Mode)');
      return;
    }

    setProcessingRsvp(true);
    try {
      const eventId = id as string;
      const isRegistered = profile?.registeredEvents?.includes(eventId);
      const userRef = doc(db, 'users', user.uid);
      const eventRef = doc(db, 'events', eventId);
      
      if (isRegistered) {
        await updateDoc(userRef, {
          registeredEvents: arrayRemove(eventId)
        });
        // We only update event attendees if the event actually exists in db, but here we optimistically do it and catch error if it's mock
        try {
          await updateDoc(eventRef, { attendees: arrayRemove(user.uid) });
        } catch(e) {}
        toast.success("You have cancelled your RSVP");
      } else {
        await updateDoc(userRef, {
          registeredEvents: arrayUnion(eventId)
        });
        try {
          await updateDoc(eventRef, { attendees: arrayUnion(user.uid) });
        } catch(e) {}
        toast.success("You have successfully RSVP'd for this event!");
      }
    } catch (error) {
      console.error('RSVP error:', error);
      toast.error('Failed to update RSVP status');
    } finally {
      setProcessingRsvp(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center bg-background min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center bg-background min-h-screen">
        <h2 className="font-editorial text-2xl font-bold text-foreground mb-4">Event Not Found</h2>
        <p className="text-muted-foreground mb-6">The event you are looking for does not exist or has been removed.</p>
        <Link to="/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  const speakers = event.speakers || MOCK_SPEAKERS[event.id as string] || MOCK_SPEAKERS.default;

  return (
    <div className="bg-background min-h-screen">
      <SEO title={`${event.title} | Event Details`} description={event.description} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6">
          <Link to="/events" className="inline-flex items-center text-primary hover:underline text-sm font-medium">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="bg-muted/40 border-b border-border p-8 sm:p-10">
            <div className="mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {event.type || 'Event'}
              </span>
            </div>
            
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground mb-6 tracking-tight">
              {event.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-muted-foreground bg-background p-4 rounded-xl border border-border inline-flex shadow-sm">
              <div className="flex items-center">
                <Calendar className="mr-3 h-5 w-5 text-primary" />
                <span className="font-medium text-foreground tabular-nums">{event.date}</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-border"></div>
              <div className="flex items-center">
                <MapPin className="mr-3 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-foreground">{event.location}</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 sm:p-10">
            <h2 className="font-editorial text-2xl font-semibold text-foreground mb-4">About This Event</h2>
            <p className="text-foreground/85 text-base sm:text-lg leading-relaxed mb-8">
              {event.description || 'Join us for this exciting event featuring experts and discussions on the latest developments in medical research and public health.'}
            </p>

            <div className="bg-muted/40 rounded-xl p-6 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Secure Your Spot</h3>
                <p className="text-muted-foreground text-sm">Register early to receive updates and exclusive conference materials.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {profile?.registeredEvents?.includes(event.id) && (
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    onClick={() => setIsTicketModalOpen(true)}
                  >
                    <QrCode className="mr-2 h-5 w-5" /> View Ticket
                  </Button>
                )}
                {isAdminOrEditor && (
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setIsScannerOpen(true)}
                  >
                    <ScanLine className="mr-2 h-5 w-5" /> Scan Tickets
                  </Button>
                )}
                <Button 
                  size="lg"
                  variant={profile?.registeredEvents?.includes(event.id) ? "secondary" : "default"}
                  className="w-full sm:w-auto"
                  disabled={processingRsvp}
                  onClick={handleRsvp}
                >
                  {processingRsvp ? (
                    'Processing...'
                  ) : profile?.registeredEvents?.includes(event.id) ? (
                    'Cancel RSVP'
                  ) : (
                    'RSVP Now'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Speakers Section */}
        <div className="mt-12">
          <div className="flex items-center mb-8 pb-3 border-b border-border">
            <Users className="h-5 w-5 text-primary mr-3" />
            <h2 className="font-editorial text-2xl font-bold text-foreground">Keynote Speakers & Presenters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {speakers.map((speaker: any, index: number) => (
              <Card key={index} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <CardTitle className="font-editorial text-xl mb-1 text-foreground">{speaker.name}</CardTitle>
                      <CardDescription className="text-primary font-medium">{speaker.role}</CardDescription>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-editorial font-bold text-lg uppercase border border-primary/20 shrink-0">
                      {speaker.name.charAt(0)}{speaker.name.split(' ')[1]?.charAt(0)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-foreground/85 mb-3 flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {speaker.affiliation}
                  </p>
                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {speaker.bio}
                  </p>
                  <div className="mt-5 pt-4 border-t border-border">
                    <Link to={`/author/${encodeURIComponent(speaker.name)}`} className="inline-flex items-center text-sm font-medium text-primary hover:underline transition-colors">
                      View Research Profile <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {/* Ticket Modal */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Your Event Ticket</DialogTitle>
            <DialogDescription>Show this QR code at the event check-in desk.</DialogDescription>
          </DialogHeader>
          {user && (
            <div className="flex flex-col items-center justify-center p-6 bg-muted/40 rounded-xl border border-border mt-4">
              <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <QRCodeSVG
                  value={JSON.stringify({ eventId: event.id, userId: user.uid, type: 'event_ticket' })}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <h3 className="font-editorial font-bold text-center text-lg text-foreground">{event.title}</h3>
              <p className="text-muted-foreground text-sm mt-1 tabular-nums">{event.date}</p>
              <p className="text-muted-foreground text-sm">{event.location}</p>
              
              <div className="mt-6 w-full pt-4 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Attendee:</span>
                  <span className="font-medium text-foreground">{profile?.displayName || user.email}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-muted-foreground">Ticket ID:</span>
                  <span className="font-mono text-foreground text-xs">{btoa(`${event.id}-${user.uid}`).substring(0, 10).toUpperCase()}</span>
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
