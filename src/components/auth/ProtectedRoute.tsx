import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, profile } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Compte bloqué</h1>
          <p className="text-muted-foreground">
            Votre compte a été bloqué. Veuillez contacter le support pour plus d'informations.
          </p>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-lg text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-destructive">Accès refusé</h1>
          <p className="text-muted-foreground">
            Votre compte (<span className="font-medium text-foreground">{profile?.email ?? user.email}</span>) n'a
            pas le rôle <strong>admin</strong>. Cette section est réservée aux administrateurs.
          </p>
          <p className="text-xs text-muted-foreground">
            Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur pour vérifier votre rôle dans la
            table <code>user_roles</code>.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Retour au dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>Accueil</Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
