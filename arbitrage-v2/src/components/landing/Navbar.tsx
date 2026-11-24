import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Zap, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { CryptoTicker } from './CryptoTicker';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Fonctionnalités' },
    { href: '#how-it-works', label: 'Comment ça marche' },
    { href: '#leaderboard', label: 'Classement' },
    { href: '#faq', label: 'FAQ' },
  ];

  const dashboardPath = isAdmin ? '/admin' : '/dashboard';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50'
          : 'bg-transparent'
      }`}
    >
      <CryptoTicker />
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-serif font-bold text-gradient-gold">
              ArbiFlow
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => navigate('/admin')}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                )}
                <Button
                  className="btn-gold px-6"
                  onClick={() => navigate(dashboardPath)}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Mon compte
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-primary"
                  onClick={() => navigate('/login')}
                >
                  Connexion
                </Button>
                <Button
                  className="btn-gold px-6"
                  onClick={() => navigate('/register')}
                >
                  Commencer
                </Button>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-3 border-t border-border">
                {user ? (
                  <>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="w-full border-primary/40 text-primary"
                        onClick={() => {
                          navigate('/admin');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    )}
                    <Button
                      className="w-full btn-gold"
                      onClick={() => {
                        navigate(dashboardPath);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Mon compte
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Connexion
                    </Button>
                    <Button
                      className="w-full btn-gold"
                      onClick={() => {
                        navigate('/register');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Commencer
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
