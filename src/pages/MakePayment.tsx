import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
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
import CashfreeCheckout from '@/components/CashfreeCheckout';
import { load } from '@cashfreepayments/cashfree-js';


const formSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientEmail: z.string().email('Invalid email address'),
  recipientPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type FormValues = z.infer<typeof formSchema>;

const MakePayment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
    },
  });

  const handlePayment = async (data: FormValues) => {
    setLoading(true);
    const cashfree = await load({
        mode: import.meta.env.VITE_CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
    });
    // Form submission is handled by CashfreeCheckout component
  };

  const handlePaymentSuccess = () => {
    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed successfully'
    });
    navigate('/payment-history');
  };

  const handlePaymentFailure = () => {
    toast({
      title: 'Payment Failed',
      description: 'There was an error processing your payment',
      variant: 'destructive'
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Make a Payment</CardTitle>
          <CardDescription>Enter payment details to proceed</CardDescription>
        </CardHeader>
        <CardContent>
          {/* <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recipient name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter recipient email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recipient phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CashfreeCheckout
                amount={parseFloat(form.getValues('amount'))}
                recipientName={form.getValues('recipientName')}
                recipientEmail={form.getValues('recipientEmail')}
                recipientPhone={form.getValues('recipientPhone')}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
              />
            </form>
          </Form> */}
          <button onClick={() => handlePayment(form.getValues())}>Make Payment</button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MakePayment; 