import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, ChevronDown, ArrowUpDown, Download, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { ENDPOINTS } from '@/utils/config';

// Form schema
const filterFormSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

interface Payment {
  _id: string;
  orderId: string;
  amount: number;
  status: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

const PaymentHistory = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      search: '',
      status: '',
      minAmount: '',
      maxAmount: '',
    },
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(ENDPOINTS.PAYMENTS.HISTORY, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch payments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Sort payments
  const sortedPayments = [...payments];
  if (sortConfig !== null) {
    sortedPayments.sort((a, b) => {
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      
      if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Sort handler
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter payments
  const onSubmit = async (data: FilterFormValues) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Handle search
      if (data.search) {
        queryParams.append('search', data.search);
      }
      
      // Handle status - only append if not "all"
      if (data.status && data.status !== 'all') {
        queryParams.append('status', data.status);
      }
      
      // Handle date range
      if (data.fromDate) {
        queryParams.append('fromDate', data.fromDate.toISOString());
      }
      if (data.toDate) {
        queryParams.append('toDate', data.toDate.toISOString());
      }
      
      // Handle amount range
      if (data.minAmount) {
        queryParams.append('minAmount', data.minAmount);
      }
      if (data.maxAmount) {
        queryParams.append('maxAmount', data.maxAmount);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${ENDPOINTS.PAYMENTS.HISTORY}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch filtered payments');
      }

      const filteredData = await response.json();
      setPayments(filteredData.data);
      
      toast({
        title: "Success",
        description: "Filters applied successfully",
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply filters",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    form.reset({
      search: '',
      status: 'all',
      fromDate: undefined,
      toDate: undefined,
      minAmount: '',
      maxAmount: '',
    });
    fetchPayments();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all your payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No payment records found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-medium">{payment.orderId}</TableCell>
                      <TableCell>
                        {format(new Date(payment.createdAt), 'dd MMM yyyy, HH:mm')}
                      </TableCell>
                      <TableCell>₹{payment.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div>
                          <div>{payment.recipientName}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.recipientEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.paymentMethod || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
