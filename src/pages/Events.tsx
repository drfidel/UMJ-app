import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, getDocs, orderBy, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, MapPin, ArrowRight, Search, CheckCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map event names to approximate lat/lng coordinates in Uganda
const locationCoords: Record<string, { lat: number; lng: number }> = {
  'Kampala Serena Hotel, Kampala': { lat: 0.3186, lng: 32.5855 },
  'Imperial Resort Beach Hotel, Entebbe': { lat: 0.0526, lng: 32.4637 },
  'Mbarara University of Science and Technology': { lat: -0.6163, lng: 30.6565 },
  'Makerere University College of Health Sciences': { lat: 0.3347, lng: 32.5684 },
};

export default function Events() {
  const navigate = useNavigate();
  const { user, profile, isDemoMode } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRsvp, setProcessingRsvp] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Compute filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const queryLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (event.title || '').toLowerCase().includes(queryLower) || 
        (event.location || '').toLowerCase().includes(queryLower) ||
        (event.type || '').toLowerCase().includes(queryLower) ||
        (event.description || '').toLowerCase().includes(queryLower);
        
      const matchesType = typeFilter === 'All' || event.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [events, searchQuery, typeFilter]);

  const handleRsvp = async (eventId: string) => {
    if (!user) {
      toast.error('Please sign in to RSVP');
      return;
    }
    if (isDemoMode) {
      toast.success('RSVP status updated (Demo Mode)');
      return;
    }

    setProcessingRsvp(eventId);
    try {
      const isRegistered = profile?.registeredEvents?.includes(eventId);
      const userRef = doc(db, 'users', user.uid);
      const eventRef = doc(db, 'events', eventId);
      
      if (isRegistered) {
        await updateDoc(userRef, {
          registeredEvents: arrayRemove(eventId)
        });
        await updateDoc(eventRef, {
          attendees: arrayRemove(user.uid)
        });
        toast.success("You have cancelled your RSVP");
      } else {
        await updateDoc(userRef, {
          registeredEvents: arrayUnion(eventId)
        });
        await updateDoc(eventRef, {
          attendees: arrayUnion(user.uid)
        });
        toast.success("You have successfully RSVP'd for this event!");
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP status');
    } finally {
      setProcessingRsvp(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      setLoading(true);
      
      try {
        if (isDemoMode) {
          setTimeout(() => {
            if (isMounted) {
               setEvents([
                  { id: 1, title: 'Annual Uganda Medical Association Scientific Conference', date: 'August 12 - 14, 2026', location: 'Kampala Serena Hotel, Kampala', type: 'Conference', description: 'Join us for the 2026 Annual Scientific Conference featuring keynote speakers, workshops, and abstract presentations on the latest advancements in medical science across East Africa.' },
                  { id: 2, title: 'East African Health Research Symposium', date: 'September 5 - 7, 2026', location: 'Imperial Resort Beach Hotel, Entebbe', type: 'Symposium', description: 'A regional gathering of health researchers to discuss public health challenges, epidemiological trends, and innovative healthcare solutions in the region.' },
                  { id: 3, title: 'National Summit on Maternal & Child Health', date: 'October 20 - 21, 2026', location: 'Mbarara University of Science and Technology', type: 'Summit', description: 'Focused discussions on policy, practice, and research to improve maternal and child health outcomes in Uganda.' },
                  { id: 4, title: 'Workshop on Advanced Clinical Trials Management', date: 'November 10 - 11, 2026', location: 'Makerere University College of Health Sciences', type: 'Workshop', description: 'A hands-on workshop designed for early-career researchers and clinical trial coordinators.' }
               ]);
               setLoading(false);
            }
          }, 800);
          return;
        }

        const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const eventsSnap = await getDocs(eventsQuery);
        
        if (isMounted) {
           const eventsData = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           if (eventsData.length === 0) {
              setEvents([
                 { id: 1, title: 'Annual Uganda Medical Association Scientific Conference', date: 'August 12 - 14, 2026', location: 'Kampala Serena Hotel, Kampala', type: 'Conference' },
                 { id: 2, title: 'East African Health Research Symposium', date: 'September 5 - 7, 2026', location: 'Imperial Resort Beach Hotel, Entebbe', type: 'Symposium' },
                 { id: 3, title: 'National Summit on Maternal & Child Health', date: 'October 20 - 21, 2026', location: 'Mbarara University of Science and Technology', type: 'Summit' },
                 { id: 4, title: 'Workshop on Advanced Clinical Trials Management', date: 'November 10 - 11, 2026', location: 'Makerere University College of Health Sciences', type: 'Workshop' }
              ]);
           } else {
             setEvents(eventsData);
           }
           setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching events", error);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchEvents();
    return () => { isMounted = false; };
  }, [isDemoMode]);

  return (
    <div className="bg-background min-h-screen py-12">
      <SEO 
        title="News & Events" 
        description="Upcoming medical conferences, symposiums, and journal news." 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Conferences & Scientific Gatherings
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground mb-3">News & Events</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
            Stay updated with the latest medical conferences, symposiums, and announcements from the journal community.
          </p>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search by title, location, or keyword..." 
              className="pl-10 w-full bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || 'All')}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Conference">Conference</SelectItem>
                <SelectItem value="Symposium">Symposium</SelectItem>
                <SelectItem value="Summit">Summit</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-12 rounded-xl overflow-hidden shadow-sm border border-border bg-card z-0" style={{ height: '400px' }}>
          <MapContainer 
            center={[1.3733, 32.2903]} 
            zoom={6} 
            scrollWheelZoom={false} 
            style={{ width: '100%', height: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {!loading && filteredEvents.map((event) => {
              const coords = locationCoords[event.location as string];
              if (!coords) return null;
              return (
                <Marker key={event.id} position={[coords.lat, coords.lng]}>
                  <Popup>
                    <div className="font-semibold text-sm mb-1">{event.title}</div>
                    <div className="text-xs text-slate-600">{event.location}</div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-4/5"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">{event.type}</span>
                  <CardTitle className="font-editorial text-xl line-clamp-2 leading-snug text-foreground">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  {(event.description || event.type === 'Announcement') && (
                     <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {event.description || `Read more about the upcoming ${event.title} and join researchers and medical professionals to exchange innovative insights.`}
                     </p>
                  )}
                  <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-start">
                      <Calendar className="mr-2 h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="tabular-nums">{event.date}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-start">
                        <MapPin className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{event.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/events/${event.id}`)}>
                    Learn More
                  </Button>
                  <Button 
                    variant={profile?.registeredEvents?.includes(event.id) ? "secondary" : "default"}
                    className={`flex-1 ${profile?.registeredEvents?.includes(event.id) ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' : ''}`}
                    disabled={processingRsvp === event.id}
                    onClick={() => handleRsvp(event.id)}
                  >
                    {processingRsvp === event.id ? (
                      'Processing...'
                    ) : profile?.registeredEvents?.includes(event.id) ? (
                      <><CheckCircle className="mr-2 h-4 w-4" /> Registered</>
                    ) : (
                      'RSVP Now'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-16 bg-card rounded-lg border border-border shadow-sm">
            <h3 className="font-editorial text-xl font-medium text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria and filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
