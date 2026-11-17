import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export function NotificationsMenu() {
  const { user, isDemoMode } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    // In demo mode, we mock the data to avoid permission errors
    if (isDemoMode) {
      const mockNotifications = [
        {
          id: 'demo-1',
          userId: user.uid,
          title: 'Welcome to UMAJ Demo',
          message: 'You are currently browsing the platform in demo mode.',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/dashboard',
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(1);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(fetched);
      setUnreadCount(fetched.filter(n => !n.read).length);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user, isDemoMode]);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDemoMode) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const markAllAsRead = async () => {
    if (isDemoMode) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      return;
    }
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      for (const id of unreadIds) {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      }
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "relative text-muted-foreground hover:text-foreground hover:bg-accent h-9 w-9 rounded-full" })}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white tabular-nums">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[360px] max-w-[calc(100vw-2rem)] p-0" align="end">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <span className="font-semibold text-foreground text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary hover:bg-transparent">
              <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p>You don't have any notifications yet.</p>
            </div>
          ) : (
            <DropdownMenuGroup className="divide-y divide-border">
              {notifications.map(notification => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className={`p-4 cursor-pointer flex flex-col items-start gap-1 focus:bg-muted/60 ${!notification.read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    if (!notification.read) {
                      if (isDemoMode) {
                        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                      } else {
                        updateDoc(doc(db, 'notifications', notification.id), { read: true }).catch(console.error);
                      }
                    }
                    if (notification.link) window.location.href = notification.link;
                  }}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className={`font-medium text-sm ${!notification.read ? 'text-primary' : 'text-foreground'}`}>
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5 ml-2"></span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground/80 mt-1 font-mono tabular-nums">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
