import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const withdrawSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine(val => !isNaN(Number(val)), {
      message: 'Amount must be a valid number'
    })
    .refine(val => Number(val) > 0, {
      message: 'Amount must be greater than 0'
    }),
  description: z.string().optional()
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

const Withdraw = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch balance',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: '',
      description: ''
    }
  });

  const onSubmit = async (data: WithdrawFormValues) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const amount = Number(data.amount);

      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'withdraw',
          amount,
          description: data.description
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Withdrawal failed');
      }

      toast({
        title: 'Success',
        description: 'Withdrawal completed successfully'
      });

      form.reset();
      // Update balance after successful withdrawal
      await fetchBalance();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Withdrawal failed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Withdraw Money</CardTitle>
            <CardDescription>Withdraw money from your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-primary/5 rounded-lg border">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-primary">₹{balance.toFixed(2)}</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                          <Input 
                            type="number" 
                            className={cn(
                              "pl-7",
                              "appearance-none",
                              "[&::-webkit-outer-spin-button]:appearance-none",
                              "[&::-webkit-inner-spin-button]:appearance-none"
                            )}
                            placeholder="0.00" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Withdraw'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw; 