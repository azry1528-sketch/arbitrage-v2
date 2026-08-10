import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erreur de connexion',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleData?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    if (error) {
      toast({ title: 'Erreur Google', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div
      className="min-h-screen bg-[#04070d] flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl px-8 py-10"
      >
        <div className="mb-10 text-center mx-auto inline-block max-w-[160px] w-full">
          <Link to="/" className="flex items-center justify-center gap-2">
            <img src="/images/logo/logo.svg" alt="logo" className="h-8 w-auto" />
          </Link>
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg p-3.5 hover:bg-white/10 bg-white/5 text-white cursor-pointer h-auto border-none ring-0 shadow-none"
        >
          Continuer avec Google
          <svg width="22" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.5001 11.2438C22.5134 10.4876 22.4338 9.73256 22.2629 8.995H11.7246V13.0771H17.9105C17.7933 13.7929 17.5296 14.478 17.1352 15.0914C16.7409 15.7047 16.224 16.2335 15.6158 16.646L15.5942 16.7827L18.9264 19.3124L19.1571 19.335C21.2772 17.4161 22.4997 14.5926 22.4997 11.2438" fill="#4285F4" />
            <path d="M11.7245 22C14.755 22 17.2992 21.0221 19.1577 19.3355L15.6156 16.6464C14.6679 17.2944 13.3958 17.7467 11.7245 17.7467C10.3051 17.7385 8.92433 17.2926 7.77814 16.472C6.63195 15.6515 5.77851 14.4981 5.33892 13.1755L5.20737 13.1865L1.74255 15.8142L1.69727 15.9376C2.63043 17.7602 4.06252 19.2925 5.83341 20.3631C7.60429 21.4337 9.64416 22.0005 11.7249 22" fill="#34A853" />
            <path d="M5.33889 13.1755C5.09338 12.4753 4.96669 11.7404 4.96388 11C4.9684 10.2608 5.09041 9.52685 5.32552 8.8245L5.31927 8.67868L1.81196 6.00867L1.69724 6.06214C0.910039 7.5938 0.5 9.28491 0.5 10.9999C0.5 12.7148 0.910039 14.406 1.69724 15.9376L5.33889 13.1755Z" fill="#FBBC05" />
            <path d="M11.7249 4.25337C13.3333 4.22889 14.8888 4.8159 16.065 5.89121L19.2329 2.86003C17.2011 0.992106 14.5106 -0.0328008 11.7249 3.27798e-05C9.64418 -0.000452376 7.60433 0.566279 5.83345 1.63686C4.06256 2.70743 2.63046 4.23965 1.69727 6.06218L5.32684 8.82455C5.77077 7.50213 6.62703 6.34962 7.77491 5.5295C8.9228 4.70938 10.3044 4.26302 11.7249 4.25337Z" fill="#EB4335" />
          </svg>
        </Button>

        <span className="z-[1] relative my-8 block text-center before:content-[''] before:absolute before:h-px before:w-[40%] before:bg-white/10 before:left-0 before:top-3 after:content-[''] after:absolute after:h-px after:w-[40%] after:bg-white/10 after:top-3 after:right-0">
          <span className="relative z-10 inline-block px-3 text-base text-white bg-[#04070d]">OU</span>
        </span>

        <form onSubmit={handleLogin}>
          <div className="mb-[22px]">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-white/10 border-solid bg-transparent px-5 py-3 h-auto text-base text-white placeholder:text-white/40 focus:border-[#6bd672] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none transition"
            />
          </div>
          <div className="mb-[22px] relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-white/10 border-solid bg-transparent px-5 py-3 pr-11 h-auto text-base text-white placeholder:text-white/40 focus:border-[#6bd672] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="mb-9">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#6bd672] text-black w-full py-6 rounded-lg text-lg font-medium border border-[#6bd672] hover:text-[#6bd672] hover:bg-transparent transition-all duration-300"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>
        </form>

        <a href="#" className="mb-2 block text-base text-white/70 hover:text-[#6bd672] text-center">
          Mot de passe oublié ?
        </a>
        <p className="text-white/70 text-base text-center">
          Pas encore membre ?{' '}
          <Link to="/register" className="text-[#6bd672] hover:underline">
            S'inscrire
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
