import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function EditorialBoard() {
  const editors = [
    {
      name: 'Prof. Emmanuel Mukiibi',
      role: 'Editor-in-Chief',
      affiliation: 'Makerere University College of Health Sciences',
      specialty: 'Internal Medicine',
      image: 'https://i.pravatar.cc/150?u=emmanuel',
    },
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {editors.map((editor, index) => (
            <Card key={index} className="text-center hover:shadow-md transition-shadow border-slate-200">
              <CardHeader className="pt-8 pb-4">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-sm">
                  <AvatarImage src={editor.image} alt={editor.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                    {editor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl text-slate-900">{editor.name}</CardTitle>
                <p className="text-blue-700 font-medium mt-1">{editor.role}</p>
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
  );
}
