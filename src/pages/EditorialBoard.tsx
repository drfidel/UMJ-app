import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function EditorialBoard() {
  const leadership = [
    {
      name: 'Prof. Emmanuel Mukiibi',
      role: 'Editor-in-Chief',
      affiliation: 'Makerere University College of Health Sciences',
      specialty: 'Internal Medicine',
      image: 'https://i.pravatar.cc/150?u=emmanuel',
    }
  ];

  const editorialStaff = [
    {
      name: 'Dr. Sarah Kizza',
      role: 'Deputy Editor',
      affiliation: 'Mulago National Referral Hospital',
      specialty: 'Pediatrics & Child Health',
      image: 'https://i.pravatar.cc/150?u=sarah',
    },
    {
      name: 'Dr. Peter Okello',
      role: 'Associate Editor',
      affiliation: 'Gulu University Faculty of Medicine',
      specialty: 'Public Health & Epidemiology',
      image: 'https://i.pravatar.cc/150?u=peter',
    },
    {
      name: 'Prof. Jane Namukasa',
      role: 'Associate Editor',
      affiliation: 'Mbarara University of Science and Technology',
      specialty: 'Obstetrics & Gynecology',
      image: 'https://i.pravatar.cc/150?u=jane',
    },
    {
      name: 'Dr. Moses Byaruhanga',
      role: 'Managing Editor',
      affiliation: 'Uganda Medical Association',
      specialty: 'Health Systems Management',
      image: 'https://i.pravatar.cc/150?u=moses',
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Editorial Board</h1>
          <p className="text-lg text-slate-600">
            The Uganda Medical Association Journal is guided by a distinguished board of medical professionals and researchers dedicated to advancing healthcare in Uganda and globally.
          </p>
        </div>

        {/* Leadership Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-8 text-center sm:text-left">Leadership</h2>
          <div className="flex justify-center sm:justify-start">
            {leadership.map((editor, index) => (
              <Card key={index} className="w-full max-w-md text-center hover:shadow-lg transition-all border-blue-200 bg-white ring-1 ring-blue-100">
                <CardHeader className="pt-8 pb-4">
                  <Avatar className="w-28 h-28 mx-auto mb-4 border-4 border-white shadow-md ring-2 ring-blue-500/20">
                    <AvatarImage src={editor.image} alt={editor.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                      {editor.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl text-slate-900">{editor.name}</CardTitle>
                  <div className="mt-2 text-center">
                    <Badge className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1 text-sm rounded-full">
                      {editor.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <p className="text-slate-600 text-base mb-2">{editor.affiliation}</p>
                  <p className="text-blue-600 text-sm uppercase tracking-wider font-semibold">{editor.specialty}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Editorial Staff Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-4 mb-8 text-center sm:text-left">Editorial Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {editorialStaff.map((editor, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow border-slate-200 bg-white">
                <CardHeader className="pt-8 pb-4">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-sm">
                    <AvatarImage src={editor.image} alt={editor.name} />
                    <AvatarFallback className="bg-slate-100 text-slate-700 text-xl font-bold">
                      {editor.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl text-slate-900">{editor.name}</CardTitle>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-slate-700 border-slate-300">
                      {editor.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <p className="text-slate-600 text-sm mb-2">{editor.affiliation}</p>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{editor.specialty}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
