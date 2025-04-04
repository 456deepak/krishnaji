import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'pending'>('pending');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get('order_id');
        if (!orderId) {
          throw new Error('Order ID not found');
        }

        const response = await fetch(`/api/payments/verify/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }

        const data = await response.json();
        
        if (data.order_status === 'PAID') {
          setStatus('success');
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully'
          });
        } else {
          setStatus('failed');
          toast({
            title: 'Payment Failed',
            description: 'Your payment could not be processed',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        toast({
          title: 'Error',
          description: 'Failed to verify payment status',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, toast]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Verifying Payment</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please wait while we verify your payment status...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            {status === 'success' ? 'Payment Successful' : 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {status === 'success'
              ? 'Your payment has been processed successfully'
              : 'There was an error processing your payment'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={handleContinue}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
          >
            Continue to Dashboard
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStatus; 