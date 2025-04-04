import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface CashfreeCheckoutProps {
  amount: number;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  onSuccess: () => void;
  onFailure: () => void;
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

const CashfreeCheckout = ({
  amount,
  recipientName,
  recipientEmail,
  recipientPhone,
  onSuccess,
  onFailure
}: CashfreeCheckoutProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cashfree, setCashfree] = useState<any>(null);

  useEffect(() => {
    // Initialize Cashfree SDK
    const initializeSDK = async () => {
      try {
        // Import the load function from cashfree-js
        const { load } = await import('@cashfreepayments/cashfree-js');
        
        // Initialize Cashfree
        const cashfreeInstance = await load({
          mode: import.meta.env.VITE_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
        });
        
        console.log('Cashfree SDK initialized successfully');
        setCashfree(cashfreeInstance);
      } catch (error) {
        console.error('Error initializing Cashfree SDK:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize payment system',
          variant: 'destructive'
        });
      }
    };

    initializeSDK();
  }, [toast]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      console.log('Initiating payment with details:', {
        amount,
        recipientName,
        recipientEmail,
        recipientPhone
      });
      
      // Step 1: Create order and get payment session ID
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          recipientName,
          recipientEmail,
          recipientPhone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment creation failed:', errorData);
        throw new Error(errorData.message || 'Failed to create payment');
      }

      const { orderId, paymentSessionId, orderStatus, orderAmount, orderCurrency } = await response.json();
      console.log('Order created:', { orderId, paymentSessionId, orderStatus, orderAmount, orderCurrency });

      // Check if Cashfree is initialized
      if (!cashfree) {
        throw new Error('Cashfree SDK not initialized');
      }

      // Step 2: Open Cashfree checkout with the payment session ID
      const options = {
        orderId: orderId,
        paymentSessionId: paymentSessionId,
        onSuccess: (data: any) => {
          console.log('Payment successful:', data);
          toast({
            title: 'Success',
            description: 'Payment completed successfully',
          });
          onSuccess();
        },
        onFailure: (data: any) => {
          console.error('Payment failed:', data);
          toast({
            title: 'Error',
            description: 'Payment failed. Please try again.',
            variant: 'destructive'
          });
          onFailure();
        }
      };

      console.log('Opening Cashfree checkout with options:', options);
      cashfree.checkout(options);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: 'destructive'
      });
      onFailure();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={loading || !cashfree}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Pay Now'
      )}
    </Button>
  );
};

export default CashfreeCheckout; 