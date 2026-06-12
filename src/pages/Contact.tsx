import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import SEO from '@/components/SEO';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SEO 
        title="Contact Us" 
        description="Contact the editorial office of the Uganda Medical Journal for inquiries about submissions, subscriptions, or policies."
      />
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Have questions about manuscript submission, subscriptions, or editorial policies? Get in touch with our team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-2 border-slate-200">Get In Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 text-blue-700 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Mailing Address</h3>
                  <p className="text-slate-600">
                    Uganda Medical Association<br />
                    Plot 123 Healthcare Avenue<br />
                    P.O. Box 29874<br />
                    Kampala, Uganda
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-blue-700 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Email Information</h3>
                  <p className="text-slate-600 mb-1"><span className="font-medium">Editorial Queries:</span> editor@umj.org.ug</p>
                  <p className="text-slate-600 mb-1"><span className="font-medium">Submissions:</span> submit@umj.org.ug</p>
                  <p className="text-slate-600"><span className="font-medium">Support:</span> support@umj.org.ug</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-6 w-6 text-blue-700 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Phone</h3>
                  <p className="text-slate-600">
                    <span className="font-medium">Main Office:</span> +256 414 123 456<br />
                    <span className="font-medium">Editorial Office:</span> +256 312 987 654
                  </p>
                  <p className="text-sm text-slate-500 mt-2">Available Mon-Fri, 9am - 5pm EAT</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 shadow-sm relative">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Send a Message</h2>
          {submitted && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl p-6 text-center">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Send className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
              <p className="text-slate-600">Thank you for reaching out. Our team will get back to you within 2-3 business days.</p>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</label>
                <Input 
                  id="name" 
                  placeholder="Dr. Jane Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="jane.doe@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</label>
              <select 
                id="subject"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              >
                <option value="" disabled>Select an inquiry type</option>
                <option value="submission">Manuscript Submission</option>
                <option value="editorial">Editorial Inquiry</option>
                <option value="subscription">Subscription / Access</option>
                <option value="technical">Technical Support</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-slate-700">Message</label>
              <textarea 
                id="message" 
                rows={5}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="How can we help you today?"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              ></textarea>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
              {isSubmitting ? 'Sending...' : 'Send Message'}
              {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
