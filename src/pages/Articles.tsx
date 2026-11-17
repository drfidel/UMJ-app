import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  FileText,
  Lock,
  Unlock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Quote,
  Copy,
  Check,
  FilterX,
} from 'lucide-react';
import { format } from 'date-fns';
import Fuse from 'fuse.js';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { CURATED_ARTICLES, MEDICAL_SPECIALTIES, JournalArticle } from '@/data/journalData';

export const medicalSpecialties = MEDICAL_SPECIALTIES;

const DUMMY_PDF_DATA_URI =
  'data:application/pdf;base64,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DUUOvQ3dDbkN2w4zDi8M2QwFD1UNyQ2FDoUNTQzlDkUO/QwVDDUMNQzFDEUOqQ7FDr0ONQ8tDFUN/Q/VDEkNiQwtD3UO5Q71DUUNpQ/9DKUObQ21DXkNnQxNDjUMXQ3FDGUMpQ59DDUN/Q59D0UO/Q9FDGUMeQ1FDhUOJQ0RDzUOzQ0NDKUNIQ2ZDlUN1Q/lDMUMlQ2pDp0OFQ9dDikNxQ5ND3UO+Qw1DPUORQ5FDuUN/Q45DWUNhQ1FDzUO3Q6JDFkOxQwpDxUPDQw9DLkOWQ0dD9UMjQwtDQkO1Q5NDVUPdQ1lDuEOLQw1DukMRQyZDf0PzQ99DlUNaQzdD/UNDQ+lD7UNTQw5DJkN6Q/BD50NtQ2dDYUPRQxxDWUNOQy5DAUNKQ31DvENPQ/BDIUNCQzpDiUOJQ5FDc0NpQ8FDhkOFQ99DZUOfQy1DHENfQy1DiUONQ5lDOUNCQzpDYUNIQ11DbEOTQ+RDVUOIQxlDU0MzQxlDC0M3QwZDuUP1Q19DaUMEwxBD1UOUQxpDJUOLQwZDPUNKQxxDLUP1Q2pDVUPuQxtDdUNAwwlDw0NxQ/1DQUNuQwxDAUNIQ8BDcUPPQ45DSkOxQ/dDN0MdQzFDC0M0QxxDzUNxQw9DIUOrQzFDBUNsQ0lDHUOvQ8pDIUNiQzdDOUMAwyFDQkNuQxFDBUNCQwRDDEMZQyxDU0NxQwtDRUPxQ8JDlUNyQxxDREOOQw9D8EPbQw9DEMMGQzVD9EMVQwtDOUMBQxpDJkOxQwVD+0P0QwVDEUNDQ7VDBUM0QwhDOUMBQwVD/UMMQ7xDPUMJQ9tDbUNiQz1DSUMLQzZDQUMuQwVD+UMGQ+1DlUNlQwdDWkMFQxVDcUM1Qw5DDUMYwyFDtUNDQzZDqkMDQyfDA0MrQ75DEUMFQzJDVUPDwxJD/UMCQwtDOUMnQyfDEMOOQwJDiUO6Q75DR0MAQ/tDTUMPQwFDAUOBQ1pDbUMrQwxDrUPiQ2tDD0McQ/pDxENLwxdDA0Mgww9DLEM1wyBDx0MlQwtDDUPGQwlDcUMSQw1DLUP1w/xDXUMBQwtDe0MFQwtDoENPQwJDbUMXQyxDK0P+QwlDL0ONw1xDqkMPQ0vDPEM8Q79DpEMEwxFDsUNuQ4pDjUMAwwBDIENeQ4VDAEMPwwJDukOTw0FD+EMaQwxDD0P7Q/FD1UNaQw9D+0Pyw7FDdkNqQ0NDG0MSQwRDAEMTQ3FDAkNiQ4xDyENvQw9DEENiQwxDS0Pzww9DLEP0wwpDEMMDwwRD/UMIQxxDUEMTQw9DC0MBQwJDwUMPQxFFC0UEwwtFFUUfRWNFPkVXRZNFnEURRQHFS0XPRRVFOUVPRdNFz0WhRW1FE0UTRddFu0UzRatFAcVPRQtFWUWBRWvFIUWHRb1FVcU9xbXFOcX9xcnFCcXvxafFx8WnRcdFu0W5Rb9FyUWVRc9FPUXHxUvFKcXvxbVFrUWTxf5FGcXxxXHF8cVJxftFeUWFRf/Fp0WlRRfFi8UzRbnFZUWtRYVFlUWVRR/Fs8UpRVvFdUXNRatFlcVjRQlF00XFRWPFoUWFxfnFLUUXRRfFI0U5RVtFZUVzRXDFZ0Uzxf3Fd0UtxbDFRcU/RaHFCUUPRbDFY8UdxddFrUX9RV1FiUWTxSnFi0UnxTfFTcUTRe9FHcWhRVnFcMWJRd3FEUWDxQvFHcULxRdFFcUHRctFDcWwxRnFaUUFxWtFNUWDRaXFRUWxxY3FIUWDxSlFNUVzRYtFbMUTxe1FWcX5RbPFX0WfxR9FdMUMRXdFk0UIRXdFF8VbxVjFuUW9xUfFCcUDRdDFF0UpRQdFOMUIxcPFM0X9xTnFGcUXxfvFXUWjRZtFhUWNxVtFVUUxRSDFqMU/xcfFP0UHxctFacWJxTdFPcU4xQnFTcUQxcDFm8XvRTDF60XPRb1Fg8X9xcjFicVHxc/Fa8UoxyTFi8XFxTvF50URRanFi0WVRS/FOEURxRvFTUUzxUPFHcXcxanFIUUqxbtFBUWLxaPFA8ULxSvFJcWDxaXF68UtxavFNUWRRRXFR0UhxbnFR0UIRf1FFMURRePFEcWhRcvF00UtRatFacUNRQvFQ8WjxWtFtUVfxQtFs0UvxUfFcMUPxaXFVkUpRQPFicVDxdPFsMUaxSHFP8UPRR/FE0WgxUnFQ8VdxWtF9UUtRRdFE0WtRQvFLMUTRelFd0XnxRXFEcVDxbPFnEWNxZNF9EUZxSfFCcUxxXXFrUVbxZlFFUXHRfnFjUUzxRXFnEVrxTdFnEUDxTdFN8WdxRnFB0XbxZnF10URRX1Fy0VDxdLFD0U7RatFLcURRTVFzUXDRfHFCcVnxdVFOcUvRQBFbEVtxQtFCUUtRblFlUWbRUXFO0X5xbHFi0WTxePFJMWlRZtFmUUAxUXFTcXMRbDFD8VgxWnFLEWDxaVFD8VMRfDFeMVRRVHFjEVvRWdFeMVzxUXFaUWkxUnFeUURxVPFUMWpxbtFxUUZxR3FFcVDRc1Fi0VZxUHFuUW5RTnFoEXTxctFPcUIxTDFxEWpRVjFfUVQxTVFccVxRXvFi8UpRTXFpUUdxRdFHMWvxd1Fg8WvxZ1FsUU9xWXF3EUJRblFI0VERWfFQcVjRbNF6EXNxfDFf0WMxbNFoEXTxfpFBkUdxcDFN8XfRc/Fi0WnxavFi0XjxSnFtMUTReLFlUWPRdDFyMUkRalF8EXTRcdFdMU8RU7FS8WrxVDF/kVdxZdFVUWRRZtFAcV4xbBFWUUDxbDF7EW7xfvFuUWxRbNFvMWRxeVFaEWLxStFsMUpRevFnEVNRcdFlMUTRSFFr8WtRUVFpEWxRSXFFMUTRRtFG0W2xRzFiEWARatFBcUIxcBF1EWRRfLFB8VgxUdFOMXLRSbFaMUXRbNFWUWFRbnFxEVIxalFzcU7RRHFJMWwRU3FnMWRRfBFUcUuRatFlEXTRbNFI8VQxXnFB0XkRUjFCcX5RaXFgUW5RQVFPcVnxQtFd0VmxX9FLEUYxbDFQ8VrRbRFCcUdxRlFFcUIxc3FIMUgxcjFAcUwxfFFtMWxReVFVkUtRYzFIUUlxSDFOMXZRctFIUUlxRnFb8VXRctFDUXoxb1FnUUdxaNFhEV0xU9FacU7RQVFBcUdxbNFIcVwxadFYUUZRQfFOMUtxSHFi8UlRStFmcUgxaTFRMWMxTnFBUWTxSXFTcVhxUHFGcXfxanFWUWrxXtFBUURRSvFd0URRWLFMcWbxaPFTMUQxSDFmUWoxajFfcVDxcDFRMW8xa1FO0UVxStFO0UVRRnFnMWfxTtFA0UVxTTFnEXwxWfFxMVsRTzFf8VcxVXFDMWLRQXFpUUPxSvF6UXgxVvFTkVixVnFN0U3xeDFTUUrxTjFI0XHxYDFHMWdxQXFIUWIxRzFS8UUxdTFOcVtxf/Fi8WhRVLFBcUjRRVFOcUHRStFWMW5xY1Fn8WVRevFeMUiRWtFk0ULRW/F7kVRRdNFm0WBxbPF38XyxazFOMVRReDFeMUUxcHFIUVsxZVF28WLRQ3FVUVjxcdFBMUhRcXFPkWHReFFrMVXRXnFOcUZReDFeMUtRSPFEUVNxTdFF8VlxbvFVcUbReDFeMWIxQtFqUXrxW/FdEUPxaFFv8XyxStFPcXLRTTFbMUTRRrFI8UUxbVFaMVsxeHFFUWUxTnF40Ugxe7FBMUZxaDFoMXyxUdFf8W3RdtF0MUyxcLFQ8X7xdFF2kXlRXXFD8VMReZF7EUBxUfFLkVvxdvFtUWMxaPFTCUAxXjFL0VQxa/Fi0W2RUdFzEVHxRnFEMWNRfTFecV2xWLF2UW0RTnFI8VPReHFq8UrxcXFLMUexfTFpMVXRfjFB0UTxTnFi8UVRS3FPcUdxRtFYMUTxdDFQEUExaPFOkUvxTvFEUUExSDFW0WvRTtFjMV2RQvFrkVBxQPFKUXtxQXFYcVPxbNFUMX7xYvFHkXhxTvFJkW/xd/FNMVTxalFX0VgxRDFNMWFxSjFrUVRRfRFS8VPRUDFV0VrxSDFuUXPRSTFEUVnxSnFgUWzRTXFEUWzxTfFAMVRRcnFlEWjxTTFWsWoxazFa8UgxcjFbcVzxdLFiMULxbHFY0Vwxb/FrcV9xd/F1cUPRUTFkUWZxfjFt0W1RfTFEMWrRX9FuEWHRbHFqUWvxWtFU8WpxalFAMVQxSXFTsVLRd1FgcV/xaLFqUXrxXtFT8UrxQ3FtMU/xZ9FW8X8xZzFNMVrRcDFyMXdxZtFxUWFxXvFCMV5RVnFqMUqxevFsEWYxWTFTCUGxeLFi8Ugxa2FkIWphQDFfIWXhelFlsXKhUmFo4W+hd6FAEWfhS2FpoWmhYyFZ4X9hevFv4UZhcGFdMXXhemFuEWdhbWFYIXWhXaFXsX4RWWF0UUDxbGFZ4VRRb7FrsWvhdWF6UWTxdeF60WnhcCFsEW8hc1FN8UTRXNFW4WlhdqFxoWohXaFjIXlhWVFqoVUhbCFmUWshbuFtMUVhemFWsV0xT2FZIXMhdmFNUWShdaFZoUOhXaFiIV9hdKFKkWHhaCFTYXfhdaFR4WQha1FDoWLxXLFn8XXxTzFHUXYxfaFNoUZxRZF8MWBxeBFlYXdhS/Fl8UTxa/F2EWmhV2FIQUuhRqFY4WMhesFGMWvhfWFfYXnhbLFMUUXxZcFQIUTheTFgIVFxcOFbMVLheFFL8XIhdyF2YX9heqFGwUvhT6FRYWnhWmFh0WxhQpF4cWDhemFvoUthbeFs0WdhUGFx0WVxSWFbYXShTeFQkWMhdmFMQWjhVwFjoUThc2FQYWdhb+FAcWDhb9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vYmoKOSAwIG9iago8PC9UeXBlL1hPYmplY3QvU3VidHlwZS9Gb3JtL0JCb3hbMCAwIDU5NS4yNzU2IDg0MS44ODk4XS9Gb3JtVHlwZSAxL01hdHJpeFsxIDAgMCAxIDAgMF0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDggMCBSPj4vUHJvZ1NldFsvUERGL1RleHRdPj4vTGVuZ3RoIDEwIDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJzT0lJwTM1JzS1R0IADKIXyxHxxBUMlAyU4oOQaXFKUmZeuoF/Eo1/Eo18EALJBDtEKZW5kc3RyZWFtCmVuZG9iagoxMCAwIG9iagoyOQplbmRvYmoKMTEgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA1OTUuMjc1NiA4NDEuODg5OF0vUGFyZW50IDQgMCBSL1Jlc291cmNlczw8L1hPYmplY3Q8PC9GbjEgOSAwIFI+Pi9Qcm9jU2V0Wy9QREYvVGV4dF0+Pi9Db250ZW50cyAxMiAwIFI+PgplbmRvYmoKMTIgMCBvYmoKPDwvTGVuZ3RoIDEzIDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJzT0tLw1/Nz1nNxAAIQZQIICmVuZHN0cmVhbQplbmRvYmoKMTMgMCBvYmoKMTEKZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9QYWdlcy9DMSAxMSAwIFIvS2lkc1sxMSAwIFJdL0NvdW50IDE+PgplbmRvYmoKMTQgMCBvYmoKPDwvQ3JlYXRvcihBcHBsZSBwYWdlcykvUHJvZHVjZXIoQXBwbGUgbWFjT1MpL0NyZWF0aW9uRGF0ZShEOjIwMjAwMjI4MTExNDIyWikvTW9kRGF0ZShEOjIwMjAwMjI4MTExNDIyWik+PgplbmRvYmoKeHJlZgowIDE1CjAwMDAwMDAwMDAgNjU1MzUgZgoyMDAwMDEwODI2IDAwMDAwIG4KMDAwMDAwMDAyMiAwMDAwMCBuCjAwMDAwMDAxMDIgMDAwMDAgbiAKMjAwMDAxMDk3OSAwMDAwMCBuCjAwMDAwMDAxMjIgMDAwMDAgbiAKMDAwMDAwOTk2NSAwMDAwMCBuCjAwMDAwMDk5ODYgMDAwMDAgbiAKMDAwMDAxMDE2NiAwMDAwMCBuCjAwMDAwMTA0MDkgMDAwMDAgbiAKMDAwMDAxMDYxNSAwMDAwMCBuCjAwMDAwMTA2MzcgMDAwMDAgbiAKMDAwMDAxMDc5MiAwMDAwMCBuCjAwMDAwMTA4MDYgMDAwMDAgbiAKMjAwMDAxMTA0NyAwMDAwMCBuCg0KCXRyYWlsZXIKPDwvU2l6ZSAxNS9Sb290IDEgMCBSL0luZm8gMTQgMCBSPj4Nc3RhcnR4cmVmCjExMTQ4CiUlRU9GCg==';

