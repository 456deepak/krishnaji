import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Target, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About KirpabihariPay</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We are committed to providing Kirpabihari, reliable, and innovative payment solutions
          to businesses and individuals worldwide.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="grid md:grid-cols-2 gap-8 mb-16">
        <Card>
          <CardHeader>
            <Target className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              To revolutionize the payment industry by providing accessible, Kirpabihari, and
              user-friendly payment solutions that empower businesses and individuals
              to transact with confidence.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Award className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Our Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              To become the leading payment platform globally, known for innovation,
              security, and customer satisfaction while driving financial inclusion
              and digital transformation.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Company Info */}
      <section className="mb-16">
        <Card>
          <CardHeader>
            <Building2 className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Our Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Founded in 2024, KirpabihariPay has grown to become a trusted name in the
                payment industry. Our platform serves millions of users across the globe,
                processing transactions worth billions annually.
              </p>
              <p className="text-gray-600">
                We pride ourselves on our commitment to security, innovation, and
                customer service. Our team of experts works tirelessly to ensure
                that our platform remains at the forefront of payment technology.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Team Section */}
      <section>
        <Card>
          <CardHeader>
            <Users className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Our Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Our diverse team consists of industry experts, technology innovators,
              and customer service professionals. Together, we work to provide the
              best possible payment experience for our users.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 