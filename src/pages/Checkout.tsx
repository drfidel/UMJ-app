import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, CreditCard, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const { plan } = useParams<{ plan: string }>();
  const { user, profile, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const planDetails = {
    individual: { name: 'Individual', price: '$50', period: 'year' },
    institutional: { name: 'Institutional', price: '$500', period: 'year' },
  };

  const selectedPlan = planDetails[(plan?.toLowerCase() as keyof typeof planDetails)] || planDetails.individual;

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to complete your subscription.');
      navigate('/subscription');
    }
  }, [user, navigate]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (isDemoMode) {
        toast.success(`Successfully subscribed to ${selectedPlan.name} plan (Demo Mode)`);
        navigate('/dashboard');
        return;
      }

      // In a real app, this would be handled by a Stripe webhook after successful payment.
      // For this prototype, we'll update the user's role directly.
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        role: selectedPlan.name === 'Institutional' ? 'institutional' : 'subscribed_reader',
        subscriptionPlan: selectedPlan.name,
        subscriptionDate: new Date().toISOString(),
      });

      toast.success(`Successfully subscribed to ${selectedPlan.name} plan!`);
      // Force reload to update auth context
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/subscription" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            &larr; Back to Pricing
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Checkout</CardTitle>
                <CardDescription>Complete your subscription to unlock full access.</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-900">Account Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue={profile?.displayName?.split(' ')[0] || ''} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue={profile?.displayName?.split(' ').slice(1).join(' ') || ''} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={profile?.email || ''} disabled />
                      <p className="text-xs text-slate-500">Your receipt will be sent to this email.</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-900 flex items-center justify-between">
                      Payment Details
                      <div className="flex space-x-2">
                        <CreditCard className="h-5 w-5 text-slate-400" />
                      </div>
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <div className="relative">
                        <Input id="cardNumber" placeholder="0000 0000 0000 0000" required />
                        <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" required />
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col items-start">
                <Button 
                  type="submit" 
                  form="checkout-form"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white text-lg h-12"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing Payment...' : `Pay ${selectedPlan.price}`}
                </Button>
                <div className="mt-4 flex items-center text-sm text-slate-500 w-full justify-center">
                  <ShieldCheck className="h-4 w-4 mr-1 text-green-600" />
                  Payments are secure and encrypted.
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card className="border-slate-200 shadow-sm sticky top-24">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg text-slate-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{selectedPlan.name} Subscription</p>
                      <p className="text-sm text-slate-500">Billed annually</p>
                    </div>
                    <p className="font-medium text-slate-900">{selectedPlan.price}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-bold text-lg text-slate-900">
                    <p>Total</p>
                    <p>{selectedPlan.price}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <h4 className="text-sm font-medium text-slate-900">What's included:</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                      Full text access to all articles
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                      Unlimited PDF downloads
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                      Access to complete journal archive
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
