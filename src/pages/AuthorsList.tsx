import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Article {
  authors: string[];
}

export default function AuthorsList() {
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dummy data fallback
  const dummyArticles = [
    { authors: ['Dr. Jane Namukasa', 'Dr. Peter Okello'] },
    { authors: ['Dr. Sarah Kizza', 'Prof. Emmanuel Mukiibi'] },
    { authors: ['Dr. Moses Byaruhanga'] },
    { authors: ['Dr. Florence Akello', 'Dr. David Otim'] }
  ];

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const q = query(collection(db, 'articles'));
        const querySnapshot = await getDocs(q);
        
        let fetchedArticles: Article[] = [];
        if (!querySnapshot.empty) {
          fetchedArticles = querySnapshot.docs.map(doc => doc.data() as Article);
        } else {
          fetchedArticles = dummyArticles;
        }

        // Extract all authors, flatten array, get unique, and sort alphabetically
        const allAuthors = new Set<string>();
        fetchedArticles.forEach(article => {
          if (article.authors && Array.isArray(article.authors)) {
            article.authors.forEach(author => allAuthors.add(author.trim()));
          }
        });

        const sortedAuthors = Array.from(allAuthors).sort((a, b) => a.localeCompare(b));
        setAuthors(sortedAuthors);
      } catch (error) {
        console.error("Error fetching authors, falling back to dummy data", error);
        
        const allAuthors = new Set<string>();
        dummyArticles.forEach(article => {
          article.authors.forEach(author => allAuthors.add(author.trim()));
        });
        setAuthors(Array.from(allAuthors).sort((a, b) => a.localeCompare(b)));
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  const filteredAuthors = authors.filter(author => 
    author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group authors by first letter safely
  const groupedAuthors: Record<string, string[]> = {};
  filteredAuthors.forEach(author => {
    // Determine the letter to group by (handle cases where names start with 'Dr.', 'Prof.', etc.)
    const cleanName = author.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
    const firstLetter = cleanName.charAt(0).toUpperCase();
    
    if (!groupedAuthors[firstLetter]) {
      groupedAuthors[firstLetter] = [];
    }
    groupedAuthors[firstLetter].push(author);
  });

  const sortedLetters = Object.keys(groupedAuthors).sort();

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight flex items-center justify-center">
            <Users className="w-10 h-10 mr-4 text-blue-700" />
            Our Authors
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover the researchers, clinicians, and academics who have contributed their work to the Uganda Medical Association Journal.
          </p>
        </div>

        <div className="mb-10 max-w-md mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search authors..."
              className="pl-10 h-12 text-base rounded-full border-slate-200 focus-visible:ring-blue-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : filteredAuthors.length > 0 ? (
          <div className="space-y-12">
            {sortedLetters.map(letter => (
              <div key={letter} className="relative">
                <div className="flex items-center mb-6">
                  <div className="text-3xl font-bold text-blue-700 w-12">{letter}</div>
                  <div className="h-px bg-slate-200 flex-grow ml-4"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pl-0 md:pl-16">
                  {groupedAuthors[letter].map(author => (
                    <Link 
                      key={author} 
                      to={`/author/${encodeURIComponent(author)}`}
                      className="block group"
                    >
                      <Card className="h-full border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white group-hover:bg-blue-50/50">
                        <CardContent className="p-4 flex items-start space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold uppercase text-sm mt-0.5">
                            {author.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-2 leading-tight">
                              {author}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">View Profile &rarr;</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No authors found</h3>
            <p className="text-slate-500 mt-1">
              {searchTerm ? `No authors match "${searchTerm}"` : 'There are currently no authors in the system.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}