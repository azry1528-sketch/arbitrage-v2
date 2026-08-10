import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/home/Header';
import Hero from '@/components/home/Hero';
import Work from '@/components/home/Work';
import GlobalReach from '@/components/home/GlobalReach';
import TimeLine from '@/components/home/TimeLine';
import Platform from '@/components/home/Platform';
import Portfolio from '@/components/home/Portfolio';
import Upgrade from '@/components/home/Upgrade';
import Perks from '@/components/home/Perks';
import Faq from '@/components/home/Faq';
import Footer from '@/components/home/Footer';

const Index = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;

  return (
    <div className="min-h-screen bg-[#04070d]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <main>
        <Hero />
        <Work />
        <GlobalReach />
        <TimeLine />
        <Platform />
        <Portfolio />
        <Upgrade />
        <Perks />
        <Faq />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
