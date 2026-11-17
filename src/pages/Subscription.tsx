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
    <div className="bg-background min-h-screen py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Institutional & Individual Access
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-foreground mb-4">Subscription Plans</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Unlock full access to the Uganda Medical Journal's complete archive of peer-reviewed clinical research, trials, and regional health policy.
          </p>
        </div>

        {isAlreadySubscribed && (
          <div className="max-w-3xl mx-auto mb-12 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-3" />
            <h2 className="font-editorial text-2xl font-bold text-emerald-900 dark:text-emerald-200 mb-2">You have an active subscription</h2>
            <p className="text-emerald-800 dark:text-emerald-300/90 text-sm">
              You currently have full access to all articles and archival PDFs. Manage your plan from your dashboard.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mt-5">
              Go to Dashboard
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Free Tier */}
          <Card className="border-border bg-card shadow-sm flex flex-col">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-editorial text-2xl text-foreground">Basic Access</CardTitle>
              <div className="mt-4 flex justify-center items-baseline text-4xl font-bold font-editorial text-foreground">
                Free
              </div>
              <CardDescription className="mt-2">For general readers & students</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2.5 shrink-0" />
                  <span className="text-foreground/85">Access to Open Access articles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2.5 shrink-0" />
                  <span className="text-foreground/85">Read structured abstracts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2.5 shrink-0" />
                  <span className="text-foreground/85">Submit manuscripts</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Lock className="h-5 w-5 text-muted-foreground mr-2.5 shrink-0" />
                  <span className="text-muted-foreground line-through">Full text of subscription articles</span>
                </li>
                <li className="flex items-start opacity-50">
                  <Lock className="h-5 w-5 text-muted-foreground mr-2.5 shrink-0" />
                  <span className="text-muted-foreground line-through">PDF downloads</span>
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
          <Card className="border-primary/40 bg-card shadow-md relative flex flex-col md:-translate-y-2">
            <div className="h-1 bg-primary rounded-t-xl"></div>
            <CardHeader className="text-center pb-4 pt-6">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-2 block">
                Recommended for Clinicians
              </span>
              <CardTitle className="font-editorial text-2xl text-foreground">Individual</CardTitle>
              <div className="mt-4 flex justify-center items-baseline text-4xl font-bold font-editorial text-foreground tabular-nums">
                $50
                <span className="text-base font-sans font-medium text-muted-foreground ml-1">/year</span>
              </div>
              <CardDescription className="mt-2">For medical professionals</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2.5 shrink-0" />
                  <span className="text-foreground font-medium">Full text access to all articles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2.5 shrink-0" />
                  <span className="text-foreground font-medium">Unlimited PDF downloads</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2.5 shrink-0" />
                  <span className="text-muted-foreground">Access to complete 1966–2026 archive</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2.5 shrink-0" />
                  <span className="text-muted-foreground">Early Online First issue access</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => navigate('/checkout/individual')}
                disabled={Boolean(isAlreadySubscribed)}
              >
                {isAlreadySubscribed ? 'Current Plan' : 'Subscribe Now'}
                {!isAlreadySubscribed && <CreditCard className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>

          {/* Institutional */}
          <Card className="border-border bg-card shadow-sm flex flex-col">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-editorial text-2xl text-foreground">Institutional</CardTitle>
              <div className="mt-4 flex justify-center items-baseline text-4xl font-bold font-editorial text-foreground tabular-nums">
                $500
                <span className="text-base font-sans font-medium text-muted-foreground ml-1">/year</span>
              </div>
              <CardDescription className="mt-2">For universities & hospitals</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2.5 shrink-0" />
                  <span className="text-foreground/85">IP-based access for all members</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2.5 shrink-0" />
                  <span className="text-foreground/85">Unlimited PDF downloads</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2.5 shrink-0" />
                  <span className="text-foreground/85">COUNTER-compliant usage reporting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2.5 shrink-0" />
                  <span className="text-foreground/85">Dedicated account manager</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/checkout/institutional')}
                disabled={Boolean(isAlreadySubscribed)}
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
