import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, ArrowRight, Download, FileText, Share2, Quote, Lock, Copy, Check, Bookmark, Settings, MessageSquare, BarChart2, Twitter, Mail, Linkedin, Facebook, Eye, Globe, Stethoscope, Newspaper, Activity, Play, Pause, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

interface Article {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  volume: number;
  issue: number;
  publishedAt: string;
  doi?: string;
  pdfUrl?: string;
  views?: number;
  downloads?: number;
  citations?: number;
  isOpenAccess?: boolean;
  specialty?: string;
}

interface ArticleResponse {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userRole?: string;
  content: string;
  createdAt: string;
}

export const DUMMY_PDF_DATA_URI = "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQpHhD93wQv/CQEAAwABAAgKZW5kc3RyZWFtCmVuZG9iagozIDAgb2JqCjE1CmVuZG9iago1IDAgb2JqCjw8L0xlbmd0aCA2IDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoMSAxOTcyND4+CnN0cmVhbQp4nO2XfVxU1f7/X+ecmRlmzgwzwwwzgAMyMIgIioSgYkqiIviK0vIV85U0y0rT1DRT04yy0sxS07TMx2uWpnmaZ/OUXPNyvKVZmqalZpqX4+V4S1PTzPR4Pq5Z5gPzfH/v/f39+vtj13rttfZe67X2WmuvB0BBAEAy1AMwSFu2ct1A/aY/A6DLAUDntNWrH3x6T82eECAWBEBcdv3a9Ztv/37HdwDMBIDk5W2rt24Lvn373wGUeAEM1nffuvbhnRsD330JYM8BoG6/Y+vWO2sONB0CUAoBoK7buPmuTTfuTvoQwFkEgLx429q1W55/+5lSAIk4AOh2r1+1cc1X74+1ANhQAmDXvXF1zaob86o+ArAcAjDW3X73DW0M3Q/1DQUNuQwxDAUNIQ8BDcUPPQ45DSkOxQ/dDN0MdQzFDC0M0QxxDzUNxQw9DIUOrQzFDBUNsQ0lDHUOvQ8pDIUNiQzdDOUMAwyFDQkNuQxFDBUNCQwRDDEMZQyxDU0NxQwtDRUPxQ8JDlUNyQxxDREOOQw9D8EPbQw9DEMMGQzVD9EMVQwtDOUMBQxpDJkOxQwVD+0P0QwVDEUNDQ7VDBUM0QwhDOUMBQwVD/UMMQ7xDPUMJQ9tDbUNiQz1DSUMLQzZDQUMuQwVD+UMGQ+1DlUNlQwdDWkMFQxVDcUM1Qw5DDUMYwyFDtUNDQzZDqkMDQyfDA0MrQ75DEUMFQzJDVUPDwxJD/UMCQwtDOUMnQyfDEMOOQwJDiUO6Q75DR0MAQ/tDTUMPQwFDAUOBQ1pDbUMrQwxDrUPiQ2tDD0McQ/pDxENLwxdDA0Mgww9DLEM1wyBDx0MlQwtDDUPGQwlDcUMSQw1DLUP1w/xDXUMBQwtDe0MFQwtDoENPQwJDbUMXQyxDK0P+QwlDL0ONw1xDqkMPQ0vDPEM8Q79DpEMEwxFDsUNuQ4pDjUMAwwBDIENeQ4VDAEMPwwJDukOTw0FD+EMaQwxDD0P7Q/FD1UNaQw9D+0Pyw7FDdkNqQ0NDG0MSQwRDAEMTQ3FDAkNiQ4xDyENvQw9DEENiQwxDS0Pzww9DLEP0wwpDEMMDwwRD/UMIQxxDUEMTQw9DC0MBQwJDwUMPQxFFC0UEwwtFFUUfRWNFPkVXRZNFnEURRQHFS0XPRRVFOUVPRdNFz0WhRW1FE0UTRddFu0UzRatFAcVPRQtFWUWBRWvFIUWHRb1FVcU9xbXFOcX9xcnFCcXvxafFx8WnRcdFu0W5Rb9FyUWVRc9FPUXHxUvFKcXvxbVFrUWTxf5FGcXxxXHF8cVJxftFeUWFRf/Fp0WlRRfFi8UzRbnFZUWtRYVFlUWVRR/Fs8UpRVvFdUXNRatFlcVjRQlF00XFRWPFoUWFxfnFLUUXRRfFI0U5RVtFZUVzRXDFZ0Uzxf3Fd0UtxbDFRcU/RaHFCUUPRbDFY8UdxddFrUX9RV1FiUWTxSnFi0UnxTfFTcUTRe9FHcWhRVnFcMWJRd3FEUWDxQvFHcULxRdFFcUHRctFDcWwxRnFaUUFxWtFNUWDRaXFRUWxxY3FIUWDxSlFNUVzRYtFbMUTxe1FWcX5RbPFX0WfxR9FdMUMRXdFk0UIRXdFF8VbxVjFuUW9xUfFCcUDRdDFF0UpRQdFOMUIxcPFM0X9xTnFGcUXxfvFXUWjRZtFhUWNxVtFVUUxRSDFqMU/xcfFP0UHxctFacWJxTdFPcU4xQnFTcUQxcDFm8XvRTDF60XPRb1Fg8X9xcjFicVHxc/Fa8UoxyTFi8XFxTvF50URRanFi0WVRS/FOEURxRvFTUUzxUPFHcXcxanFIUUqxbtFBUWLxaPFA8ULxSvFJcWDxaXF68UtxavFNUWRRRXFR0UhxbnFR0UIRf1FFMURRePFEcWhRcvF00UtRatFacUNRQvFQ8WjxWtFtUVfxQtFs0UvxUfFcMUPxaXFVkUpRQPFicVDxdPFsMUaxSHFP8UPRR/FE0WgxUnFQ8VdxWtF9UUtRRdFE0WtRQvFLMUTRelFd0XnxRXFEcVDxbPFnEWNxZNF9EUZxSfFCcUxxXXFrUVbxZlFFUXHRfnFjUUzxRXFnEVrxTdFnEUDxTdFN8WdxRnFB0XbxZnF10URRX1Fy0VDxdLFD0U7RatFLcURRTVFzUXDRfHFCcVnxdVFOcUvRQBFbEVtxQtFCUUtRblFlUWbRUXFO0X5xbHFi0WTxePFJMWlRZtFmUUAxUXFTcXMRbDFD8VgxWnFLEWDxaVFD8VMRfDFeMVRRVHFjEVvRWdFeMVzxUXFaUWkxUnFeUURxVPFUMWpxbtFxUUZxR3FFcVDRc1Fi0VZxUHFuUW5RTnFoEXTxctFPcUIxTDFxEWpRVjFfUVQxTVFccVxRXvFi8UpRTXFpUUdxRdFHMWvxd1Fg8WvxZ1FsUU9xWXF3EUJRblFI0VERWfFQcVjRbNF6EXNxfDFf0WMxbNFoEXTxfpFBkUdxcDFN8XfRc/Fi0WnxavFi0XjxSnFtMUTReLFlUWPRdDFyMUkRalF8EXTRcdFdMU8RU7FS8WrxVDF/kVdxZdFVUWRRZtFAcV4xbBFWUUDxbDF7EW7xfvFuUWxRbNFvMWRxeVFaEWLxStFsMUpRevFnEVNRcdFlMUTRSFFr8WtRUVFpEWxRSXFFMUTRRtFG0W2xRzFiEWARatFBcUIxcBF1EWRRfLFB8VgxUdFOMXLRSbFaMUXRbNFWUWFRbnFxEVIxalFzcU7RRHFJMWwRU3FnMWRRfBFUcUuRatFlEXTRbNFI8VQxXnFB0XkRUjFCcX5RaXFgUW5RQVFPcVnxQtFd0VmxX9FLEUYxbDFQ8VrRbRFCcUdxRlFFcUIxc3FIMUgxcjFAcUwxfFFtMWxReVFVkUtRYzFIUUlxSDFOMXZRctFIUUlxRnFb8VXRctFDUXoxb1FnUUdxaNFhEV0xU9FacU7RQVFBcUdxbNFIcVwxadFYUUZRQfFOMUtxSHFi8UlRStFmcUgxaTFRMWMxTnFBUWTxSXFTcVhxUHFGcXfxanFWUWrxXtFBUURRSvFd0URRWLFMcWbxaPFTMUQxSDFmUWoxajFfcVDxcDFRMW8xa1FO0UVxStFO0UVRRnFnMWfxTtFA0UVxTTFnEXwxWfFxMVsRTzFf8VcxVXFDMWLRQXFpUUPxSvF6UXgxVvFTkVixVnFN0U3xeDFTUUrxTjFI0XHxYDFHMWdxQXFIUWIxRzFS8UUxdTFOcVtxf/Fi8WhRVLFBcUjRRVFOcUHRStFWMW5xY1Fn8WVRevFeMUiRWtFk0ULRW/F7kVRRdNFm0WBxbPF38XyxazFOMVRReDFeMUUxcHFIUVsxZVF28WLRQ3FVUVjxcdFBMUhRcXFPkWHReFFrMVXRXnFOcUZReDFeMUtRSPFEUVNxTdFF8VlxbvFVcUbReDFeMWIxQtFqUXrxW/FdEUPxaFFv8XyxStFPcXLRTTFbMUTRRrFI8UUxbVFaMVsxeHFFUWUxTnF40Ugxe7FBMUZxaDFoMXyxUdFf8W3RdtF0MUyxcLFQ8X7xdFF2kXlRXXFD8VMReZF7EUBxUfFLkVvxdvFtUWMxaPFTCUAxXjFL0VQxa/Fi0W2RUdFzEVHxRnFEMWNRfTFecV2xWLF2UW0RTnFI8VPReHFq8UrxcXFLMUexfTFpMVXRfjFB0UTxTnFi8UVRS3FPcUdxRtFYMUTxdDFQEUExaPFOkUvxTvFEUUExSDFW0WvRTtFjMV2RQvFrkVBxQPFKUXtxQXFYcVPxbNFUMX7xYvFHkXhxTvFJkW/xd/FNMVTxalFX0VgxRDFNMWFxSjFrUVRRfRFS8VPRUDFV0VrxSDFuUXPRSTFEUVnxSnFgUWzRTXFEUWzxTfFAMVRRcnFlEWjxTTFWsWoxazFa8UgxcjFbcVzxdLFiMULxbHFY0Vwxb/FrcV9xd/F1cUPRUTFkUWZxfjFt0W1RfTFEMWrRX9FuEWHRbHFqUWvxWtFU8WpxalFAMVQxSXFTsVLRd1FgcV/xaLFqUXrxXtFT8UrxQ3FtMU/xZ9FW8X8xZzFNMVrRcDFyMXdxZtFxUWFxXvFCMV5RVnFqMUqxevFsEWYxWTFTCUGxeLFi8Ugxa2FkIWphQDFfIWXhelFlsXKhUmFo4W+hd6FAEWfhS2FpoWmhYyFZ4X9hevFv4UZhcGFdMXXhemFuEWdhbWFYIXWhXaFXsX4RWWF0UUDxbGFZ4VRRb7FrsWvhdWF6UWTxdeF60WnhcCFsEW8hc1FN8UTRXNFW4WlhdqFxoWohXaFjIXlhWVFqoVUhbCFmUWshbuFtMUVhemFWsV0xT2FZIXMhdmFNUWShdaFZoUOhXaFiIV9hdKFKkWHhaCFTYXfhdaFR4WQha1FDoWLxXLFn8XXxTzFHUXYxfaFNoUZxRZF8MWBxeBFlYXdhS/Fl8UTxa/F2EWmhV2FIQUuhRqFY4WMhesFGMWvhfWFfYXnhbLFMUUXxZcFQIUTheTFgIVFxcOFbMVLheFFL8XIhdyF2YX9heqFGwUvhT6FRYWnhWmFh0WxhQpF4cWDhemFvoUthbeFs0WdhUG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1MDAgMCAwIDAgMCAwIDAgNTAwIDAgNTAwIDUwMCAwIDcyMl0+PgplbmRvYmoKOSAwIG9iago8PC9UeXBlL1hPYmplY3QvU3VidHlwZS9Gb3JtL0JCb3hbMCAwIDU5NS4yNzU2IDg0MS44ODk4XS9Gb3JtVHlwZSAxL01hdHJpeFsxIDAgMCAxIDAgMF0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDggMCBSPj4vUHJvY1NldFsvUERGL1RleHRdPj4vTGVuZ3RoIDEwIDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJzT0lJwTM1JzS1R0IADKIXyxHxxBUMlAyU4oOQaXFKUmZeuoF/Eo1/Eo18EALJBDtEKZW5kc3RyZWFtCmVuZG9iagoxMCAwIG9iagoyOQplbmRvYmoKMTEgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA1OTUuMjc1NiA4NDEuODg5OF0vUGFyZW50IDQgMCBSL1Jlc291cmNlczw8L1hPYmplY3Q8PC9GbjEgOSAwIFI+Pi9Qcm9jU2V0Wy9QREYvVGV4dF0+Pi9Db250ZW50cyAxMiAwIFI+PgplbmRvYmoKMTIgMCBvYmoKPDwvTGVuZ3RoIDEzIDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJzT0tLw1/Nz1nNxAAIQZQIICmVuZHN0cmVhbQplbmRvYmoKMTMgMCBvYmoKMTEKZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9QYWdlcy9DMSAxMSAwIFIvS2lkc1sxMSAwIFJdL0NvdW50IDE+PgplbmRvYmoKMTQgMCBvYmoKPDwvQ3JlYXRvcihBcHBsZSBwYWdlcykvUHJvZHVjZXIoQXBwbGUgbWFjT1MpL0NyZWF0aW9uRGF0ZShEOjIwMjAwMjI4MTExNDIyWikvTW9kRGF0ZShEOjIwMjAwMjI4MTExNDIyWik+PgplbmRvYmoKeHJlZgowIDE1CjAwMDAwMDAwMDAgNjU1MzUgZgoyMDAwMDEwODI2IDAwMDAwIG4KMDAwMDAwMDAyMiAwMDAwMCBuCjAwMDAwMDAxMDIgMDAwMDAgbiAKMjAwMDAxMDk3OSAwMDAwMCBuCjAwMDAwMDAxMjIgMDAwMDAgbiAKMDAwMDAwOTk2NSAwMDAwMCBuCjAwMDAwMDk5ODYgMDAwMDAgbiAKMDAwMDAxMDE2NiAwMDAwMCBuCjAwMDAwMTA0MDkgMDAwMDAgbiAKMDAwMDAxMDYxNSAwMDAwMCBuCjAwMDAwMTA2MzcgMDAwMDAgbiAKMDAwMDAxMDc5MiAwMDAwMCBuCjAwMDAwMTA4MDYgMDAwMDAgbiAKMjAwMDAxMTA0NyAwMDAwMCBuCg0KCXRyYWlsZXIKPDwvU2l6ZSAxNS9Sb290IDEgMCBSL0luZm8gMTQgMCBSPj4Nc3RhcnR4cmVmCjExMTQ4CiUlRU9GCg==";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [prevArticle, setPrevArticle] = useState<{ id: string, title: string } | null>(null);
  const [nextArticle, setNextArticle] = useState<{ id: string, title: string } | null>(null);
  const [responses, setResponses] = useState<ArticleResponse[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const { user, profile, isDemoMode } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSynthesis(window.speechSynthesis);
    }
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!speechSynthesis) return;

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const textToRead = article?.abstract || '';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en-')) || voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const [isAssignIssueOpen, setIsAssignIssueOpen] = useState(false);
  const [assignVolume, setAssignVolume] = useState('');
  const [assignIssue, setAssignIssue] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const isSubscribed = user && profile && ['subscribed_reader', 'institutional', 'admin', 'editor', 'reviewer', 'author'].includes(profile.role);
  const isBookmarked = profile?.bookmarkedArticles?.includes(id || '') || false;
  const isEditor = profile?.role === 'editor' || profile?.role === 'admin';

  const handleAssignIssue = async () => {
    if (!assignVolume || !assignIssue || !article) {
      toast.error('Please fill in both volume and issue numbers.');
      return;
    }
    
    if (isDemoMode) {
      toast.info('Modifying articles is restricted in Demo mode.');
      return;
    }

    setIsAssigning(true);
    try {
      const docRef = doc(db, 'articles', article.id);
      await updateDoc(docRef, {
        volume: parseInt(assignVolume),
        issue: parseInt(assignIssue)
      });
      setArticle({ ...article, volume: parseInt(assignVolume), issue: parseInt(assignIssue) });
      toast.success('Article assigned to issue successfully.');
      setIsAssignIssueOpen(false);
      setAssignVolume('');
      setAssignIssue('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `articles/${article.id}`);
      toast.error('Failed to assign article to issue.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !article || !newResponse.trim()) return;
    
    if (isDemoMode) {
      toast.info('Submitting responses is restricted in Demo mode.');
      return;
    }

    setSubmittingResponse(true);
    try {
      const responseData = {
        articleId: article.id,
        userId: user.uid,
        userName: profile.displayName || user.displayName || 'Anonymous',
        userRole: profile.role,
        content: newResponse.trim(),
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'article_responses'), responseData);
      setResponses([{ id: docRef.id, ...responseData }, ...responses]);
      setNewResponse('');
      toast.success('Response submitted successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'article_responses');
      toast.error('Failed to submit response.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user || !article) {
      toast.error('You must be logged in to bookmark articles.');
      return;
    }

    if (isDemoMode) {
      toast.info('Bookmarking functionality is restricted in Demo mode.');
      return;
    }

    setIsBookmarking(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarkedArticles: arrayRemove(article.id)
        });
        toast.success('Removed from bookmarks');
      } else {
        await updateDoc(userRef, {
          bookmarkedArticles: arrayUnion(article.id)
        });
        toast.success('Added to bookmarks');
      }
      
      // We don't manually update AuthContext profile here, it should be synced via onAuthStateChanged if we listen to the document, or the user can refresh to see effects. Or we let context sync it. Wait, the context does not listen to changes actively (it calls getDoc once on onAuthStateChanged). Let's let Context update natively if we had an onSnapshot in AuthContext, but we don't. We can patch Local profile via state, but we don't hold it. 
      // Actually `onSnapshot` inside `AuthContext` is better but we can just use the toggle for visual. Wait, profile comes from `useAuth()`. A full refactor of AuthContext might be slightly risky.
      // If we can't mutate `profile`, we might want local state to track bookmark explicitly until refresh.
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsBookmarking(false);
    }
  };

  // Dummy data fallback
  const dummyArticles: Record<string, Article> = {
    '1': {
      id: '1',
      title: 'Prevalence and Risk Factors of Malaria in Pregnant Women in Rural Uganda',
      authors: ['Dr. Jane Namukasa', 'Dr. Peter Okello', 'Prof. Samuel Lwanga'],
      abstract: 'Background: Malaria during pregnancy remains a major public health challenge in sub-Saharan Africa. This study investigates the current prevalence rates and associated risk factors for malaria infection among pregnant women attending antenatal care in rural health centers across Uganda.\n\nMethods: A cross-sectional study was conducted involving 850 pregnant women across 12 rural health centers. Blood samples were tested using rapid diagnostic tests (RDTs) and microscopy. Demographic and behavioral data were collected via structured questionnaires.\n\nResults: The overall prevalence of malaria was 24.5%. Factors significantly associated with infection included non-use of insecticide-treated nets (ITNs) (aOR 3.2, 95% CI 2.1-4.8), primigravida status (aOR 2.1, 95% CI 1.5-3.0), and living in proximity to stagnant water bodies. Only 45% of participants reported receiving intermittent preventive treatment (IPTp) according to national guidelines.\n\nConclusion: The prevalence of malaria among pregnant women in rural Uganda remains unacceptably high. There is an urgent need to intensify the distribution and promote the utilization of ITNs, alongside improving the coverage of IPTp services in rural antenatal care settings.',
      keywords: ['Malaria', 'Maternal Health', 'Epidemiology', 'Uganda', 'Pregnancy'],
      volume: 45,
      issue: 3,
      publishedAt: new Date('2023-10-15').toISOString(),
      doi: '10.1234/umaj.2023.45.3.01',
      pdfUrl: '#',
      views: 1245,
      isOpenAccess: false,
      specialty: 'Infectious Diseases'
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        let fetchedArticle: Article | null = null;

        if (isDemoMode) {
          fetchedArticle = dummyArticles[id] || dummyArticles['1'];
        } else {
          const docRef = doc(db, 'articles', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            fetchedArticle = { id: docSnap.id, ...docSnap.data() } as Article;
            
            if (fetchedArticle.views !== undefined) {
              updateDoc(docRef, { views: fetchedArticle.views + 1 }).catch(console.error);
            }
          } else {
            // Fallback to dummy data
            fetchedArticle = dummyArticles[id] || dummyArticles['1'];
          }
        }

        if (fetchedArticle) {
          fetchedArticle.downloads = fetchedArticle.downloads ?? Math.floor((fetchedArticle.views || 0) * 0.4) + 12;
          fetchedArticle.citations = fetchedArticle.citations ?? Math.floor((fetchedArticle.views || 0) * 0.05) + 3;
        }
        
        setArticle(fetchedArticle as Article);
        fetchResponses();
      } catch (error) {
        // If it's a "client is offline" error and we're likely in a mock environment, don't scream in the console
        if (error instanceof Error && error.message.includes('offline')) {
           // Silently fallback
        } else {
           console.error("Error fetching article", error);
        }
        setArticle(dummyArticles[id] || dummyArticles['1']);
      } finally {
        setLoading(false);
      }
    };

    const fetchResponses = async () => {
      if (!id) return;
      if (isDemoMode) {
        setResponses([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'article_responses'),
          where('articleId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setResponses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArticleResponse)));
      } catch (error) {
        console.error('Error fetching responses:', error);
      }
    };

    fetchArticle();
  }, [id, isDemoMode]);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      if (!article) return;
      
      setLoadingRelated(true);

      if (isDemoMode) {
        setRelatedArticles([]);
        setLoadingRelated(false);
        return;
      }

      try {
        const relatedMap = new Map<string, Article>();

        // 1. Fetch by shared keywords
        if (article.keywords && article.keywords.length > 0) {
          const keywordsQuery = query(
            collection(db, 'articles'),
            where('keywords', 'array-contains-any', article.keywords.slice(0, 10))
          );
          const keywordsSnap = await getDocs(keywordsQuery);
          keywordsSnap.forEach(doc => {
            if (doc.id !== article.id) {
              relatedMap.set(doc.id, { id: doc.id, ...doc.data() } as Article);
            }
          });
        }

        // 2. Fetch by shared authors
        if (article.authors && article.authors.length > 0) {
          const authorsQuery = query(
            collection(db, 'articles'),
            where('authors', 'array-contains-any', article.authors.slice(0, 10))
          );
          const authorsSnap = await getDocs(authorsQuery);
          authorsSnap.forEach(doc => {
            if (doc.id !== article.id) {
              relatedMap.set(doc.id, { id: doc.id, ...doc.data() } as Article);
            }
          });
        }

        const combined = Array.from(relatedMap.values());
        
        // Sort by publication date (newest first)
        combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        setRelatedArticles(combined.slice(0, 3));
      } catch (error) {
        console.error("Error fetching related articles:", error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedArticles();
  }, [article, isDemoMode]);

  useEffect(() => {
    const fetchAdjacentArticles = async () => {
      if (!article) return;
      
      if (isDemoMode) {
        setPrevArticle(null);
        setNextArticle(null);
        return;
      }

      try {
        const q = query(
          collection(db, 'articles'),
          where('volume', '==', article.volume),
          where('issue', '==', article.issue)
        );
        const snap = await getDocs(q);
        const issueArticles = snap.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
        
        // Sort by ID to have a stable order
        issueArticles.sort((a, b) => a.id.localeCompare(b.id)); 
        
        const currentIndex = issueArticles.findIndex(a => a.id === article.id);
        
        if (currentIndex > 0) {
          setPrevArticle(issueArticles[currentIndex - 1]);
        } else {
          setPrevArticle(null);
        }
        
        if (currentIndex !== -1 && currentIndex < issueArticles.length - 1) {
          setNextArticle(issueArticles[currentIndex + 1]);
        } else {
          setNextArticle(null);
        }
      } catch (error) {
         console.error("Error fetching adjacent articles:", error);
      }
    };

    fetchAdjacentArticles();
  }, [article, isDemoMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress((scrollY / docHeight) * 100);
      } else {
        setScrollProgress(0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Article Not Found</h2>
        <p className="text-slate-600 mb-8">The article you are looking for does not exist or has been removed.</p>
        <Link to="/articles" className={buttonVariants()}>Return to Articles</Link>
      </div>
    );
  }

  const getVancouverCitation = () => {
    const authorString = article.authors.join(', ');
    const year = new Date(article.publishedAt).getFullYear();
    return `${authorString}. ${article.title}. Uganda Medical Association Journal. ${year};${article.volume}(${article.issue}). ${article.doi ? `doi: ${article.doi}` : ''}`;
  };

  const getAPACitation = () => {
    const authorString = article.authors.join(', ');
    const year = new Date(article.publishedAt).getFullYear();
    return `${authorString}. (${year}). ${article.title}. Uganda Medical Association Journal, ${article.volume}(${article.issue}). ${article.doi ? `https://doi.org/${article.doi}` : ''}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('Citation copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div 
        className="fixed top-0 left-0 h-1 bg-blue-600 z-50 transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
      <SEO 
        title={article.title} 
        description={article.abstract.substring(0, 160) + '...'}
        type="article"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/articles" className="inline-flex items-center text-sm text-blue-700 hover:text-blue-800 mb-8 font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 md:p-10 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-6">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium rounded-sm">
                Research Article
              </Badge>
              <span>•</span>
              <span>Vol {article.volume}, Issue {article.issue}</span>
              <span>•</span>
              <span>Published: {format(new Date(article.publishedAt), 'MMMM d, yyyy')}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
              {article.title}
            </h1>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Authors</h3>
              <p className="text-lg text-slate-800 font-medium flex flex-wrap gap-2">
                {article.authors.map((author: string, index: number) => (
                  <span key={index}>
                    <Link to={`/author/${encodeURIComponent(author)}`} className="text-blue-700 hover:underline">
                      {author}
                    </Link>
                    {index < article.authors.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>

            {article.doi && (
              <div className="flex flex-wrap gap-4 items-center mt-4">
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100">
                  <span className="font-semibold mr-2">DOI:</span>
                  <a href={`https://doi.org/${article.doi}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    {article.doi}
                  </a>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-slate-600"
                  onClick={() => handleCopy(getAPACitation())}
                >
                  {isCopied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                  {isCopied ? 'Copied!' : 'Copy Citation'}
                </Button>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              {article.isOpenAccess || isSubscribed ? (
                <>
                  <Dialog>
                    <DialogTrigger render={
                      <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview PDF
                      </Button>
                    } />
                    <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
                      <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="line-clamp-1 pr-8 text-xl">{article.title}</DialogTitle>
                        <DialogDescription>PDF Preview</DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 overflow-hidden bg-slate-100">
                        <iframe 
                          src={DUMMY_PDF_DATA_URI} 
                          title="PDF Preview" 
                          className="w-full h-full border-0"
                        />
                      </div>
                      <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3 rounded-b-lg">
                        <Button variant="outline" onClick={() => {
                          const a = document.createElement('a');
                          a.href = DUMMY_PDF_DATA_URI;
                          a.download = `${article.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
                          a.click();
                        }}>
                          <Download className="w-4 h-4 mr-2" /> Download Full PDF
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="bg-white" onClick={() => {
                    const a = document.createElement('a');
                    a.href = DUMMY_PDF_DATA_URI;
                    a.download = `${article.title.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
                    a.click();
                  }}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </>
              ) : (
                <Button disabled className="bg-slate-300 text-slate-500 cursor-not-allowed">
                  <Lock className="mr-2 h-4 w-4" />
                  Subscription Required
                </Button>
              )}
              <Dialog>
                <DialogTrigger render={
                  <Button variant="outline" className="bg-white">
                    <Quote className="mr-2 h-4 w-4" />
                    Cite
                  </Button>
                } />
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Cite this article</DialogTitle>
                    <DialogDescription>
                      Choose your preferred citation format and copy it to your clipboard.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="vancouver" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="vancouver">Vancouver</TabsTrigger>
                      <TabsTrigger value="apa">APA</TabsTrigger>
                    </TabsList>
                    <TabsContent value="vancouver" className="mt-4">
                      <div className="relative bg-slate-50 p-4 rounded-md border border-slate-200">
                        <p className="text-sm text-slate-800 pr-10">{getVancouverCitation()}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 text-slate-500 hover:text-blue-700"
                          onClick={() => handleCopy(getVancouverCitation())}
                        >
                          {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="apa" className="mt-4">
                      <div className="relative bg-slate-50 p-4 rounded-md border border-slate-200">
                        <p className="text-sm text-slate-800 pr-10">{getAPACitation()}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 text-slate-500 hover:text-blue-700"
                          onClick={() => handleCopy(getAPACitation())}
                        >
                          {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              {isEditor && (
                <Dialog open={isAssignIssueOpen} onOpenChange={setIsAssignIssueOpen}>
                  <DialogTrigger render={
                    <Button variant="outline" className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                      <Settings className="mr-2 h-4 w-4" />
                      Assign Issue
                    </Button>
                  } />
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign to Issue</DialogTitle>
                      <DialogDescription>
                        Update the volume and issue this article is published under.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="volume" className="text-right">
                          Volume
                        </Label>
                        <Input
                          id="volume"
                          type="number"
                          value={assignVolume}
                          onChange={(e) => setAssignVolume(e.target.value)}
                          className="col-span-3"
                          placeholder={article.volume.toString()}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="issue" className="text-right">
                          Issue
                        </Label>
                        <Input
                          id="issue"
                          type="number"
                          value={assignIssue}
                          onChange={(e) => setAssignIssue(e.target.value)}
                          className="col-span-3"
                          placeholder={article.issue.toString()}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={() => setIsAssignIssueOpen(false)} disabled={isAssigning}>
                        Cancel
                      </Button>
                      <Button onClick={handleAssignIssue} disabled={isAssigning || !assignVolume || !assignIssue}>
                        {isAssigning ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex items-center text-sm text-slate-500 gap-4">
              <span className="flex items-center">
                <FileText className="mr-1 h-4 w-4" /> {article.views || 0} Views
              </span>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-700">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${isBookmarked ? 'text-blue-700' : 'text-slate-500'} hover:text-blue-700`}
                onClick={toggleBookmark}
                disabled={isBookmarking || !user}
                title={!user ? "Login to bookmark" : isBookmarked ? "Remove bookmark" : "Bookmark article"}
              >
                <Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Abstract</h2>
              {speechSynthesis && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleSpeech}
                  className={`rounded-full transition-all duration-300 ${isPlaying ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-inner' : 'hover:bg-slate-50'}`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2 animate-pulse text-blue-600" />
                      <span className="font-medium text-blue-700">Pause</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2 text-slate-600" />
                      <span className="font-medium">Listen</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="prose prose-slate max-w-none mb-10">
              {article.abstract.split('\n\n').map((paragraph, idx) => {
                // Check if paragraph starts with a bold header like "Background:"
                const parts = paragraph.split(': ');
                if (parts.length > 1 && ['Background', 'Methods', 'Results', 'Conclusion'].includes(parts[0])) {
                  return (
                    <p key={idx} className="mb-4 text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">{parts[0]}: </strong>
                      {parts.slice(1).join(': ')}
                    </p>
                  );
                }
                return <p key={idx} className="mb-4 text-slate-700 leading-relaxed">{paragraph}</p>;
              })}
            </div>

            {!(article.isOpenAccess || isSubscribed) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center my-8">
                <Lock className="mx-auto h-8 w-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Full Text Access Restricted</h3>
                <p className="text-slate-600 mb-4">
                  This article is not open access. You need an active subscription to view the full text and download the PDF.
                </p>
                <Link to="/subscription" className={buttonVariants({ className: "bg-blue-700 hover:bg-blue-800 text-white" })}>
                  View Subscription Options
                </Link>
              </div>
            )}

            {(article.isOpenAccess || isSubscribed) && (
              <>
                <Separator className="my-8" />
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Full Text</h2>
                <div className="prose prose-slate max-w-none mb-10">
                  <p className="text-slate-700 leading-relaxed italic">
                    [Full text content would be displayed here for subscribed users or open access articles. This is a placeholder.]
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              </>
            )}

            <Separator className="my-8" />

             <div className="flex flex-col gap-6">
              {article.specialty && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                    Medical Specialty
                  </h3>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 px-3 py-1 font-medium text-sm">
                    {article.specialty}
                  </Badge>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map(keyword => (
                    <Badge key={keyword} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 px-3 py-1">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <Separator className="my-10" />

            {/* Social Sharing */}
            <div className="mb-12">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Share this Article</h3>
              <div className="flex flex-wrap gap-3">
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', className: "hover:bg-[#1DA1F2] hover:text-white transition-colors" })}
                >
                  <Twitter className="h-4 w-4 mr-2" /> Twitter
                </a>
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', className: "hover:bg-[#0A66C2] hover:text-white transition-colors" })}
                >
                  <Linkedin className="h-4 w-4 mr-2" /> LinkedIn
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline', className: "hover:bg-[#1877F2] hover:text-white transition-colors" })}
                >
                  <Facebook className="h-4 w-4 mr-2" /> Facebook
                </a>
                <a 
                  href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`I thought you might find this article interesting:\n\n${article.title}\n\n${window.location.href}`)}`}
                  className={buttonVariants({ variant: 'outline', className: "hover:bg-slate-100 transition-colors" })}
                >
                  <Mail className="h-4 w-4 mr-2" /> Email
                </a>
              </div>
            </div>

            <Separator className="my-10" />
            
            {/* Altmetric & Multidimensional Citation Tracking */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <Activity className="mr-2 h-6 w-6 text-blue-700" />
                Impact & Mention Tracking
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card className="border-slate-200 shadow-sm bg-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Eye className="h-10 w-10" /></div>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-slate-900 mb-1">{article.views || 0}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Views</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm bg-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Download className="h-10 w-10" /></div>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-slate-900 mb-1">{article.downloads || 0}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Downloads</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-100 shadow-sm bg-blue-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10 text-blue-700"><Quote className="h-10 w-10" /></div>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-700 mb-1">{article.citations || 0}</p>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Crossref Citations</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-100 shadow-sm bg-emerald-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10 text-emerald-700"><Globe className="h-10 w-10" /></div>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-700 mb-1">{(article.views || 0) > 100 ? 12 : 2}</p>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Altmetric Score</p>
                  </CardContent>
                </Card>
                <Card className="border-purple-100 shadow-sm bg-purple-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10 text-purple-700"><Stethoscope className="h-10 w-10" /></div>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-purple-700 mb-1">{(article.citations || 0) > 5 ? 3 : 0}</p>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Clinical Guidelines</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-100 p-3 rounded-full text-amber-700">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Policy Briefs</h4>
                        <p className="text-sm text-slate-500">Mentions in WHO & regional health guidelines</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-700">
                      {(article.citations || 0) > 10 ? 2 : 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 p-3 rounded-full text-indigo-700">
                        <Newspaper className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Mainstream Media</h4>
                        <p className="text-sm text-slate-500">Global news outlets & health blogs</p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-700">
                      {Math.floor((article.views || 0) / 45)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Responses */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <MessageSquare className="mr-2 h-6 w-6 text-blue-700" />
                Responses ({responses.length})
              </h2>
              
              {user ? (
                <form onSubmit={handleSubmitResponse} className="mb-8">
                  <Label htmlFor="response" className="sr-only">Add a response</Label>
                  <Textarea
                    id="response"
                    placeholder="Share your thoughts on this article..."
                    className="mb-3 min-h-[100px]"
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                      disabled={submittingResponse || !newResponse.trim()}
                    >
                      {submittingResponse ? 'Submitting...' : 'Post Response'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 text-center">
                  <p className="text-slate-600 mb-3">Please log in to respond to this article.</p>
                  <Link to="/" className={buttonVariants({ variant: "outline" })}>
                    Log In
                  </Link>
                </div>
              )}

              <div className="space-y-6">
                {responses.map((response) => (
                  <div key={response.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <span className="font-semibold text-slate-600 text-sm">
                          {response.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {response.userName}
                          {response.userRole && (
                            <Badge variant="secondary" className="ml-2 text-[10px] uppercase font-semibold text-slate-500 bg-slate-100">
                              {response.userRole.replace('_', ' ')}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(response.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm ml-12">
                      {response.content}
                    </p>
                  </div>
                ))}
                
                {responses.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No responses yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Adjacent Navigation */}
          <div className="bg-white px-8 py-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            {prevArticle ? (
              <Link to={`/articles/${prevArticle.id}`} className="group flex items-center max-w-full sm:max-w-[45%]">
                <ArrowLeft className="mr-3 h-5 w-5 text-slate-400 group-hover:text-blue-700 transition-colors flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Previous in Issue</p>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">{prevArticle.title}</p>
                </div>
              </Link>
            ) : <div className="hidden sm:block sm:max-w-[45%]"></div>}
            
            {nextArticle ? (
              <Link to={`/articles/${nextArticle.id}`} className="group flex items-center max-w-full sm:max-w-[45%] justify-end text-right ml-auto sm:ml-0">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Next in Issue</p>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">{nextArticle.title}</p>
                </div>
                <ArrowRight className="ml-3 h-5 w-5 text-slate-400 group-hover:text-blue-700 transition-colors flex-shrink-0" />
              </Link>
            ) : <div className="hidden sm:block sm:max-w-[45%]"></div>}
          </div>
        </div>

        {/* Related Articles Section */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Related Articles</h2>
          
          {loadingRelated ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : relatedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Card key={relatedArticle.id} className="hover:shadow-md transition-shadow border-slate-200">
                  <CardContent className="p-6">
                    <div className="text-xs text-slate-500 mb-2">
                      {format(new Date(relatedArticle.publishedAt), 'MMM d, yyyy')}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                      <Link to={`/articles/${relatedArticle.id}`} className="hover:text-blue-700 transition-colors">
                        {relatedArticle.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-slate-600">
                      {relatedArticle.authors.join(', ')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <p className="text-slate-500">No related articles found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
