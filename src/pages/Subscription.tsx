import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Subscription() {
  const { user, profile, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      toast.error('Please log in to subscribe.');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isDemoMode) {
        toast.success(`Successfully subscribed to ${plan} plan (Demo Mode)`);
        navigate('/dashboard');
        return;
      }

      // In a real app, this would be handled by a Stripe webhook after successful payment.
      // For this prototype, we'll update the user's role directly.
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        role: 'subscribed_reader',
        subscriptionPlan: plan,
        subscriptionDate: new Date().toISOString(),
      });

      toast.success(`Successfully subscribed to ${plan} plan!`);
      // Force reload to update auth context
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isAlreadySubscribed = profile && ['subscribed_reader', 'institutional', 'admin', 'editor'].includes(profile.role);

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Subscription Plans</h1>
          <p className="text-lg text-slate-600">
            Unlock full access to the Uganda Medical Association Journal's extensive archive of peer-reviewed medical research.
          </p>
        </div>

        {isAlreadySubscribed && (
          <div className="max-w-3xl mx-auto mb-12 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">You have an active subscription!</h2>
            <p className="text-green-700">
              You currently have full access to all articles and features. You can manage your subscription from your dashboard.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mt-6 bg-green-700 hover:bg-green-800 text-white">
              Go to Dashboard
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-slate-900">Basic Access</CardTitle>
              <div className="mt-4 flex justify-center items-baseline text-4xl font-extrabold text-slate-900">
                Free
              </div>
              <CardDescription className="mt-2">For general readers</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-slate-600">Access to Open Access articles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-slate-600">Read article abstracts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-slate-600">Submit manuscripts</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Lock className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
                  <span className="text-slate-500 line-through">Full text of premium articles</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Lock className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
                  <span className="text-slate-500 line-through">PDF downloads</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Individual Subscription */}
          <Card className="border-blue-200 shadow-md relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-600 rounded-t-xl"></div>
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            </div>
            <CardHeader className="text-center pb-4 pt-8">
              <CardTitle className="text-2xl text-blue-900">Individual</CardTitle>
              <div className="mt-4 flex justify-center items-baseline text-4xl font-extrabold text-slate-900">
                $50
                <span className="text-xl font-medium text-slate-500 ml-1">/year</span>
              </div>
              <CardDescription className="mt-2">For medical professionals</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
                  <span className="text-slate-700 font-medium">Full text access to all articles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
                  <span className="text-slate-700 font-medium">Unlimited PDF downloads</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
                  <span className="text-slate-600">Access to complete journal archive</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2 shrink-0" />
                  <span className="text-slate-600">Early access to new issues</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-700 hover:bg-blue-800 text-white" 
                onClick={() => navigate('/checkout/individual')}
                disabled={isAlreadySubscribed}
              >
                {isAlreadySubscribed ? 'Current Plan' : 'Subscribe Now'}
                {!isAlreadySubscribed && <CreditCard className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>

          {/* Institutional */}
          <Card className="border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-slate-900">Institutional</CardTitle>
              <div className="mt-4 flex justify-center items-baseline text-4xl font-extrabold text-slate-900">
                $500
                <span className="text-xl font-medium text-slate-500 ml-1">/year</span>
              </div>
              <CardDescription className="mt-2">For universities & hospitals</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-slate-600">IP-based access for all members</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-slate-600">Unlimited PDF downloads</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-slate-600">Usage statistics reporting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                  <span className="text-slate-600">Dedicated account manager</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => navigate('/checkout/institutional')}
                disabled={isAlreadySubscribed}
              >
                {isAlreadySubscribed ? 'Current Plan' : 'Subscribe Now'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
