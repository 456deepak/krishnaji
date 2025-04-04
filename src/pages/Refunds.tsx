import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Refunds() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Refunds and Cancellations</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Understanding our refund and cancellation policies to ensure a smooth experience.
        </p>
      </section>

      {/* Refund Policy */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Refund Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Eligible Refunds</h3>
                <p className="text-gray-600">
                  We process refunds for transactions that meet the following criteria:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Failed or incomplete transactions</li>
                  <li>Duplicate charges</li>
                  <li>Unauthorized transactions</li>
                  <li>Service unavailability</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Clock className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Processing Time</h3>
                <p className="text-gray-600">
                  Refunds are typically processed within 5-7 business days. The actual
                  time for the refund to appear in your account may vary depending on
                  your bank or payment provider.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Refund Process</h3>
                <p className="text-gray-600">
                  To request a refund, please contact our support team with:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Transaction ID</li>
                  <li>Date of transaction</li>
                  <li>Amount involved</li>
                  <li>Reason for refund</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cancellation Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Transaction Cancellation</h3>
                <p className="text-gray-600">
                  You can cancel a transaction before it is processed. Once a transaction
                  is initiated, it cannot be cancelled, but you may be eligible for a
                  refund based on our refund policy.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <XCircle className="w-6 h-6 text-red-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Non-Refundable Items</h3>
                <p className="text-gray-600">
                  The following are generally not eligible for refunds:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Completed and successful transactions</li>
                  <li>Service fees</li>
                  <li>Currency conversion charges</li>
                  <li>Transactions marked as "final sale"</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            If you have any questions about our refund or cancellation policies,
            please contact our support team:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Email: support@KirpabihariPay.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Hours: Monday - Friday, 9:00 AM - 6:00 PM</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 