import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Share2,
  Quote,
  Lock,
  Unlock,
  Copy,
  Check,
  Bookmark,
  Settings,
  MessageSquare,
  Twitter,
  Mail,
  Linkedin,
  Eye,
  Volume2,
  Pause,
  Type,
  Minus,
  Plus,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { CURATED_ARTICLE_MAP, JournalArticle } from '@/data/journalData';

interface ArticleResponse {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userRole?: string;
  content: string;
  createdAt: string;
}

export const DUMMY_PDF_DATA_URI =
  'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQpHhD93wQv/CQEAAwABAAgKZW5kc3RyZWFtCmVuZG9iagozIDAgb2JqCjE1CmVuZG9iago1IDAgb2JqCjw8L0xlbmd0aCA2IDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoMSAxOTcyND4+CnN0cmVhbQp4nO2XfVxU1f7/X+ecmRlmzgwzwwwzgAMyMIgIioSgYkqiIviK0vIV85U0y0rT1DRT04yy0sxS07TMx2uWpnmaZ/OUXPNyvKVZmqalZpqX4+V4S1PTzPR4Pq5Z5gPzfH/v/f39+vtj13rttfZe67X2WmuvB0BBAEAy1AMwSFu2ct1A/aY/A6DLAUDntNWrH3x6T82eECAWBEBcdv3a9Ztv/37HdwDMBIDk5W2rt24Lvn373wGUeAEM1nffuvbhnRsD330JYM8BoG6/Y+vWO2sONB0CUAoBoK7buPmuTTfuTvoQwFkEgLx429q1W55/+5lSAIk4AOh2r1+1cc1X74+1ANhQAmDXvXF1zaob86o+ArAcAjDW3X73mg0P/nTrEwCbAgA23LFqxaZV1yb/DoD9H4CRm9ZtXHtn2iMbALxHADDv3rB63db8EwueATAQA9D4B5evXl3b2voWADwI4Gq4Y/vqtTdf8vQvAOA5AE1rNmxetXFf+oNnAXwNIDHrwTUb1r2d99A1AHEbAI85e/2WlWve/aK2AcB1AMwT1z2wZsMjx7e9D2A/H0A/etOG1WvuH/iBA+AdB+Cz/N7Va1a/d+8eGoByJgCPX99z1dqNd438210A8gEAa92KNeuunTr4OQAxAGBfct/O9Rs2fDTrVwAuBwDMO3bdvmrNpX+LmwBcDIBcftfatRvWTX7yUwBnHgBj5d33bVi95qPPVwHYAwH4R62/b+PqDZ/u/w+A5wcALwLgs708f82GNXc1vwOAwAAgQesG7t2wZu2xQ0uBMAAw79mybtOGuTufAzASAiA2blq/buMzr+0dANAAQNp87yNr1q1rnfk2gHgCQHzg3nV3rrlv66p2AA99AFp2rl2/eu3X1Q8AONABcOmGDfeuXXt479Q8gCUAANXlXbfv3rBhaP9tACYDAPX07rVr1qy7O1YJoBwBkJq2bV63/sqfQhYAqCMAjC+/tW71uqevW/g8gPEYAO/yrevuuPO3n3U1A/gMgLVk89YNa1/bf58BQNUAQLwGAKC9+3bcvXXz3g/XATgeArB827atW19/sO8LALUAQNtxz7Y7d91x7RcfAigZAIiX7t5++6472w59CeATANHWe/becccdj64c/ByAIQCguPPOHdt2vH0VAFsIANDtuG/L1tXbnq2YBiAEAeDVXXfevmPbrf98G4D9YwCu+wEAlHzrnh1btj7xNIDbIQAj7tx1D1/eG2cB8DkA5tEtt2/bsXVw948ApAoAa9stW3bc+8eHPwdQCgHYN/Ldd9yz/U1uAgAc+wGY/L337tx2+/7p+wBEIwDMVz+wc/u2b/+HvgVw/gCA1Xbn9tu33737EwCHGwDj05XvuH3ng6fXAXgcADDfP+COHdt2D94BQAyYADt9d94P72w41z0CjX96G0BvjJ0P+Pnj0L70l1y2j2A7Nnbm5f1y7ZgR08O8/2v4V/rPnv4j8S/7D+jP3rMPzDzwk9R/nI80/9s8fW9tA/9e/wE/3n+gD8Tf+gX4N/oH+yX/UfyL/6D+8XyL/+J//A/vL8q/+K/2N/0R8KvsL/W37Bf8jf8H+yv3y+Jv+B/eX5F/8V/ub/gj/Vf6H/0H+x/wD+5X/RfrI+xX3D+y/+P/I3/A/tL9Cv+Q/tL8e/8h/Yn+h/yN/4V+y910X7C/UL/k3+h/o49jP/BfoV9hf0wP6C/9T+kv+xvrz/1f8N+wf+k/wb+2/+G/f3/o//RfcH//P9jf0Afxw/g7/k37h/o1/wB/7D+gv+Af7hfoX8hH//f2F/xX7Bf8f8hf2E/4X8h/8J/xX/Cf8J/wn/Cf8J/wn/Cf8J/wn/Cf8J/wX/Bf8F/x7/m3+Pfr1/z7/Mf2w/4T+1n/Kv2fP/+/br9P929wP2P7Yn/2l/2R/3r/5h2Nf+7uF36S/oT/zD/2y/0F/6U19A71z/0L+9v3S/jH+hP7C/mIenD/4lP+7vtH+4p9gqf6r/sN1yX2L/5hfr4/y1f/E1P4Nf/sX9yX6eX/AP9wn+mX7H/z39wX6Xf+Q/sP+sP62/o7+vv+Bf7Bfsx/3G/YH+Y3/Ffp9/yX7O/5r+0//ZfdX//m96D19TfzJ//y9m/6V//E/5J+/D/l/+Gftj/zz98H9o/wAP/0f3QfjW+N/x3/Gf9j/0G/Y+/2P/Yb/h3+zX22/zH/W/5hvl//Qn7r32A+3x/gX9sX7L/4FfsR/2x+yG/9z/yT/kL+oD/1H+y/8i/2H/Q/9Df0N/Q39DfsD+hj/0P/I39Df0r/SP9Kf9i/2KfyT/SP/Kf7V9on7Ef0T/yH9hH/k31xX6Xf8h/YhP2h/yC/7r+sv9hf+V/uP+2X2m/zn/Ff8Bf9C/0F/xH/If4Xf8FfgV+Bf+i+2M2wH6k/T0T9wX7Ev0A/cM74k/sX+xD9AH8F+xX/Pfp1/3n/Yf9t/0H/Pf9t/3H/Pf9FvsD/yX/Zf89/0X/Pf7ZfoA/bA+2QfZn/Uf9B/0F/2X/Vf9V/0X/Vf9F/237AP8nfyT/Nf82/zX/L/y3/Lf9x/2H/cf95/0X/af8F/2X/Bf9p/0X/Zf9F/2X/Bf8N/w//Sf8m/xb/Fv8W3zb/Fv8W/xb/Fv6f/wD+2/4T/jD/tP+2/6T/kX/af8o/sT/xX/av2X/1L+w/8R/2H/Yf9h/3H/Ef91v3x/f39Hf49/2F/1722v0h/wh/1L/cf8h/1W/bL+8f9h/3H/cf9p/1j/UP9Y/0jfeP2A/Y3+if6p/rH+ybtU+1L7SP9g+2T/aP9m/2L/VP9iv9S/2L/YP91/0H/cf8R/zK/cr8yvyK/cv/yfvL+8vyq/ar9ivxq/Qr8ov8Qv0n/Sf8A/9h3zH/cv8x/zH/Iv8Qv+A/4B/yD/gP8Q/0Bv1Bv1BvyBvqDvoDeoD1AHqAPwB+AP0D+wN8Av0C/UP8gvwC/AL+If7h/t19uH2u+1D/QL8AvwB/s19qH2wfbr4Bf25+AX+IX4hfqF+oH8QX0BvYB/EF8QX0Qf0RfuqfKz6g/4Af6D/kZ/gX6A/iA/6DfoA31RfqC+oA34oP0Rf0VfURfURfyqfb19vH2zfbT9qH2/fb9tsP2U/bP9oP2rfaD9lP2w/bN9s32zfbT9v328/brdp32Uv0pfZp9qn2rfa59oX22/Zj9m32Lfaz4lP0k/aN9u1+in6SfoJ/aL9I/0D/QL8A19kXyA/IP4BP0D/AL/AP9AvsC/AL8AvsC/QL8AfwB+gD/QN9A19If5B/kFv0AfxB/UH8QX1BfqJ8on8IfmD/0L9xP8RP+E/sT+0P/Qv3i/eL9oH8In/Qx/gH8oX4Af8A/uF+IX7hfj5+Pn7QflCvyg/KD8oPwA/vA/yQ/MD8oPzA/KD/0AfrA/aB/0D/YP9w/7h/tD/rG/YP9Iv0i/YH/I3wDfQH9QnuhfXF+iL5AvyQf1Cb8AH9QH/IPugD/AH4Af+gD90IfuhDfpD/UP5QfoE/vM/ED/iB+oA/2C/2D+yP2Q/0B/z1/v1/uN/vn+wv9+v9y/0lfo1+yf9U/0l/vn+//1x/3H/YP9Q/3l/vL/cX+uv9+v9h/zh/0H/UP+Qf4Bf5xf7xfoBfcTfoDfcDfvF/kF+sT8IP2IfYAfggf1if5AH4gP3EfeB84D5QPlAeCB8EAfaD6A3yA3zAfKA9IDygPVwfGAfGg+sB7wHxQPKg+IB54HngfOA34APwgO/QB9oB9kD4wfzA36AP1wH3APxQPyg/SA8QDxgPHg/GD8YDxAPEA+yB9oD4gH3QPVgfaA+OD9sD9oHygPiC/4i/1gfwBfxAv8g+IB4gHjAfEA8wDywPxAfVAfWAfiweLB8kDwgPIA+6B9ID9ID9oDyA30IP/AftA/9B+0D/kD+EH+wHjg2+A+cDfAD1yB28G7IH1wHfgPnge8Af0gfmQ3cge7A3wA98B+/A3qA9EAd/AfGA35A7sDfAHfIHbIP/wDxIP8gH9QP6gPjAfiAf2A+yAf2AfFA/kA/GBuEBsEBsYDPsDYwNlgboYPYwPZgegYPfQNjA8zgcgYHSADoYDkDH2MDeIGSMCs4GzQPOAMwYZWgwAhrCDY8GwYNGwYsHlwccDEcHvAePB6gD+QHyAPeAecB+wH/QfVA+SA8eB8YGzwf/BxAHsAPgYM+wfjA2CDa4Gtwb5AZHAtuDeYHUwPTQfQwb3B2+B9MGTQM+wYfBkGDrMH6wPdgd0wYpAzzBosDQwF2QOhgcdgaHBs4GpYNfgv2BpGC3MHOwOtgYmQ0CB+sDAyH4QNJgffBfMDFYHIwP2gZDBusDDYF/QMRgb2gsSA8+D5YGoIOFgeTBv0G1waHB9sDe4GzwY3Bs8GPQN9w1GDTMHfQbLBn0GNwZlBsUDzIH9wbvBroG2wafBz0DB4NogY3g4iBlsHkQVRA2yBhEDToGyQeRBlEGSwbXg2WDyINIg0WDqYNPgeTBs0GKwZNBjcGLwbbgxyDFIMNwy2DV4MTgxSDZIMWwz/Bg8GMwbVBj2H0wddhkuGWwYDhjcGq4bTB4MHQwazhqOGIYZrhkOGYwZThn+GEwYfhhMGJ8Mdw/WDHcP5w42DDYMTwyWDBcNLwynDPcMtwwbBl2GuYZLhquHbwZHBi8GF4ZfhtOH1wbbhv8GlYa5hhuGNwb3Bq+GR4aNBjuGUwYHBocG5YadhgHDQ8OB4aQht2Gw4eXD+4eXD7MOUw+WD98MZw13Dh4d3h9uG04Y3hjcM1w1+DX4OPgv7BscGTwZHB1OHN4fThnCMLs4TDBn2GW4cfhxKGQYfNhsOGnYZPD5sM9g2nD0YMTBmsHO4eNhtGGlw0rhvOH3YcjBlOG6wczhtuGHYZLhkOHa4ZDhhOG14YdhjcM1w1/Do8MXh6MH/wfvBtcGlwerBhcGbwb8h+2DXYOvwx2Dv8N9g6uDX4PPg32DaYNvwwnDA8MOww/DwcNJwyZDYEMIQzOD4oMQg8hDfEPXw/yDbINUg92DTIM0A9XDbEMogxiD2ENsg8RDrkNfQyRDgUNfQ5DDZkNBwwlDQUOEQ05DUUNuQzzD/EPTw5ZDIkPkQ+XDkkOkw49DhMPaQ5tDgUOZQ7/DwEO0w4VDqMOmQ3RDMUOaQ35DhUOqQ1/D7kPOQ8FDiUN+QyjDdENOQ1FDuUOFQ7VDkkN+QyLD+8Ouw9FDfMOeQ5JDOkPBQ5VDgkOmw9NDnENlQ51DrUNpQ7FDWkOxQ35DuUOPw/bDp8Pew6TDmUOZQ5tDmsOFQ1lDuUPnwyFDpUOBQ3VDiUNZQ5vD/EMGQxlDOUMGQ0lDXkOJQzpDWUOMwyOHTMNzh1KGsIaShwyHUoachzKH0oboQ+xDlUMeQwZDDUM1Q8xDdkN0Qw1D+EOPQ/FDdMOxQyVDAUM5wwFDAEOeQ51DgUO5Q1VDrUOFQ61DAUM+Q1FDVkNOQ2pDpkNhQ8JDBkN+QzZDAYNcQ1lDPUOBQ25DYUNTQ9xD5UPGQzZDfEN8QytDQkOeQyZD+UNbQxvDs0PTw8tDDcN2hwuHTkM6QydDxUO0Q2HDeEOdQzlDhUNtQwNDXkNlQ1pDscMLQ55Dm0MOQ1FDvEPTQ5tDc0Nzw5FDIUOqQ5NDbUPWQ5FDlUPkQ+FDlUMWQ5ZDe0NbQ0lDdUMeQz1DNkP6Q2JDDUMWQ5ZDC0NzQwtDA0MhQ7tDUkMrQzlDg0NuQwNDRkN5Q0lDdUOLQwFDGUMZQ99DOUMPQwlDvMMLQw5DNUNIwwFDq0Pvw+FDfUONQ4lDX0M1Q5FDkUNxQ6tDzUNzQ/FDnUOZQ8lDUUOvQ3dDbkN2w4zDi8M2QwFD1UNyQ2FDoUNTQzlDkUO/QwVDDUMNQzFDEUOqQ7FDr0ONQ8tDFUN/Q/VDEkNiQwtD3UO5Q71DUUNpQ/9DKUObQ21DXkNnQxNDjUMXQ3FDGUMpQ59DDUN/Q59D0UO/Q9FDGUMeQ1FDhUOJQ0RDzUOzQ0NDKUNIQ2ZDlUN1Q/lDMUMlQ2pDp0OFQ9dDikNxQ5ND3UO+Qw1DPUORQ5FDuUN/Q45DWUNhQ1FDzUO3Q6JDFkOxQwpDxUPDQw9DLkOWQ0dD9UMjQwtDQkO1Q5NDVUPdQ1lDuEOLQw1DukMRQyZDf0PzQ99DlUNaQzdD/UNDQ+lD7UNTQw5DJkN6Q/BD50NtQ2dDYUPRQxxDWUNOQy5DAUNKQ31DvENPQ/BDIUNCQzpDiUOJQ5FDc0NpQ8FDhkOFQ99DZUOfQy1DHENfQy1DiUONQ5lDOUNCQzpDYUNIQ11DbEOTQ+RDVUOIQxlDU0MzQxlDC0M3QwZDuUP1Q19DaUMEwxBD1UOUQxpDJUOLQwZDPUNKQxxDLUP1Q2pDVUPuQxtDdUNAwwlDw0NxQ/1DQUNuQwxDAUNIQ8BDcUPPQ45DSkOxQ/dDN0MdQzFDC0M0QxxDzUNxQw9DIUOrQzFDBUNsQ0lDHUOvQ8pDIUNiQzdDOUMAwyFDQkNuQxFDBUNCQwRDDEMZQyxDU0NxQwtDRUPxQ8JDlUNyQxxDREOOQw9D8EPbQw9DEMMGQzVD9EMVQwtDOUMBQxpDJkOxQwVD+0P0QwVDEUNDQ7VDBUM0QwhDOUMBQwVD/UMMQ7xDPUMJQ9tDbUNiQz1DSUMLQzZDQUMuQwVD+UMGQ+1DlUNlQwdDWkMFQxVDcUM1Qw5DDUMYwyFDtUNDQzZDqkMDQyfDA0MrQ75DEUMFQzJDVUPDwxJD/UMCQwtDOUMnQyfDEMOOQwJDiUO6Q75DR0MAQ/tDTUMPQwFDAUOBQ1pDbUMrQwxDrUPiQ2tDD0McQ/pDxENLwxdDA0Mgww9DLEM1wyBDx0MlQwtDDUPGQwlDcUMSQw1DLUP1w/xDXUMBQwtDe0MFQwtDoENPQwJDbUMXQyxDK0P+QwlDL0ONw1xDqkMPQ0vDPEM8Q79DpEMEwxFDsUNuQ4pDjUMAwwBDIENeQ4VDAEMPwwJDukOTw0FD+EMaQwxDD0P7Q/FD1UNaQw9D+0Pyw7FDdkNqQ0NDG0MSQwRDAEMTQ3FDAkNiQ4xDyENvQw9DEENiQwxDS0Pzww9DLEP0wwpDEMMDwwRD/UMIQxxDUEMTQw9DC0MBQwJDwUMPQxFFC0UEwwtFFUUfRWNFPkVXRZNFnEURRQHFS0XPRRVFOUVPRdNFz0WhRW1FE0UTRddFu0UzRatFAcVPRQtFWUWBRWvFIUWHRb1FVcU9xbXFOcX9xcnFCcXvxafFx8WnRcdFu0W5Rb9FyUWVRc9FPUXHxUvFKcXvxbVFrUWTxf5FGcXxxXHF8cVJxftFeUWFRf/Fp0WlRRfFi8UzRbnFZUWtRYVFlUWVRR/Fs8UpRVvFdUXNRatFlcVjRQlF00XFRWPFoUWFxfnFLUUXRRfFI0U5RVtFZUVzRXDFZ0Uzxf3Fd0UtxbDFRcU/RaHFCUUPRbDFY8UdxddFrUX9RV1FiUWTxSnFi0UnxTfFTcUTRe9FHcWhRVnFcMWJRd3FEUWDxQvFHcULxRdFFcUHRctFDcWwxRnFaUUFxWtFNUWDRaXFRUWxxY3FIUWDxSlFNUVzRYtFbMUTxe1FWcX5RbPFX0WfxR9FdMUMRXdFk0UIRXdFF8VbxVjFuUW9xUfFCcUDRdDFF0UpRQdFOMUIxcPFM0X9xTnFGcUXxfvFXUWjRZtFhUWNxVtFVUUxRSDFqMU/xcfFP0UHxctFacWJxTdFPcU4xQnFTcUQxcDFm8XvRTDF60XPRb1Fg8X9xcjFicVHxc/Fa8UoxyTFi8XFxTvF50URRanFi0WVRS/FOEURxRvFTUUzxUPFHcXcxanFIUUqxbtFBUWLxaPFA8ULxSvFJcWDxaXF68UtxavFNUWRRRXFR0UhxbnFR0UIRf1FFMURRePFEcWhRcvF00UtRatFacUNRQvFQ8WjxWtFtUVfxQtFs0UvxUfFcMUPxaXFVkUpRQPFicVDxdPFsMUaxSHFP8UPRR/FE0WgxUnFQ8VdxWtF9UUtRRdFE0WtRQvFLMUTRelFd0XnxRXFEcVDxbPFnEWNxZNF9EUZxSfFCcUxxXXFrUVbxZlFFUXHRfnFjUUzxRXFnEVrxTdFnEUDxTdFN8WdxRnFB0XbxZnF10URRX1Fy0VDxdLFD0U7RatFLcURRTVFzUXDRfHFCcVnxdVFOcUvRQBFbEVtxQtFCUUtRblFlUWbRUXFO0X5xbHFi0WTxePFJMWlRZtFmUUAxUXFTcXMRbDFD8VgxWnFLEWDxaVFD8VMRfDFeMVRRVHFjEVvRWdFeMVzxUXFaUWkxUnFeUURxVPFUMWpxbtFxUUZxR3FFcVDRc1Fi0VZxUHFuUW5RTnFoEXTxctFPcUIxTDFxEWpRVjFfUVQxTVFccVxRXvFi8UpRTXFpUUdxRdFHMWvxd1Fg8WvxZ1FsUU9xWXF3EUJRblFI0VERWfFQcVjRbNF6EXNxfDFf0WMxbNFoEXTxfpFBkUdxcDFN8XfRc/Fi0WnxavFi0XjxSnFtMUTReLFlUWPRdDFyMUkRalF8EXTRcdFdMU8RU7FS8WrxVDF/kVdxZdFVUWRRZtFAcV4xbBFWUUDxbDF7EW7xfvFuUWxRbNFvMWRxeVFaEWLxStFsMUpRevFnEVNRcdFlMUTRSFFr8WtRUVFpEWxRSXFFMUTRRtFG0W2xRzFiEWARatFBcUIxcBF1EWRRfLFB8VgxUdFOMXLRSbFaMUXRbNFWUWFRbnFxEVIxalFzcU7RRHFJMWwRU3FnMWRRfBFUcUuRatFlEXTRbNFI8VQxXnFB0XkRUjFCcX5RaXFgUW5RQVFPcVnxQtFd0VmxX9FLEUYxbDFQ8VrRbRFCcUdxRlFFcUIxc3FIMUgxcjFAcUwxfFFtMWxReVFVkUtRYzFIUUlxSDFOMXZRctFIUUlxRnFb8VXRctFDUXoxb1FnUUdxaNFhEV0xU9FacU7RQVFBcUdxbNFIcVwxadFYUUZRQfFOMUtxSHFi8UlRStFmcUgxaTFRMWMxTnFBUWTxSXFTcVhxUHFGcXfxanFWUWrxXtFBUURRSvFd0URRWLFMcWbxaPFTMUQxSDFmUWoxajFfcVDxcDFRMW8xa1FO0UVxStFO0UVRRnFnMWfxTtFA0UVxTTFnEXwxWfFxMVsRTzFf8VcxVXFDMWLRQXFpUUPxSvF6UXgxVvFTkVixVnFN0U3xeDFTUUrxTjFI0XHxYDFHMWdxQXFIUWIxRzFS8UUxdTFOcVtxf/Fi8WhRVLFBcUjRRVFOcUHRStFWMW5xY1Fn8WVRevFeMUiRWtFk0ULRW/F7kVRRdNFm0WBxbPF38XyxazFOMVRReDFeMUUxcHFIUVsxZVF28WLRQ3FVUVjxcdFBMUhRcXFPkWHReFFrMVXRXnFOcUZReDFeMUtRSPFEUVNxTdFF8VlxbvFVcUbReDFeMWIxQtFqUXrxW/FdEUPxaFFv8XyxStFPcXLRTTFbMUTRRrFI8UUxbVFaMVsxeHFFUWUxTnF40Ugxe7FBMUZxaDFoMXyxUdFf8W3RdtF0MUyxcLFQ8X7xdFF2kXlRXXFD8VMReZF7EUBxUfFLkVvxdvFtUWMxaPFTCUAxXjFL0VQxa/Fi0W2RUdFzEVHxRnFEMWNRfTFecV2xWLF2UW0RTnFI8VPReHFq8UrxcXFLMUexfTFpMVXRfjFB0UTxTnFi8UVRS3FPcUdxRtFYMUTxdDFQEUExaPFOkUvxTvFEUUExSDFW0WvRTtFjMV2RQvFrkVBxQPFKUXtxQXFYcVPxbNFUMX7xYvFHkXhxTvFJkW/xd/FNMVTxalFX0VgxRDFNMWFxSjFrUVRRfRFS8VPRUDFV0VrxSDFuUXPRSTFEUVnxSnFgUWzRTXFEUWzxTfFAMVRRcnFlEWjxTTFWsWoxazFa8UgxcjFbcVzxdLFiMULxbHFY0Vwxb/FrcV9xd/F1cUPRUTFkUWZxfjFt0W1RfTFEMWrRX9FuEWHRbHFqUWvxWtFU8WpxalFAMVQxSXFTsVLRd1FgcV/xaLFqUXrxXtFT8UrxQ3FtMU/xZ9FW8X8xZzFNMVrRcDFyMXdxZtFxUWFxXvFCMV5RVnFqMUqxevFsEWYxWTFTCUGxeLFi8Ugxa2FkIWphQDFfIWXhelFlsXKhUmFo4W+hd6FAEWfhS2FpoWmhYyFZ4X9hevFv4UZhcGFdMXXhemFuEWdhbWFYIXWhXaFXsX4RWWF0UUDxbGFZ4VRRb7FrsWvhdWF6UWTxdeF60WnhcCFsEW8hc1FN8UTRXNFW4WlhdqFxoWohXaFjIXlhWVFqoVUhbCFmUWshbuFtMUVhemFWsV0xT2FZIXMhdmFNUWShdaFZoUOhXaFiIV9hdKFKkWHhaCFTYXfhdaFR4WQha1FDoWLxXLFn8XXxTzFHUXYxfaFNoUZxRZF8MWBxeBFlYXdhS/Fl8UTxa/F2EWmhV2FIQUuhRqFY4WMhesFGMWvhfWFfYXnhbLFMUUXxZcFQIUTheTFgIVFxcOFbMVLheFFL8XIhdyF2YX9heqFGwUvhT6FRYWnhWmFh0WxhQpF4cWDhemFvoUthbeFs0WdhUGFx0WVxSWFbYXShTeFQkWMhdmFMQWjhVwFjoUThc2FQYWdhb+FAcWDhb9FAUUFhb+FgYVshVuFEYWQhbYFIAWdhSFFUIVohQhFaMVkhXaFSYWPhTCFCQWvhYCFtoUAhc6FWYVOhV2Fe4UdhXWF9AULhcKFAIWThV/FnYW0hfOFNoXfhZCFjYWShSiFyIUXheSFIoX3hTqFiIWqhZaFLYVyhdCFTsVLxSiF1YVXhZOFo0WUhWeFM0WchUaFA8WXheSFbYX7hcOF2IWohQ0FYoUMhSiFoIX3hX2FboWghT+FcMW5xduFUYURxQyF7AUBhfKFAQXrhS+FbAUIhXGFhAWrhUyFEoWIha2FRcULhRMFPoUjhTCFWYVZhTqFzEWOhU1FTYUghROFoEXJhTeFU4XRhTiFxIUkhcaFaIVLhXzF1EWohVOFJYUUhdaFg2VZhTaFSQUwhdVFwEUEhaOVoQWAhUyFOQWehTyFyoXXRcTFUwW5RceFEIVdhVyFgQVEhamF+YWbhX+FyoXnhTaFTkXvhRGHh4UXxSaFWYWfhcGFVIV7hROFw4UVxQoFX4WvhT2FSIVOxcGFo4WQhaWvX4VfxdWFjoVkhbRFaYVXhU2FUwuZhVuFiL+XhatFDoXjhcuFuEUVhauFRAVfhdyFiYXDhdq/o8U1RTqFXa/6RQNF5oUur2hFZ8W8v5nFe4URhZuFd0WVv4mF5G9vhcTvZYUDhaWFL6+4xbCFqIVthZRFtMXBheaFWUUthYCFUq/7haGFlYVOhRaFtIVjhZOFa28bhauFTYWJhVeFbYU5hauFmEWYhRtvGIV/haiv1EVPxTi/08Wcv5/FAcWLb1SFr0V0hfuFEUW0RXqFWIW1v5Svwq+qRVCF7L/rhSaF1IXGhcOvsYVRhQeFK6/mhUavpIWdhT1FhYXGv+xvvSVDxbuFH693hcJv1K/zRYaFQG9BhV2vuEVBhcaFQV+whc6FxL8NhSWFRYU3RWiv8YVUhfeFDQWbhdy//a9ThUgv2oUZheeFxr92heOvg68chcTFX4W7r+CvJ4UZxdCFroUbhW2FMQWhhaaFi69mhU+F4EWBheRvX2+3hRqvK0U0Lw6Ft78bhaRv3G83vyaF1a/8hauvtcVnhX9vgG8NhZOFBIV7v1CF/W9UhS0FUQW33xKFuH8QhUJF+G+4v15Fr2/6hdOveq9LrxWFy28whZlF/r8RRTqFBG8ohc6vI7+KvyivdG8I32CFdG//v2tv/4V6hdeFdr8+heavtoWnv9WFTsUur2yFrIXNhfSvSoWshdCFWb8RhQuF+2+OhfaFaIXmr3NvWIXyhaCFzIXIhVfvtK/Mhaev0oWMv6eFfIXLhU2Fd8/ShXqFy8+uhUSFtMU7byiFu0Xbr1qFo+8mhQOFoK+HhUKF27++vwaF8MW0r5CF+0V3xVuFoN/8vy+viH+IheiFtoU1r2uFC4W0r2GFuW9A31Svk4W8r3xv/L9RhciFqoUPz5iFDW+OhT2vc68UhV2veG/shQavVIVTr/lvvIWrr/+F2q9khc2vkS99hTiFdoXLrwhFyIWOr4yFVIVdrwJFiEUKP2r/hIV4r3KFHK8ShUqFWIVer/+FXoVGhVyFQG/+RVCF5r9Mvwqv1IUihTev/m+whWqFB4VMnwaFVIXAhQuFWG8urxyFK4VqbzKvMoWGr+CvioUUr0xvaK8Mr2OvgK+8v1xvfq86rzZvGq+Gr+pvlq8Mr5Bveq+ArwiwOq8ur9qv1m9yr02wpq+2r25v+G+eMIevxG+OMDuvLq8Gr5gwKq8mrzivJq/or2av+K9yr3iveq+OMDevZq/gMNMwVzCHr8ywNq8wrxQwwTCGr0qv9LA6MNcw37DQrzswvzBPMPcwJLDQsNqvJDAxMAOwpLDar5IwwDCyrykw0jCvMFSvHDAuMIcvPDBLMC0vMzAjMHowDDB1L20w27DI0DK/fC+Nr/Kvdq/4b0wweS/ZMHovsS+9MPEwUS+yMD0wybBgsCUw+i9xLykwtTBdMPGwRC+hL14wjDD5MCEvLzANMC0wwrBcsFUv3K/gzzqweC+k0G8vzNBOv9AwbTCVMDowNTCvMHUw1bBCr9KvOK+o0JwwQzCtMGUwm9ACv9TQijA/MCXQ1NAxryDQCb+s0FgwITCpMBgwrTAYMKXQxG/w0OQwwtAcv50wbTCVMEMwQzCZMBUv1tC8r9LQjNCUrzTfbC/y0Aow39BOMMvQ2H99r2TfbK8s0HcwjTCa0Mivd1/Q0AowQ+9K39xvlNCU0KgwHTADMEUvbS+50F2//C8u0E1fPNA6MN/QEi+a0Eov0tCqMK0wfTCeL2MwTjA9MD7vWt++L17Q5NB+v/1vmtA6MDgw8q+h0FIwgTBRMEEwjTCNMEEwiTD6MKXf/NDi0OLQWtBiMBwwXjAtMCFveN/Avw1DO3yD+8YMjQ9z+CYOLQwt/sYNTQlDD22/S0LLv2tBC7xRQxPCuEL0MB4w6tCUMDEwozANMPEw9C8xMNLQmDCLMKsw/TCRMKMwUzCpMA0w4TCFrwrf0TfVMMEwfTAJMPEwXTDpMLkwgTCBMFUwuTCprwrfjDAdMMUwHTDlMLHvmcMkwsS8L3yTCPv+JvRNDe31Pvo6+/cO7Qj9Dk0I/fz2Df3x1w/tDH0H7Qr9Cv32+xRNDy1+L//mDh0M7Q1DDK0NrQltDm0NbfS2/S4N7QodDx2/Gz80O3QktD10M3Q8tDe0LXQkdDx0+r1y0fLQotDN0NrQrtCu0O7QbtDs0JHQptCm0PrQUd/+oT2/mUP7fAeEzoTOh2aEZoSWhmaErn/Xhn6EZobmhM6E/oZ+hE6GToZOvkdO2of2hI6E/ocOhxaExoaWheYMDwvtCe0IrQjNf+/dMDQktCN0JHQsdCa0L0wrDBsN0wrTCQMIQwmDCUMKwwgDCqMIowuDCWMIAwiDC6MJgws9CUMKQwmPCoMJAwi9Cv0IAwhDCyMLwwhDChMLvQmjCyMKwwhDCUMLwwnDCUMLgw1DCMMJwwhDC4MLwwmjDIMIjwtDCyMLYwvDCN0IvQmjCMMLQwrNCQMKgwwDCUMKIwqDCYMJwwhDCm0IowmjCMMLYweDCMMIowlDCmMKQwgjCKMLoQxjCUMIgwkDCj0I4wpDCaMJwwhDCaMKIwvDCj0IfQk9CH0JowkDCUMIQwnDC4MKPQrdCL0KAwmDCyMJ0wgDCUMIQQm9CH0L/Qq9CMMJQwnDCKMIIwjNCP0LvQsDCD0L/QgDCMMLgwxDC4MLBw6HDk0Pgw6HD0MOBw0HDocPhw8HDa4fjhteGBw0uHlw2HDocM5w4uH5w8HDmcObhgcNVwwOH04bzDdcNVwxnDpcNJw3uGUw3nDRYfrhruGiwbnDJ4aThwuHi4arDecNlw2HDaYNxwweHS4ZXDTcNlwyqDacMbg4OHKwcXB2MHcwcXBssHqwZ3B5cH4wfrBgsG6we7B1cG2wZbBnsHFweLB68HqwbnBhcGFwebBesHuwczBxsHdwcXBnEGIwYLBysGwwZPBwEGTwaghuCG0IffBkcGqwcLBpMGXwYNBrcH5wdrB80GvwalBqEGtwedBqCGQwaPBm8H6wdTB/0HIwY1BpMGUQZ1Bp0GCwazBlUGpQY7Bs8GRQa5BisGKQYHhlkGzQbNBnkGeQZBBu8GDQaxBkUGMQZhBsUGzQZPB68GeQaDBtkGRQabBm0GDwblBrMGYQbrBlsGVwasBqQGoAajBqMGo2B+AGoMavgZMBpsGLwb1BnAGqQa3BscGXwaQBiAHkwarBsUGCwanB28GJwYbBu8GzwblBgAHYAbsBpwGwQbrBrkG3QaVBk0GBwarBu8GewbpBsEG8QZJB1EGbwajBskGKQZxBsUGnQYjBoUGJQblBgSG3QYbBoUGgwavBscGSwZTBrkGXwY8BhAGHAYcBjkGcQYzBhMGGwZPBmEGGwYZBoUGVQYzBh0GFQYvBhkGHAZHBkUGWQY5BucGcQYHBkcGcQbZBscGSQb1Bg0GbwZrBj0GXQZ1Bl4GUQZXBlkGDAYXBhQGXwZVBgMGUQblBsEGNQZVBnkGUQYNBusGCQZzBskGRQbpBvkGbQbZBkEGBwYFBmcGOwZTBuMGIwZNBkkGCwbjBu8GMQafBmsGY4ZbhlMGr4azB98HNwe0B7cHmwdRB5sHBwebm0ObP//wH6/L2g4KZW5kc3RyZWFtCmVuZG9iago2IDAgb2JqCjk3NjUKZW5kb2JqCjcgMCBvYmoKPDwvVHlwZS9Gb250RGVzY3JpcHRvci9Gb250TmFtZS9CQUFBQUErVGltZXMtUm9tYW4vRmxhZ3MgNC9Gb250QkJveFstNTY4IC0zMDYgMTA2MiAxMDA3XS9JdGFsaWNBbmdsZSAwL0FzY2VudCA2ODMvRGVzY2VudCAtMjE3L0NhcEhlaWdodCA2NjIvU3RlbVYgODcvRm9udEZpbGUyIDUgMCBSPj4KZW5kb2JqCjggMCBvYmoKPDwvVHlwZS9Gb250L0VudEncodingL01hY1JvbWFuRW5jb2RpbmcvQmFzZUZvbnQvQkFBQUFBK1RpbWVzLVJvbWFuL1N1YnR5cGUvVHJ1ZVR5cGUvRm9udERlc2NyaXB0b3IgNyAwIFIvRmlyc3RDaGFyIDgwL0xhc3RDaGFyIDExOS9XaWR0aHNbMzMzIDAgMCA4ODkgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDU1NiAwIDAgMCA0NDQgMCA1MDAgMCAwIDAgMCAwIDAgNTAwIDAgNTAwIDUwMCAwIDcyMl0+PgplbmRvYmoKOSAwIG9iago8PC9UeXBlL1hPYmplY3QvU3VidHlwZS9Gb3JtL0JCb3hbMCAwIDU5NS4yNzU2IDg0MS44ODk4XS9Gb3JtVHlwZSAxL01hdHJpeFsxIDAgMCAxIDAgMF0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDggMCBSPj4vUHJvZ1NldFsvUERGL1RleHRdPj4vTGVuZ3RoIDEwIDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJzT0lJwTM1JzS1R0IADKIXyxHxxBUMlAyU4oOQaXFKUmZeuoF/Eo1/Eo18EALJBDtEKZW5kc3RyZWFtCmVuZG9iagoxMCAwIG9iagoyOQplbmRvYmoKMTEgMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA1OTUuMjc1NiA4NDEuODg5OF0vUGFyZW50IDQgMCBSL1Jlc291cmNlczw8L1hPYmplY3Q8PC9GbjEgOSAwIFI+Pi9Qcm9jU2V0Wy9QREYvVGV4dF0+Pi9Db250ZW50cyAxMiAwIFI+PgplbmRvYmoKMTIgMCBvYmoKPDwvTGVuZ3RoIDEzIDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeJzT0tLw1/Nz1nNxAAIQZQIICmVuZHN0cmVhbQplbmRvYmoKMTMgMCBvYmoKMTEKZW5kb2JqCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9QYWdlcy9DMSAxMSAwIFIvS2lkc1sxMSAwIFJdL0NvdW50IDE+PgplbmRvYmoKMTQgMCBvYmoKPDwvQ3JlYXRvcihBcHBsZSBwYWdlcykvUHJvZHVjZXIoQXBwbGUgbWFjT1MpL0NyZWF0aW9uRGF0ZShEOjIwMjAwMjI4MTExNDIyWikvTW9kRGF0ZShEOjIwMjAwMjI4MTExNDIyWik+PgplbmRvYmoKeHJlZgowIDE1CjAwMDAwMDAwMDAgNjU1MzUgZgoyMDAwMDEwODI2IDAwMDAwIG4KMDAwMDAwMDAyMiAwMDAwMCBuCjAwMDAwMDAxMDIgMDAwMDAgbiAKMjAwMDAxMDk3OSAwMDAwMCBuCjAwMDAwMDAxMjIgMDAwMDAgbiAKMDAwMDAwOTk2NSAwMDAwMCBuCjAwMDAwMDk5ODYgMDAwMDAgbiAKMDAwMDAxMDE2NiAwMDAwMCBuCjAwMDAwMTA0MDkgMDAwMDAgbiAKMDAwMDAxMDYxNSAwMDAwMCBuCjAwMDAwMTA2MzcgMDAwMDAgbiAKMDAwMDAxMDc5MiAwMDAwMCBuCjAwMDAwMTA4MDYgMDAwMDAgbiAKMjAwMDAxMTA0NyAwMDAwMCBuCg0KCXRyYWlsZXIKPDwvU2l6ZSAxNS9Sb290IDEgMCBSL0luZm8gMTQgMCBSPj4Nc3RhcnR4cmVmCjExMTQ4CiUlRU9GCg==';

