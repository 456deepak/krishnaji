import { load } from "@cashfreepayments/cashfree-js";
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { BACKEND_URL } from '@/utils/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

function Checkout() {
  const [loading, setLoading] = useState(false);
  const [cashfree, setCashfree] = useState(null);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
    },
  });

  useEffect(() => {
    initializeSDK();
    
    // Store the form data in localStorage before unload/redirect
    const handleBeforeUnload = () => {
      try {
        const formData = form.getValues();
        if (formData) {
          localStorage.setItem('checkout_form_data', JSON.stringify(formData));
        }
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const initializeSDK = async () => {
    try {
      const cashfreeInstance = await load({
        mode: import.meta.env.VITE_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      });
      setCashfree(cashfreeInstance);
    } catch (error) {
      console.error("Error initializing Cashfree SDK:", error);
      toast.error("Failed to initialize payment system");
    }
  };

  const updateUserBalance = async (amount, paymentData) => {
    try {
      console.log('Updating user balance with amount:', amount);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Log the token format (partially hidden for security)
      const tokenPreview = token.substring(0, 10) + '...' + token.substring(token.length - 10);
      console.log('Using auth token:', tokenPreview);

      const response = await axios.post(`${BACKEND_URL}/api/payments/update-balance`, 
        { 
          amount: parseFloat(amount), 
          paymentData: {
            ...paymentData,
            timestamp: new Date().toISOString()
          }
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('Update balance response:', response.data);
      
      if (response.data.success) {
        toast.success('Your balance has been updated successfully');
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update balance');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.message || 'Failed to update your balance');
      return false;
    }
  };

  const storePaymentData = async (paymentData, status) => {
    try {
      console.log('Storing payment data with status:', status);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Format data for storage - match the expected schema
      const transactionData = {
        amount: parseFloat(paymentData.amount),
        orderId: paymentData.orderId,
        status: status,
        paymentDetails: {
          recipientName: paymentData.customer_name || "Customer",
          recipientEmail: paymentData.customer_email || "customer@example.com",
          recipientPhone: paymentData.customer_phone || "1234567890"
        },
        metadata: paymentData
      };
      
      console.log('Sending transaction data:', transactionData);

      const response = await axios.post(`${BACKEND_URL}/api/payments/store-transaction`, 
        transactionData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('Store transaction response:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('Error storing payment data:', error);
      console.error('Error details:', error.response?.data);
      return false;
    }
  };

  const handleRedirect = (path, state) => {
    console.log('Redirecting to:', path, 'with state:', state);
    setTimeout(() => {
      navigate(path, { state });
    }, 2000); // Increased timeout to ensure API calls complete
  };

  const createOrder = async (data) => {
    if (!cashfree) {
      toast.error("Payment system is not ready. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Prepare order data to send to backend
      const orderData = {
        order_amount: parseFloat(data.amount),
        order_currency: "INR",
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone
      };
      
      console.log('Sending order data to backend:', orderData);

      // Call backend API
      const response = await axios.post(`${BACKEND_URL}/api/cashfree`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response from backend:', response);
      
      // Parse the response data
      const responseData = response.data;
      console.log('Order creation response:', responseData);
      
      if (!responseData || !responseData.payment_session_id) {
        throw new Error('Payment session ID not received');
      }

      console.log('Payment session ID:', responseData.payment_session_id);

      // Store all necessary data in localStorage before redirect
      // This is critical when using redirectTarget: "_self" as the page will completely reload
      localStorage.setItem('checkout_payment_details', JSON.stringify({
        amount: parseFloat(data.amount),
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        timestamp: new Date().toISOString()
      }));
      localStorage.setItem('checkout_order_id', responseData.order_id);
      localStorage.setItem('checkout_session_id', responseData.payment_session_id);
      
      console.log('Opening Cashfree checkout with session ID:', responseData.payment_session_id);
      console.log('Using redirectTarget: "_self" - page will reload after payment');

      // Configure checkout options - using redirectTarget: "_self" means the page will be completely reloaded
      const checkoutOptions = {
        paymentSessionId: responseData.payment_session_id,
        redirectTarget: "_self",
        onSuccess: (data) => {
          console.log('Payment Success:', data);
          // Note: This won't execute with redirectTarget: "_self" as the page will reload
        },
        onFailure: (data) => {
          console.log('Payment Failed:', data);
          // Note: This won't execute with redirectTarget: "_self" as the page will reload
        }
      };

      // Open Cashfree checkout
      await cashfree.checkout(checkoutOptions);

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Make a Payment</CardTitle>
          <CardDescription>Enter payment details to proceed</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(createOrder)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Processing..." : "Make Payment"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Checkout;