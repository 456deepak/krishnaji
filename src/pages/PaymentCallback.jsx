import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BACKEND_URL } from '@/utils/config';

const PaymentCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    console.log('PaymentCallback mounted');
    console.log('URL params:', Object.fromEntries(searchParams.entries()));
    console.log('Location state:', location.state);
    
    // Get order ID from URL or localStorage
    const orderId = searchParams.get('order_id') || localStorage.getItem('checkout_orderId');
    console.log('Order ID:', orderId);
    
    if (!orderId) {
      console.error('No order ID found');
      setError('No order ID found');
      setIsLoading(false);
      return;
    }
    
    // Check if we have auth token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      setError('Authentication required');
      setIsLoading(false);
      return;
    }
    
    verifyPayment(orderId, token);
    
    // If the status in the URL is 'success' but the payment is still pending,
    // we need to update the payment status
    const urlStatus = searchParams.get('status');
    if (urlStatus === 'success') {
      updatePaymentStatus(orderId, token);
    }
  }, [searchParams, location.state]);

  const verifyPayment = async (orderId, token) => {
    try {
      console.log('Verifying payment for order:', orderId);
      
      const response = await axios.get(`${BACKEND_URL}/api/payments/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Payment verification response:', response.data);
      
      if (response.data.success) {
        // The server returns data in response.data.data, not response.data.payment
        const paymentData = response.data.data;
        setPaymentData(paymentData);
        
        // If payment is successful, clear stored checkout data
        if (paymentData.status === 'completed') {
          localStorage.removeItem('checkout_orderId');
          localStorage.removeItem('checkout_paymentSessionId');
          localStorage.removeItem('checkout_paymentDetails');
          
          toast({
            title: "Payment Successful",
            description: `Your payment of ₹${paymentData.amount} has been processed successfully. Your balance has been updated.`,
          });
        } else if (paymentData.status === 'failed') {
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Pending",
            description: "Your payment is still being processed.",
          });
        }
      } else {
        setError(response.data.message || 'Failed to verify payment');
        toast({
          title: "Error",
          description: response.data.message || 'Failed to verify payment',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError(error.response?.data?.message || error.message || 'Failed to verify payment');
      
      // If payment record not found, try to create a temporary one from localStorage
      const storedPaymentDetails = localStorage.getItem('checkout_paymentDetails');
      if (storedPaymentDetails) {
        try {
          const details = JSON.parse(storedPaymentDetails);
          setPaymentData({
            orderId: orderId,
            amount: details.amount,
            status: searchParams.get('status') || 'pending',
            createdAt: new Date().toISOString(),
            paymentDetails: details
          });
        } catch (e) {
          console.error('Error parsing stored payment details:', e);
        }
      }
      
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || 'Failed to verify payment',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId, token) => {
    try {
      console.log('Updating payment status for order:', orderId);
      
      const response = await axios.post(`${BACKEND_URL}/api/payments/verify`, 
        { orderId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Payment status update response:', response.data);
      
      if (response.data.success) {
        // Refresh the payment data
        verifyPayment(orderId, token);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    
    if (paymentData?.status === 'completed') {
      return <CheckCircle className="h-12 w-12 text-green-500" />;
    } else if (paymentData?.status === 'failed') {
      return <XCircle className="h-12 w-12 text-red-500" />;
    } else {
      return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Verifying Payment...';
    
    if (paymentData?.status === 'completed') {
      return 'Payment Successful';
    } else if (paymentData?.status === 'failed') {
      return 'Payment Failed';
    } else {
      return 'Payment Pending';
    }
  };

  const getStatusDescription = () => {
    if (isLoading) return 'Please wait while we verify your payment.';
    
    if (paymentData?.status === 'completed') {
      return 'Your payment has been processed successfully.';
    } else if (paymentData?.status === 'failed') {
      return 'There was an issue processing your payment.';
    } else {
      return 'Your payment is still being processed. Please check back later.';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle>Verifying Payment</CardTitle>
            <CardDescription>Please wait while we verify your payment.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error && !paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/dashboard')}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle>{getStatusText()}</CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentData && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-medium">{paymentData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">₹{paymentData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium ${
                  paymentData.status === 'completed' ? 'text-green-500' : 
                  paymentData.status === 'failed' ? 'text-red-500' : 
                  'text-yellow-500'
                }`}>
                  {paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {new Date(paymentData.createdAt).toLocaleString()}
                </span>
              </div>
              {paymentData.paymentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <span className="font-medium">{paymentData.paymentId}</span>
                </div>
              )}
            </div>
          )}
          {paymentData && (
            <div className="mt-6">
              {paymentData.status === 'completed' ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Your payment has been processed successfully.
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : paymentData.status === 'failed' ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    There was an issue processing your payment.
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-block bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Return Home
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Your payment is still being processed. Please check back later.
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Return Home
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Return Home
          </Button>
          <Button onClick={() => navigate('/dashboard/payment-history')}>
            View Payment History
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentCallback; 