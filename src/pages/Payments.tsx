
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const paymentFormSchema = z.object({
  amount: z.string()
    .refine(val => !isNaN(Number(val)), { message: "Amount must be a number" })
    .refine(val => Number(val) > 0, { message: "Amount must be greater than 0" }),
  recipient: z.string().min(2, { message: "Recipient name is required" }),
  description: z.string().optional(),
  paymentMethod: z.string({ required_error: "Please select a payment method" }),
  paymentGateway: z.string({ required_error: "Please select a payment gateway" }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const cardDetailsSchema = z.object({
  cardNumber: z.string().min(16, { message: "Card number must be 16 digits" }).max(16),
  cardHolder: z.string().min(2, { message: "Cardholder name is required" }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Expiry date must be in MM/YY format" }),
  cvv: z.string().min(3, { message: "CVV must be 3 digits" }).max(4),
});

type CardDetailsFormValues = z.infer<typeof cardDetailsSchema>;

const Payments = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new");
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isCardProcessing, setIsCardProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      recipient: "",
      description: "",
      paymentMethod: "",
      paymentGateway: "cashfree", // Default to cashfree
    },
  });

  const cardForm = useForm<CardDetailsFormValues>({
    resolver: zodResolver(cardDetailsSchema),
    defaultValues: {
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: "",
    },
  });

  const onPaymentSubmit = async (data: PaymentFormValues) => {
    setIsPaymentSubmitting(true);
    setPaymentError(null);
    
    try {
      // Here you would integrate with your Node.js backend
      // This is a placeholder for the API call
      const paymentData = {
        amount: data.amount,
        recipient: data.recipient,
        description: data.description || '',
        paymentMethod: data.paymentMethod,
        paymentGateway: data.paymentGateway
      };
      
      console.log("Payment data to be sent to backend:", paymentData);
      
      // Simulate API call - in real implementation, replace with actual fetch to your Node.js backend
      setTimeout(() => {
        setIsPaymentSubmitting(false);
        
        // If the gateway is cashfree and it's a card payment, show the card form
        if (data.paymentGateway === 'cashfree' && data.paymentMethod === 'credit_card') {
          setShowCardForm(true);
        } else {
          // For UPI or other methods, you might redirect to Cashfree's page directly
          // This would be handled by your backend
          toast({
            title: "Redirecting to payment gateway",
            description: "You will be redirected to complete your payment.",
          });
        }
      }, 1000);
      
    } catch (error) {
      setIsPaymentSubmitting(false);
      setPaymentError("Failed to initiate payment. Please try again.");
      console.error("Payment initiation error:", error);
    }
  };

  const onCardSubmit = async (data: CardDetailsFormValues) => {
    setIsCardProcessing(true);
    setPaymentError(null);
    
    try {
      // Here you would integrate with your Node.js backend to process card payment
      // This is a placeholder for the API call
      const cardData = {
        ...data,
        amount: paymentForm.getValues("amount"),
        recipient: paymentForm.getValues("recipient"),
        paymentGateway: paymentForm.getValues("paymentGateway")
      };
      
      console.log("Card data to be sent to backend:", cardData);
      
      // Simulate payment processing - replace with actual fetch to your backend
      setTimeout(() => {
        setIsCardProcessing(false);
        setPaymentCompleted(true);
        
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        
        // Reset forms after successful payment
        setTimeout(() => {
          setPaymentCompleted(false);
          setShowCardForm(false);
          paymentForm.reset();
          cardForm.reset();
        }, 2000);
      }, 1500);
      
    } catch (error) {
      setIsCardProcessing(false);
      setPaymentError("Payment processing failed. Please try again or use another payment method.");
      console.error("Payment processing error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Make payments to your recipients</p>
      </div>
      
      <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="new">New Payment</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="new">
          {paymentError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
          )}
          
          {paymentCompleted ? (
            <Card className="w-full max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your payment of ${paymentForm.getValues("amount")} to {paymentForm.getValues("recipient")} has been processed successfully.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : showCardForm ? (
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Enter Card Details</CardTitle>
                <CardDescription>
                  Complete your payment of ${paymentForm.getValues("amount")} to {paymentForm.getValues("recipient")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...cardForm}>
                  <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4">
                    <FormField
                      control={cardForm.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012 3456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={cardForm.control}
                      name="cardHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Holder</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={cardForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={cardForm.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setShowCardForm(false)}
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={isCardProcessing}>
                        {isCardProcessing ? "Processing..." : "Complete Payment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>New Payment</CardTitle>
                <CardDescription>Fill out the form to make a new payment</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                              <Input className="pl-7" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="recipient"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient</FormLabel>
                          <FormControl>
                            <Input placeholder="Recipient name or email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="What's this payment for?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="paymentGateway"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Gateway</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a payment gateway" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cashfree">Cashfree</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="debit_card">Debit Card</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="netbanking">Net Banking</SelectItem>
                              <SelectItem value="wallet">Wallet</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isPaymentSubmitting}>
                        {isPaymentSubmitting ? "Processing..." : "Continue to Payment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Payments</CardTitle>
              <CardDescription>Manage your recurring payment schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Recurring Payments</h3>
                <p className="text-muted-foreground mb-6">You don't have any recurring payments set up yet.</p>
                <Button onClick={() => setActiveTab("new")}>Set Up a Recurring Payment</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payments;
