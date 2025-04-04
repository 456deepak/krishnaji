import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, History, Menu, LogOut, ArrowDownUp, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const UserLayout = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CreditCard, label: 'Payments', path: '/dashboard/payments' },
    { icon: History, label: 'Payment History', path: '/dashboard/payment-history' },
    { icon: ArrowDownUp, label: 'Withdraw', path: '/dashboard/withdraw' },
    { icon: History, label: 'Transaction History', path: '/dashboard/transactions' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed top-4 left-4 z-50"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-6 w-6 text-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-bold text-foreground">User Panel</h1>
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-foreground">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-4 py-2 rounded-lg transition-colors",
                          isActive && (item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path))
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                        )
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r bg-background">
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b">
            <h1 className="text-xl font-bold text-foreground">User Panel</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-2 rounded-lg transition-colors",
                    isActive && (item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path))
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  )
                }
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex-shrink-0 p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserLayout; 