const OUTLINE_SECTIONS = [
  { id: 'sec-abstract', label: 'Abstract' },
  { id: 'sec-keypoints', label: 'Key Points' },
  { id: 'sec-intro', label: '1. Introduction' },
  { id: 'sec-methods', label: '2. Methods' },
  { id: 'sec-results', label: '3. Results & Figures' },
  { id: 'sec-discussion', label: '4. Discussion' },
  { id: 'sec-conclusion', label: '5. Conclusion' },
  { id: 'sec-disclosures', label: 'Ethics & Disclosures' },
  { id: 'sec-references', label: 'References' },
  { id: 'sec-responses', label: 'Rapid Responses' },
];

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<JournalArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<JournalArticle[]>([]);
  const [prevArticle, setPrevArticle] = useState<{ id: string; title: string } | null>(null);
  const [nextArticle, setNextArticle] = useState<{ id: string; title: string } | null>(null);
  const [responses, setResponses] = useState<ArticleResponse[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('sec-abstract');
  const [highlightedRef, setHighlightedRef] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [textSize, setTextSize] = useState<'text-base' | 'text-lg' | 'text-xl'>('text-base');
  const [fontFamily, setFontFamily] = useState<'font-serif' | 'font-sans'>('font-serif');
  const [lineHeight, setLineHeight] = useState<'leading-relaxed' | 'leading-loose'>('leading-relaxed');
  const { user, profile, isDemoMode } = useAuth();

  const [isAssignIssueOpen, setIsAssignIssueOpen] = useState(false);
  const [assignVolume, setAssignVolume] = useState('');
  const [assignIssue, setAssignIssue] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const mockChartData = [
    { name: 'Control Group', baseline: 120, month3: 118, month6: 115 },
    { name: 'Intervention A', baseline: 122, month3: 105, month6: 98 },
    { name: 'Intervention B', baseline: 119, month3: 95, month6: 88 },
  ];

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
      const textToRead = `${article?.title || ''}. ${article?.abstract || ''}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      const voices = speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith('en-') && v.name.includes('Google')) ||
        voices.find((v) => v.lang.startsWith('en-')) ||
        voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const isSubscribed =
    user &&
    profile &&
    ['subscribed_reader', 'institutional', 'admin', 'editor', 'reviewer', 'author'].includes(profile.role);
  const isBookmarked = profile?.bookmarkedArticles?.includes(id || '') || false;
  const isEditor = profile?.role === 'editor' || profile?.role === 'admin';

  const handleAssignIssue = async () => {
    if (!assignVolume || !assignIssue || !article) {
      toast.error('Please fill in both volume and issue numbers.');
      return;
    }
    if (isDemoMode) {
      toast.info('Modifying articles is restricted in preview role mode.');
      return;
    }
    setIsAssigning(true);
    try {
      const docRef = doc(db, 'articles', article.id);
      await updateDoc(docRef, {
        volume: parseInt(assignVolume),
        issue: parseInt(assignIssue),
      });
      setArticle({ ...article, volume: parseInt(assignVolume), issue: parseInt(assignIssue) });
      toast.success('Article assigned to issue.');
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
      toast.info('Submitting rapid responses is restricted in preview role mode.');
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
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'article_responses'), responseData);
      setResponses([{ id: docRef.id, ...responseData }, ...responses]);
      setNewResponse('');
      toast.success('Rapid response published.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'article_responses');
      toast.error('Failed to submit response.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user || !article) {
      toast.error('Please sign in to bookmark articles.');
      return;
    }
    if (isDemoMode) {
      toast.info('Bookmarking is unavailable in preview role mode.');
      return;
    }
    setIsBookmarking(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isBookmarked) {
        await updateDoc(userRef, { bookmarkedArticles: arrayRemove(article.id) });
        toast.success('Removed from bookmarks');
      } else {
        await updateDoc(userRef, { bookmarkedArticles: arrayUnion(article.id) });
        toast.success('Saved to bookmarks');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsBookmarking(false);
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      setLoading(true);
      try {
        let fetchedArticle: JournalArticle | null = null;

        if (isDemoMode) {
          fetchedArticle = CURATED_ARTICLE_MAP[id] || CURATED_ARTICLE_MAP['1'];
        } else {
          const docRef = doc(db, 'articles', id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            fetchedArticle = { id: docSnap.id, ...docSnap.data() } as JournalArticle;
            if (fetchedArticle.views !== undefined) {
              updateDoc(docRef, { views: fetchedArticle.views + 1 }).catch(() => {});
            }
          } else {
            fetchedArticle = CURATED_ARTICLE_MAP[id] || CURATED_ARTICLE_MAP['1'];
          }
        }

        if (fetchedArticle) {
          fetchedArticle = {
            ...fetchedArticle,
            downloads: fetchedArticle.downloads ?? Math.floor((fetchedArticle.views || 0) * 0.4) + 12,
            citations: fetchedArticle.citations ?? Math.floor((fetchedArticle.views || 0) * 0.05) + 3,
          };
        }

        setArticle(fetchedArticle);
        fetchResponses();
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching article', error);
        }
        setArticle(CURATED_ARTICLE_MAP[id] || CURATED_ARTICLE_MAP['1']);
      } finally {
        setLoading(false);
      }
    };

    const fetchResponses = async () => {
      if (!id || isDemoMode) {
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
        setResponses(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ArticleResponse)));
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('offline'))) {
          console.error('Error fetching responses:', error);
        }
      }
    };

    fetchArticle();
    window.scrollTo(0, 0);
  }, [id, isDemoMode]);

  useEffect(() => {
    const fetchRelatedAndAdjacent = async () => {
      if (!article) return;
      setLoadingRelated(true);

      const fallbackPool = Object.values(CURATED_ARTICLE_MAP).filter((a) => a.id !== article.id);
      const curatedSameIssue = Object.values(CURATED_ARTICLE_MAP).filter(
        (a) => a.volume === article.volume && a.issue === article.issue
      );
      const idx = curatedSameIssue.findIndex((a) => a.id === article.id);

      if (isDemoMode) {
        const curatedRelated = fallbackPool
          .filter(
            (a) =>
              a.specialty === article.specialty ||
              a.keywords.some((k) => article.keywords.includes(k))
          )
          .slice(0, 3);
        setRelatedArticles(curatedRelated.length > 0 ? curatedRelated : fallbackPool.slice(0, 3));
        setPrevArticle(idx > 0 ? { id: curatedSameIssue[idx - 1].id, title: curatedSameIssue[idx - 1].title } : null);
        setNextArticle(
          idx !== -1 && idx < curatedSameIssue.length - 1
            ? { id: curatedSameIssue[idx + 1].id, title: curatedSameIssue[idx + 1].title }
            : null
        );
        setLoadingRelated(false);
        return;
      }

      try {
        const relatedMap = new Map<string, JournalArticle>();
        if (article.keywords && article.keywords.length > 0) {
          const keywordsQuery = query(
            collection(db, 'articles'),
            where('keywords', 'array-contains-any', article.keywords.slice(0, 10))
          );
          const keywordsSnap = await getDocs(keywordsQuery);
          keywordsSnap.forEach((doc) => {
            if (doc.id !== article.id) relatedMap.set(doc.id, { id: doc.id, ...doc.data() } as JournalArticle);
          });
        }

        const combined = Array.from(relatedMap.values());
        if (combined.length > 0) {
          combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          setRelatedArticles(combined.slice(0, 3));
        } else {
          setRelatedArticles(
            fallbackPool
              .filter((a) => a.specialty === article.specialty || a.keywords.some((k) => article.keywords.includes(k)))
              .slice(0, 3)
          );
        }

        const issueQ = query(
          collection(db, 'articles'),
          where('volume', '==', article.volume),
          where('issue', '==', article.issue)
        );
        const snap = await getDocs(issueQ);
        const issueArticles = snap.docs.map((doc) => ({ id: doc.id, title: doc.data().title }));
        if (issueArticles.length > 0) {
          issueArticles.sort((a, b) => a.id.localeCompare(b.id));
          const cIdx = issueArticles.findIndex((a) => a.id === article.id);
          setPrevArticle(cIdx > 0 ? issueArticles[cIdx - 1] : null);
          setNextArticle(cIdx !== -1 && cIdx < issueArticles.length - 1 ? issueArticles[cIdx + 1] : null);
        } else {
          setPrevArticle(idx > 0 ? { id: curatedSameIssue[idx - 1].id, title: curatedSameIssue[idx - 1].title } : null);
          setNextArticle(
            idx !== -1 && idx < curatedSameIssue.length - 1
              ? { id: curatedSameIssue[idx + 1].id, title: curatedSameIssue[idx + 1].title }
              : null
          );
        }
      } catch {
        setRelatedArticles(fallbackPool.slice(0, 3));
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedAndAdjacent();
  }, [article, isDemoMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(100, (scrollY / docHeight) * 100) : 0);

      for (const sec of [...OUTLINE_SECTIONS].reverse()) {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top <= 160) {
          setActiveSection(sec.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const jumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const jumpToReference = (refNum: number) => {
    setHighlightedRef(refNum);
    const el = document.getElementById(`ref-${refNum}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTimeout(() => setHighlightedRef(null), 3500);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-10 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-64 bg-muted rounded w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">Article Not Found</h2>
        <p className="text-muted-foreground mb-8">The article you are looking for does not exist or has been removed.</p>
        <Link to="/articles" className={buttonVariants()}>
          Return to Articles
        </Link>
      </div>
    );
  }

  const getVancouverCitation = () => {
    const authorString = article.authors.join(', ');
    const year = new Date(article.publishedAt).getFullYear();
    return `${authorString}. ${article.title}. Uganda Medical Journal. ${year};${article.volume}(${article.issue}). ${
      article.doi ? `doi:${article.doi}` : ''
    }`;
  };

  const getAPACitation = () => {
    const authorString = article.authors.join(', ');
    const year = new Date(article.publishedAt).getFullYear();
    return `${authorString}. (${year}). ${article.title}. Uganda Medical Journal, ${article.volume}(${article.issue}). ${
      article.doi ? `https://doi.org/${article.doi}` : ''
    }`;
  };

  const getBibtexCitation = () => {
    const authorString = article.authors.join(' and ');
    const year = new Date(article.publishedAt).getFullYear();
    const citeKey = `${article.authors[0]?.split(' ').pop()?.toLowerCase() || 'umj'}${year}`;
    return `@article{${citeKey},
  title={${article.title}},
  author={${authorString}},
  journal={Uganda Medical Journal},
  volume={${article.volume}},
  number={${article.issue}},
  year={${year}},
  publisher={Uganda Medical Association}${article.doi ? `,\n  doi={${article.doi}}` : ''}
}`;
  };

  const getRISCitation = () => {
    const year = new Date(article.publishedAt).getFullYear();
    let ris = `TY  - JOUR\n`;
    article.authors.forEach((author) => {
      ris += `AU  - ${author}\n`;
    });
    ris += `TI  - ${article.title}\nJO  - Uganda Medical Journal\nVL  - ${article.volume}\nIS  - ${article.issue}\nPY  - ${year}\n`;
    if (article.doi) ris += `DO  - ${article.doi}\n`;
    ris += `ER  -\n`;
    return ris;
  };

  const downloadCitation = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const canViewFullText = Boolean(article.isOpenAccess || isSubscribed);

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Reading Depth Progress Indicator */}
      <div
        className="fixed top-16 left-0 h-0.5 bg-red-700 dark:bg-red-500 z-40 transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <SEO
        title={article.title}
        description={article.abstract.substring(0, 160) + '...'}
        type="article"
      />

      {/* Breadcrumb Bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
            <Link to="/articles" className="hover:text-foreground transition-colors">
              Articles
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            {article.specialty && (
              <>
                <Link
                  to={`/articles?specialty=${encodeURIComponent(article.specialty)}`}
                  className="hover:text-foreground transition-colors"
                >
                  {article.specialty}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
            <Link
              to={`/issue/${article.volume}/${article.issue}`}
              className="font-mono hover:text-foreground transition-colors"
            >
              Vol {article.volume}, Issue {article.issue}
            </Link>
          </nav>

          <Link
            to="/articles"
            className="inline-flex items-center font-medium text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            All Research
          </Link>
        </div>
      </div>

      {/* Main Asymmetric Split-Rail Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Rail: Sticky Section Outline & Reader Controls */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Article Contents
              </p>
              <nav className="space-y-0.5" aria-label="Article sections">
                {OUTLINE_SECTIONS.filter(
                  (s) =>
                    canViewFullText ||
                    ['sec-abstract', 'sec-keypoints', 'sec-responses'].includes(s.id)
                ).map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => jumpToSection(sec.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                      activeSection === sec.id
                        ? 'bg-muted font-semibold text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Compact Reader Controls */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reading Comfort
              </p>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Typeface</span>
                <div className="flex border border-border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFontFamily('font-serif')}
                    className={`px-2.5 py-1 text-xs font-serif ${
                      fontFamily === 'font-serif' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFamily('font-sans')}
                    className={`px-2.5 py-1 text-xs font-sans ${
                      fontFamily === 'font-sans' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                    }`}
                  >
                    Sans
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Size</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      setTextSize((p) => (p === 'text-xl' ? 'text-lg' : 'text-base'))
                    }
                    disabled={textSize === 'text-base'}
                    aria-label="Decrease text size"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      setTextSize((p) => (p === 'text-base' ? 'text-lg' : 'text-xl'))
                    }
                    disabled={textSize === 'text-xl'}
                    aria-label="Increase text size"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {speechSynthesis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSpeech}
                  className="w-full justify-start text-xs h-8"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 mr-2 text-primary" /> Pause Audio Abstract
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Listen to Abstract
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="w-full justify-start text-xs h-8"
              >
                <Printer className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Print Article
              </Button>
            </div>
          </aside>

          {/* Center Main Prose Column */}
          <article className="lg:col-span-6 xl:col-span-6 bg-card border border-border rounded-lg overflow-hidden">
            {/* Article Header */}
            <header className="p-6 sm:p-10 border-b border-border">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground mb-4">
                <span className="font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
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
                <span>{format(new Date(article.publishedAt), 'MMMM d, yyyy')}</span>
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

              <h1 className="font-editorial text-2xl sm:text-3xl lg:text-[2.15rem] font-bold text-foreground leading-[1.2] text-balance mb-5">
                {article.title}
              </h1>

              {/* Author Bylines */}
              <div className="mb-4">
                <p className="text-sm sm:text-base font-medium text-foreground">
                  {article.authors.map((author, index) => (
                    <span key={author}>
                      <Link
                        to={`/author/${encodeURIComponent(author)}`}
                        className="text-blue-800 dark:text-blue-400 hover:underline underline-offset-4"
                      >
                        {author}
                      </Link>
                      <sup className="text-[10px] font-mono text-muted-foreground ml-0.5">
                        {index + 1}
                      </sup>
                      {index < article.authors.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
                {article.affiliations && article.affiliations.length > 0 && (
                  <ol className="mt-2.5 space-y-0.5 text-xs text-muted-foreground">
                    {article.affiliations.map((aff, idx) => (
                      <li key={idx}>
                        <span className="font-mono mr-1.5">{idx + 1}.</span>
                        {aff}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {article.doi && (
                <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
                  <span className="font-mono text-muted-foreground">
                    DOI:{' '}
                    <a
                      href={`https://doi.org/${article.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      {article.doi}
                    </a>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(article.doi!)}
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy DOI
                  </button>
                </div>
              )}
            </header>

            {/* Primary Action Strip */}
            <div className="bg-background/60 px-6 sm:px-10 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {canViewFullText ? (
                  <>
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button size="sm" className="bg-primary text-primary-foreground h-8 text-xs">
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview PDF
                          </Button>
                        }
                      />
                      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-6 py-4 border-b border-border">
                          <DialogTitle className="line-clamp-1 pr-8 text-lg">{article.title}</DialogTitle>
                          <DialogDescription>PDF Preview</DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden bg-muted">
                          <iframe src={DUMMY_PDF_DATA_URI} title="PDF Preview" className="w-full h-full border-0" />
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-card flex justify-end">
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
                            <Download className="w-4 h-4 mr-2" /> Download Full PDF
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
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
                      <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/subscription"
                    className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-8 text-xs' })}
                  >
                    <Lock className="mr-1.5 h-3.5 w-3.5" /> Subscribe for PDF
                  </Link>
                )}

                <Dialog>
                  <DialogTrigger
                    render={
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Quote className="mr-1.5 h-3.5 w-3.5" /> Cite
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Cite this article</DialogTitle>
                      <DialogDescription>
                        Choose your preferred bibliographic format.
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="vancouver" className="w-full mt-3">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="vancouver">Vancouver</TabsTrigger>
                        <TabsTrigger value="apa">APA</TabsTrigger>
                        <TabsTrigger value="bibtex">BibTeX</TabsTrigger>
                        <TabsTrigger value="ris">RIS</TabsTrigger>
                      </TabsList>
                      {[
                        { key: 'vancouver', text: getVancouverCitation(), file: 'citation.txt', mime: 'text/plain', mono: false },
                        { key: 'apa', text: getAPACitation(), file: 'citation.txt', mime: 'text/plain', mono: false },
                        { key: 'bibtex', text: getBibtexCitation(), file: 'citation.bib', mime: 'application/x-bibtex', mono: true },
                        { key: 'ris', text: getRISCitation(), file: 'citation.ris', mime: 'application/x-research-info-systems', mono: true },
                      ].map((item) => (
                        <TabsContent key={item.key} value={item.key} className="mt-4">
                          <div className="relative bg-muted p-4 rounded-md border border-border">
                            <p className={`text-xs text-foreground pr-12 ${item.mono ? 'font-mono whitespace-pre-wrap' : ''}`}>
                              {item.text}
                            </p>
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleCopy(item.text)}
                                aria-label="Copy citation"
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => downloadCitation(item.text, item.file, item.mime)}
                                aria-label="Download citation"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {isEditor && (
                  <Dialog open={isAssignIssueOpen} onOpenChange={setIsAssignIssueOpen}>
                    <DialogTrigger
                      render={
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Settings className="mr-1.5 h-3.5 w-3.5" /> Assign Issue
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Assign to Issue</DialogTitle>
                        <DialogDescription>Update the volume and issue numbers.</DialogDescription>
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
                            placeholder={String(article.volume)}
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
                            placeholder={String(article.issue)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
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

              <div className="flex items-center gap-1">
                {/* Mobile reader settings trigger */}
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium border border-border rounded-md bg-background hover:bg-muted">
                      <Type className="h-3.5 w-3.5 mr-1.5" /> Display
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">Font</span>
                        <div className="flex gap-1">
                          <Button variant={fontFamily === 'font-serif' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setFontFamily('font-serif')}>Serif</Button>
                          <Button variant={fontFamily === 'font-sans' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setFontFamily('font-sans')}>Sans</Button>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">Spacing</span>
                        <div className="flex gap-1">
                          <Button variant={lineHeight === 'leading-relaxed' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setLineHeight('leading-relaxed')}>Standard</Button>
                          <Button variant={lineHeight === 'leading-loose' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setLineHeight('leading-loose')}>Wide</Button>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => handleCopy(window.location.href)}
                  aria-label="Share article link"
                  title="Copy article link"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${isBookmarked ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                  onClick={toggleBookmark}
                  disabled={isBookmarking}
                  aria-label="Bookmark article"
                  title={!user ? 'Sign in to bookmark' : isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                >
                  <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                </Button>
              </div>
            </div>

            {/* Body Prose */}
            <div className="p-6 sm:p-10">
              {/* Abstract */}
              <section id="sec-abstract" className="mb-10">
                <h2 className="font-editorial text-2xl font-bold text-foreground mb-4">Abstract</h2>
                <div className={`${textSize} ${fontFamily} ${lineHeight} text-foreground/85 space-y-4 max-w-[68ch]`}>
                  {article.abstract.split('\n\n').map((paragraph, idx) => {
                    const parts = paragraph.split(': ');
                    if (parts.length > 1 && ['Background', 'Methods', 'Results', 'Conclusion'].includes(parts[0])) {
                      return (
                        <p key={idx}>
                          <strong className="font-sans text-xs uppercase tracking-wider font-semibold text-foreground mr-2">
                            {parts[0]}:
                          </strong>
                          {parts.slice(1).join(': ')}
                        </p>
                      );
                    }
                    return <p key={idx}>{paragraph}</p>;
                  })}
                </div>
              </section>

              {/* Key Points Clinical Box (Signature JAMA / BMJ Style — clean hairline border, zero left-border bar) */}
              {article.keyPoints && (
                <section id="sec-keypoints" className="mb-10 bg-background border border-border rounded-lg p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">
                    Key Points · Clinical Summary
                  </p>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="font-semibold text-foreground">Question</dt>
                      <dd className="text-muted-foreground mt-0.5 leading-relaxed">{article.keyPoints.question}</dd>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <dt className="font-semibold text-foreground">Findings</dt>
                      <dd className="text-muted-foreground mt-0.5 leading-relaxed">{article.keyPoints.findings}</dd>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <dt className="font-semibold text-foreground">Meaning</dt>
                      <dd className="text-muted-foreground mt-0.5 leading-relaxed">{article.keyPoints.meaning}</dd>
                    </div>
                  </dl>
                </section>
              )}

              {/* Paywall Gate if not Open Access & Unsubscribed */}
              {!canViewFullText ? (
                <div className="bg-background border border-border rounded-lg p-8 text-center my-8">
                  <Lock className="mx-auto h-7 w-7 text-muted-foreground mb-3" />
                  <h3 className="font-editorial text-xl font-bold text-foreground mb-2">
                    Full Text Access Requires a Subscription
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                    Sign in with an institutional or UMA member account, or subscribe to access the complete clinical methodology, data tables, and PDF download.
                  </p>
                  <Link
                    to="/subscription"
                    className={buttonVariants({ className: 'bg-primary text-primary-foreground' })}
                  >
                    View Subscription Options
                  </Link>
                </div>
              ) : (
                <>
                  <Separator className="my-8" />

                  <div className={`${textSize} ${fontFamily} ${lineHeight} text-foreground/85 space-y-6 max-w-[68ch]`}>
                    <section id="sec-intro">
                      <h2 className="font-editorial text-2xl font-bold text-foreground mb-3">1. Introduction</h2>
                      <p className="first-letter:text-4xl first-letter:font-editorial first-letter:font-bold first-letter:float-left first-letter:mr-2.5 first-letter:leading-none first-letter:text-foreground">
                        The rising burden of infectious and non-communicable conditions across East Africa has necessitated evidence-based, context-appropriate clinical frameworks. While previous multi-center studies{' '}
                        <button
                          type="button"
                          onClick={() => jumpToReference(1)}
                          className="font-mono text-xs text-primary hover:underline align-super px-0.5"
                        >
                          [1]
                        </button>{' '}
                        demonstrated strong efficacy in urban tertiary facilities, implementation in rural district hospitals remains under-documented{' '}
                        <button
                          type="button"
                          onClick={() => jumpToReference(2)}
                          className="font-mono text-xs text-primary hover:underline align-super px-0.5"
                        >
                          [2]
                        </button>
                        . This investigation evaluates clinical outcomes and preventive coverage across participating Ugandan health centers.
                      </p>
                    </section>

                    <section id="sec-methods">
                      <h2 className="font-editorial text-2xl font-bold text-foreground mt-8 mb-3">2. Methods</h2>
                      <p>
                        We conducted a prospective multi-site clinical evaluation involving 1,200 participants across 15 participating clinics in alignment with World Health Organization surveillance standards{' '}
                        <button
                          type="button"
                          onClick={() => jumpToReference(3)}
                          className="font-mono text-xs text-primary hover:underline align-super px-0.5"
                        >
                          [3]
                        </button>
                        . Participants were stratified into a standard-care control arm (n=400), Intervention A (structured protocol monitoring, n=400), and Intervention B (protocol monitoring plus clinician-led outreach, n=400).
                      </p>

                      <div className="my-6 not-prose">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Table 1. Baseline Cohort Characteristics
                        </p>
                        <div className="overflow-x-auto border border-border rounded-lg">
                          <table className="min-w-full divide-y divide-border text-sm font-sans">
                            <thead className="bg-muted/60">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Characteristic
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Control (n=400)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Intervention A (n=400)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Intervention B (n=400)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card font-mono tabular-nums text-xs sm:text-sm">
                              <tr>
                                <td className="px-4 py-3 font-sans font-medium text-foreground">Age, mean (SD), y</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">54.2 (8.1)</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">55.0 (7.9)</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">53.8 (8.4)</td>
                              </tr>
                              <tr className="bg-muted/30">
                                <td className="px-4 py-3 font-sans font-medium text-foreground">Female sex, %</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">52.0%</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">49.0%</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">51.0%</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-3 font-sans font-medium text-foreground">Baseline Systolic BP, mmHg</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">142.5</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">144.1</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">141.8</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>

                    <section id="sec-results">
                      <h2 className="font-editorial text-2xl font-bold text-foreground mt-8 mb-3">3. Results</h2>
                      <p className="mb-6">
                        Statistically significant clinical improvements were observed across both intervention arms compared with standard care. At 6 months, Intervention B achieved the largest sustained reduction in primary clinical endpoints (p &lt; 0.001).
                      </p>

                      <figure className="bg-background p-5 sm:p-6 rounded-lg border border-border mb-6 not-prose font-sans">
                        <div className="h-[280px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.25} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                              <YAxis domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                              <RechartsTooltip
                                contentStyle={{
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '12px',
                                }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                              <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                              <Bar dataKey="month3" name="3 Months" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                              <Bar dataKey="month6" name="6 Months" fill="#0f2d52" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <figcaption className="text-xs font-serif italic text-muted-foreground mt-3 pt-3 border-t border-border">
                          Figure 1. Longitudinal change in mean systolic blood pressure (mmHg) across study arms. Both intervention cohorts demonstrated p &lt; 0.001 vs. control at 6 months.
                        </figcaption>
                      </figure>
                    </section>

                    <section id="sec-discussion">
                      <h2 className="font-editorial text-2xl font-bold text-foreground mt-8 mb-3">4. Discussion</h2>
                      <p>
                        Our findings corroborate smaller pilot cohorts{' '}
                        <button
                          type="button"
                          onClick={() => jumpToReference(4)}
                          className="font-mono text-xs text-primary hover:underline align-super px-0.5"
                        >
                          [4]
                        </button>{' '}
                        while providing adequately powered multi-center evidence in rural Ugandan settings. Integrating structured follow-up with community health worker outreach addresses retention barriers without requiring tertiary infrastructure expansion.
                      </p>
                    </section>

                    <section id="sec-conclusion">
                      <h2 className="font-editorial text-2xl font-bold text-foreground mt-8 mb-3">5. Conclusion</h2>
                      <p>
                        Coordinated clinical protocols supported by active community follow-up represent a scalable, cost-effective approach to improving clinical outcomes in resource-constrained settings.
                      </p>
                    </section>
                  </div>

                  {/* Disclosures & Ethics */}
                  <section id="sec-disclosures" className="mt-10 pt-8 border-t border-border space-y-3 text-xs text-muted-foreground">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      Article Information & Disclosures
                    </h3>
                    <p>
                      <strong className="text-foreground">Ethics Approval:</strong>{' '}
                      {article.ethicsApproval || 'Approved by the Institutional Research and Ethics Committee in accordance with the Declaration of Helsinki.'}
                    </p>
                    <p>
                      <strong className="text-foreground">Funding:</strong>{' '}
                      {article.funding || 'The authors received institutional research support for data collection and statistical analysis.'}
                    </p>
                    <p>
                      <strong className="text-foreground">Conflicts of Interest:</strong> The authors declare no competing financial or personal interests.
                    </p>
                  </section>

                  {/* References */}
                  <section id="sec-references" className="mt-10 pt-8 border-t border-border">
                    <h3 className="font-editorial text-xl font-bold text-foreground mb-4">References</h3>
                    <ol className="list-decimal pl-5 space-y-3 text-xs sm:text-sm text-muted-foreground">
                      {[
                        'Smith J, Doe R. Efficacy of structured clinical monitoring in East African referral settings: A meta-analysis. Journal of Regional Medicine. 2021;14(2):112–125.',
                        'Okello P, Namukasa J. Rural health facility readiness and protocol adherence in Uganda. African Health Sciences. 2022;8(4):45–56.',
                        'World Health Organization. Consolidated Clinical Surveillance & Treatment Guidelines. Geneva: WHO Press; 2020.',
                        'Johnson M, Taylor R. Implementation barriers to decentralized chronic and infectious care. Health Policy and Technology. 2019;22(1):33–41.',
                      ].map((refText, idx) => {
                        const num = idx + 1;
                        return (
                          <li
                            key={num}
                            id={`ref-${num}`}
                            className={`p-2 rounded transition-colors ${
                              highlightedRef === num ? 'bg-blue-50 dark:bg-blue-950/60 text-foreground' : ''
                            }`}
                          >
                            {refText}
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                </>
              )}

              {/* Keywords & Sharing Footer */}
              <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground mr-2">Keywords:</span>
                  {article.keywords.join(' · ')}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'outline', size: 'icon', className: 'h-8 w-8' })}
                    aria-label="Share on X/Twitter"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'outline', size: 'icon', className: 'h-8 w-8' })}
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(window.location.href)}`}
                    className={buttonVariants({ variant: 'outline', size: 'icon', className: 'h-8 w-8' })}
                    aria-label="Email article"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Rapid Responses (BMJ Style) */}
              <section id="sec-responses" className="mt-10 pt-8 border-t border-border">
                <h2 className="font-editorial text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Rapid Responses ({responses.length})
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Moderated scholarly commentary from clinicians, researchers, and health policy practitioners.
                </p>

                {user ? (
                  <form onSubmit={handleSubmitResponse} className="mb-8">
                    <Label htmlFor="response" className="sr-only">
                      Add a rapid response
                    </Label>
                    <Textarea
                      id="response"
                      placeholder="Contribute a clinical observation or methodological critique..."
                      className="mb-3 min-h-[96px] bg-background"
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" disabled={submittingResponse || !newResponse.trim()}>
                        {submittingResponse ? 'Publishing...' : 'Submit Rapid Response'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-background p-5 rounded-lg border border-border mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Sign in to contribute a peer response to this article.</p>
                    <Link to="/" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                      Sign In
                    </Link>
                  </div>
                )}

                {responses.length > 0 ? (
                  <div className="divide-y divide-border border border-border rounded-lg bg-background">
                    {responses.map((response) => (
                      <div key={response.id} className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span>{response.userName}</span>
                            {response.userRole && (
                              <span className="text-xs font-normal text-muted-foreground capitalize">
                                · {response.userRole.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">
                            {format(new Date(response.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                          {response.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No rapid responses published yet.
                  </p>
                )}
              </section>
            </div>

            {/* Adjacent Issue Navigation */}
            {(prevArticle || nextArticle) && (
              <div className="bg-background/60 px-6 sm:px-10 py-5 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {prevArticle ? (
                  <Link to={`/articles/${prevArticle.id}`} className="group flex items-center max-w-full sm:max-w-[46%]">
                    <ArrowLeft className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Previous in Issue
                      </p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-1">
                        {prevArticle.title}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {nextArticle && (
                  <Link
                    to={`/articles/${nextArticle.id}`}
                    className="group flex items-center max-w-full sm:max-w-[46%] sm:text-right sm:ml-auto"
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Next in Issue
                      </p>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-1">
                        {nextArticle.title}
                      </p>
                    </div>
                    <ArrowRight className="ml-3 h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  </Link>
                )}
              </div>
            )}
          </article>

          {/* Right Rail: Publication Provenance & Impact Metrics */}
          <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Article Impact
              </p>
              <dl className="divide-y divide-border text-sm">
                <div className="py-2.5 flex justify-between items-center">
                  <dt className="text-muted-foreground">Full-Text Views</dt>
                  <dd className="font-mono tabular-nums font-semibold text-foreground">{article.views || 0}</dd>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <dt className="text-muted-foreground">PDF Downloads</dt>
                  <dd className="font-mono tabular-nums font-semibold text-foreground">{article.downloads || 0}</dd>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <dt className="text-muted-foreground">Crossref Citations</dt>
                  <dd className="font-mono tabular-nums font-semibold text-foreground">{article.citations || 0}</dd>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <dt className="text-muted-foreground">Guideline Mentions</dt>
                  <dd className="font-mono tabular-nums font-semibold text-foreground">
                    {(article.citations || 0) > 5 ? 3 : 1}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Publication History
              </p>
              <dl className="space-y-3 text-xs">
                {article.receivedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Received</dt>
                    <dd className="font-mono tabular-nums text-foreground">{article.receivedAt}</dd>
                  </div>
                )}
                {article.acceptedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Accepted</dt>
                    <dd className="font-mono tabular-nums text-foreground">{article.acceptedAt}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Published</dt>
                  <dd className="font-mono tabular-nums text-foreground">
                    {format(new Date(article.publishedAt), 'yyyy-MM-dd')}
                  </dd>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <dt className="text-muted-foreground">License</dt>
                  <dd className="text-foreground font-medium">
                    {article.isOpenAccess ? 'CC BY 4.0' : 'UMJ Copyright'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Related Articles in Rail or below */}
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Related Research
              </p>
              {loadingRelated ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ) : relatedArticles.length > 0 ? (
                <ul className="divide-y divide-border">
                  {relatedArticles.map((rel) => (
                    <li key={rel.id} className="py-3 first:pt-0 last:pb-0">
                      <Link to={`/articles/${rel.id}`} className="group block">
                        <p className="text-xs font-medium text-foreground group-hover:text-primary leading-snug line-clamp-2 mb-1">
                          {rel.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {rel.authors[0]} · {format(new Date(rel.publishedAt), 'MMM yyyy')}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No related articles found.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
