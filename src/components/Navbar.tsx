import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Moon, Home, LogOut, Info, Phone, FileText, RefreshCw, X } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Check if we're in the dashboard section
  const isDashboardSection = location.pathname.startsWith('/dashboard') || 
                            location.pathname.startsWith('/admin');

  // Check if user is an admin
  const isAdmin = localStorage.getItem('adminToken') !== null;

  // Public links that should only be visible on the main site
  const publicLinks = [
    { icon: Info, name: 'About', path: '/about' },
    { icon: Phone, name: 'Contact', path: '/contact' },
    { icon: FileText, name: 'Terms', path: '/terms' },
    { icon: RefreshCw, name: 'Refunds', path: '/refunds' }
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md shadow-md border-b"
          : "bg-background"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center"
          >
            <Link to="/" className="text-2xl font-bold text-foreground">
              <span className="text-primary">Kirpabihari</span>Pay
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Public Links - Only show on main site */}
            {!isDashboardSection && publicLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button variant="ghost" className="flex items-center">
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.name}
                </Button>
              </Link>
            ))}
            
            {/* Auth Buttons */}
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard">
                  <Button variant="ghost">Admin Dashboard</Button>
                </Link>
                <Button variant="ghost" onClick={handleAdminLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Admin Logout
                </Button>
              </>
            ) : user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Menu</h2>
                  </div>
                  <div className="flex-1 p-4 space-y-2">
                    {/* Public Links - Only show on main site */}
                    {!isDashboardSection && publicLinks.map((link) => (
                      <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.name}
                        </Button>
                      </Link>
                    ))}

                    {isAdmin ? (
                      <>
                        <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            Admin Dashboard
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start" onClick={handleAdminLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Admin Logout
                        </Button>
                      </>
                    ) : user ? (
                      <>
                        <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            Dashboard
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            Login
                          </Button>
                        </Link>
                        <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full justify-start">
                            Register
                          </Button>
                        </Link>
                      </>
                    )}
                    <Button variant="ghost" className="w-full justify-start" onClick={toggleTheme}>
                      {theme === 'light' ? (
                        <>
                          <Moon className="mr-2 h-4 w-4" />
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <Sun className="mr-2 h-4 w-4" />
                          Light Mode
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar; 