// Pied de page repris du template Forexo (carte pleine largeur avec copyright).
export function DashboardFooter() {
  return (
    <footer className="mt-6">
      <div className="glass-card px-4 py-3 text-center sm:text-left">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ArbiFlow
          <span className="block sm:inline sm:float-right">Fait avec ❤️ par l'équipe ArbiFlow</span>
        </p>
      </div>
    </footer>
  );
}