export default function Articles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterYear, setFilterYear] = useState(searchParams.get('year') || 'all');
  const [filterSpecialty, setFilterSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [filterAccess, setFilterAccess] = useState<'all' | 'open' | 'subscription'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});
  const [citingArticle, setCitingArticle] = useState<JournalArticle | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const { user, profile, isDemoMode } = useAuth();

  useEffect(() => {
    const q = searchParams.get('q');
    const spec = searchParams.get('specialty');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
    if (spec !== null && spec !== filterSpecialty) {
      setFilterSpecialty(spec);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setSearchParams(
      (prev) => {
        if (val) prev.set('q', val);
        else prev.delete('q');
        return prev;
      },
      { replace: true }
    );
  };

  const handleSpecialtyChange = (val: string | null) => {
    const next = val || 'all';
    setFilterSpecialty(next);
    setSearchParams(
      (prev) => {
        if (next !== 'all') prev.set('specialty', next);
        else prev.delete('specialty');
        return prev;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterSpecialty, filterAccess, sortBy]);

  const toggleBookmark = async (articleId: string) => {
    if (!user) {
      toast.error('Please sign in to bookmark articles.');
      return;
    }
    if (isDemoMode) {
      toast.info('Bookmarking is unavailable in preview role mode.');
      return;
    }

    setBookmarkingId(articleId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const isBookmarked = profile?.bookmarkedArticles?.includes(articleId);

      if (isBookmarked) {
        await updateDoc(userRef, { bookmarkedArticles: arrayRemove(articleId) });
        toast.success('Removed from bookmarks');
      } else {
        await updateDoc(userRef, { bookmarkedArticles: arrayUnion(articleId) });
        toast.success('Saved to bookmarks');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setBookmarkingId(null);
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        if (isDemoMode) {
          setArticles(CURATED_ARTICLES);
          setLoading(false);
          return;
        }

        const q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const fetchedArticles = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as JournalArticle[];
          setArticles(fetchedArticles);
        } else {
          setArticles(CURATED_ARTICLES);
        }
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching articles, falling back to curated archive', error);
        }
        setArticles(CURATED_ARTICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [isDemoMode]);

  const filteredArticles = useMemo(() => {
    const filtered = articles.filter((article) => {
      const articleYear = new Date(article.publishedAt).getFullYear().toString();
      const yearMatch = filterYear === 'all' || articleYear === filterYear;
      const specialtyMatch = filterSpecialty === 'all' || article.specialty === filterSpecialty;
      const accessMatch =
        filterAccess === 'all' ||
        (filterAccess === 'open' && Boolean(article.isOpenAccess)) ||
        (filterAccess === 'subscription' && !article.isOpenAccess);
      return yearMatch && specialtyMatch && accessMatch;
    });

    let searched = filtered;
    if (searchTerm.trim()) {
      const fuse = new Fuse(filtered, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'authors', weight: 1.5 },
          { name: 'keywords', weight: 1.5 },
          { name: 'doi', weight: 2 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
      });
      searched = fuse.search(searchTerm).map((result) => result.item);
    }

    return [...searched].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [articles, filterYear, filterSpecialty, filterAccess, searchTerm, sortBy]);

  const years = ['all', ...Array.from(new Set(articles.map((a) => new Date(a.publishedAt).getFullYear().toString())))].sort((a, b) =>
    b.localeCompare(a)
  );

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const hasActiveFilters =
    searchTerm.trim() !== '' || filterSpecialty !== 'all' || filterYear !== 'all' || filterAccess !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterSpecialty('all');
    setFilterYear('all');
    setFilterAccess('all');
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  };

  const formatCitation = (art: JournalArticle, style: 'apa' | 'vancouver' | 'bibtex') => {
    const year = new Date(art.publishedAt).getFullYear();
    const authors = art.authors.join(', ');
    if (style === 'vancouver') {
      return `${authors}. ${art.title}. Uganda Medical Journal. ${year};${art.volume}(${art.issue}). ${art.doi ? `doi:${art.doi}` : ''}`;
    }
    if (style === 'bibtex') {
      const key = `${art.authors[0]?.split(' ').pop()?.toLowerCase() || 'umj'}${year}`;
      return `@article{${key},\n  title={${art.title}},\n  author={${art.authors.join(' and ')}},\n  journal={Uganda Medical Journal},\n  volume={${art.volume}},\n  number={${art.issue}},\n  year={${year}}${art.doi ? `,\n  doi={${art.doi}}` : ''}\n}`;
    }
    return `${authors}. (${year}). ${art.title}. Uganda Medical Journal, ${art.volume}(${art.issue}). ${art.doi ? `https://doi.org/${art.doi}` : ''}`;
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('Citation copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-background min-h-screen py-10 sm:py-12">
      <SEO
        title="Articles"
        description="Browse the latest peer-reviewed medical research, reviews, and case reports from the Uganda Medical Journal."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Page Header */}
        <div className="border-b border-border pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Peer-Reviewed Literature
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground">
              Research & Articles
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
              Explore original investigations, clinical trials, cohort studies, and public health reviews published in the Uganda Medical Journal.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg shrink-0 self-start md:self-auto">
            {(
              [
                { id: 'all', label: 'All Access' },
                { id: 'open', label: 'Open Access' },
                { id: 'subscription', label: 'Subscription' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterAccess(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterAccess === opt.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Faceted Filters */}
        <div className="bg-card p-4 rounded-lg border border-border mb-8 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search title, author, keyword, or DOI..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <Select value={filterSpecialty} onValueChange={handleSpecialtyChange}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {medicalSpecialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select value={filterYear} onValueChange={(v) => setFilterYear(v || 'all')}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy((v as any) || 'newest')}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Meta & Reset */}
        {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              {filteredArticles.length === 0
                ? '0 articles'
                : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredArticles.length
                  )} of ${filteredArticles.length} articles`}
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-7 px-2 text-xs">
                <FilterX className="h-3.5 w-3.5 mr-1.5" />
                Reset Filters
              </Button>
            )}
          </div>
        )}

        {/* Article List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse space-y-3">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-12 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : paginatedArticles.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {paginatedArticles.map((article) => {
              const isExpanded = Boolean(expandedAbstracts[article.id]);
              const isBookmarked = profile?.bookmarkedArticles?.includes(article.id);
              return (
                <article key={article.id} className="p-6 sm:p-7 transition-colors hover:bg-muted/25">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Clean Unboxed Metadata Line */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-2">
                        <span className="font-semibold text-foreground/85">
                          {article.articleType || 'Research Article'}
                        </span>
                        {article.specialty && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{article.specialty}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Vol {article.volume}, Issue {article.issue}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                        </span>
                        <span aria-hidden="true">·</span>
                        {article.isOpenAccess ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                            <Unlock className="h-3 w-3" /> Open Access
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                            <Lock className="h-3 w-3" /> Subscription
                          </span>
                        )}
                      </div>

                      <h2 className="font-editorial text-xl sm:text-2xl font-bold text-foreground leading-snug mb-2">
                        <Link
                          to={`/articles/${article.id}`}
                          className="hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
                        >
                          {article.title}
                        </Link>
                      </h2>

                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        {article.authors.map((author, index) => (
                          <span key={author}>
                            <Link
                              to={`/author/${encodeURIComponent(author)}`}
                              className="hover:text-foreground hover:underline underline-offset-4"
                            >
                              {author}
                            </Link>
                            {index < article.authors.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${
                        isBookmarked ? 'text-primary' : 'text-muted-foreground'
                      } hover:text-primary h-9 w-9 shrink-0`}
                      onClick={() => toggleBookmark(article.id)}
                      disabled={bookmarkingId === article.id}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                      title={
                        !user
                          ? 'Sign in to bookmark'
                          : isBookmarked
                          ? 'Remove bookmark'
                          : 'Bookmark article'
                      }
                    >
                      <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </Button>
                  </div>

                  {/* Abstract Preview */}
                  <div className="mb-4">
                    <p
                      className={`text-sm text-muted-foreground leading-relaxed ${
                        isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'
                      }`}
                    >
                      {article.abstract}
                    </p>
                  </div>

                  {/* Keywords as quiet text + Functional Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/70">
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-foreground/70">Keywords:</span>
                      <span>{article.keywords.join(' · ')}</span>
                      {article.doi && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[11px]">DOI: {article.doi}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setExpandedAbstracts((prev) => ({ ...prev, [article.id]: !prev[article.id] }))
                        }
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 mr-1" /> Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 mr-1" /> Abstract
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setCitingArticle(article)}
                      >
                        <Quote className="w-3.5 h-3.5 mr-1.5" /> Cite
                      </Button>

                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> PDF
                            </Button>
                          }
                        />
                        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
                          <DialogHeader className="px-6 py-4 border-b border-border">
                            <DialogTitle className="line-clamp-1 pr-8 text-lg">{article.title}</DialogTitle>
                            <DialogDescription>Article PDF Preview</DialogDescription>
                          </DialogHeader>
                          <div className="flex-1 overflow-hidden bg-muted">
                            <iframe
                              src={DUMMY_PDF_DATA_URI}
                              title="PDF Preview"
                              className="w-full h-full border-0"
                            />
                          </div>
                          <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3 rounded-b-lg">
                            <Button
                              variant="outline"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = DUMMY_PDF_DATA_URI;
                                a.download = `${article.title
                                  .substring(0, 30)
                                  .replace(/[^a-z0-9]/gi, '_')
                                  .toLowerCase()}.pdf`;
                                a.click();
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" /> Download PDF
                            </Button>
                            <Link
                              to={`/articles/${article.id}`}
                              className={buttonVariants({ variant: 'default' })}
                            >
                              Full Article <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Link
                        to={`/articles/${article.id}`}
                        className={buttonVariants({
                          size: 'sm',
                          className: 'h-8 px-3 text-xs bg-primary text-primary-foreground',
                        })}
                      >
                        Read Article
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No matching articles found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Try clearing active specialty or year filters, or broadening your search terms.
            </p>
            <Button variant="outline" size="sm" onClick={resetAllFilters}>
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="hidden sm:inline-flex w-8 h-8 p-0 font-mono tabular-nums"
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Citation Dialog */}
      <Dialog open={Boolean(citingArticle)} onOpenChange={(open) => !open && setCitingArticle(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cite Article</DialogTitle>
            <DialogDescription className="line-clamp-1">{citingArticle?.title}</DialogDescription>
          </DialogHeader>
          {citingArticle && (
            <Tabs defaultValue="vancouver" className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="vancouver">Vancouver</TabsTrigger>
                <TabsTrigger value="apa">APA</TabsTrigger>
                <TabsTrigger value="bibtex">BibTeX</TabsTrigger>
              </TabsList>
              {(['vancouver', 'apa', 'bibtex'] as const).map((style) => {
                const text = formatCitation(citingArticle, style);
                return (
                  <TabsContent key={style} value={style} className="mt-4">
                    <div className="bg-muted p-4 rounded-md border border-border relative">
                      <p className={`text-xs text-foreground pr-8 ${style === 'bibtex' ? 'font-mono whitespace-pre-wrap' : ''}`}>
                        {text}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleCopyCitation(text)}
                        aria-label="Copy citation"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
