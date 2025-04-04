import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Please read these terms and conditions carefully before using our services.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            By accessing and using KirpabihariPay's services, you agree to be bound by these
            Terms and Conditions. If you do not agree to these terms, please do not
            use our services.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>2. Service Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            KirpabihariPay provides payment processing services, including but not limited to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Payment processing and transfer services</li>
            <li>Account management and transaction history</li>
            <li>Security and fraud prevention measures</li>
            <li>Customer support services</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>3. User Responsibilities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            As a user of our services, you agree to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Not engage in any fraudulent or illegal activities</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>4. Privacy and Security</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            We are committed to protecting your privacy and security. Our data collection
            and processing practices are outlined in our Privacy Policy. We implement
            industry-standard security measures to protect your information.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>5. Payment Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            All payments processed through our platform are subject to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Transaction fees as disclosed during the payment process</li>
            <li>Processing times based on the selected payment method</li>
            <li>Currency conversion rates when applicable</li>
            <li>Compliance with anti-money laundering regulations</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>6. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            KirpabihariPay shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of our services
            or any transactions conducted through our platform.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>7. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            We reserve the right to modify these terms at any time. Users will be
            notified of any significant changes, and continued use of our services
            constitutes acceptance of the modified terms.
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-gray-600">
        <p>Last updated: April 4, 2024</p>
      </div>
    </div>
  );
} 