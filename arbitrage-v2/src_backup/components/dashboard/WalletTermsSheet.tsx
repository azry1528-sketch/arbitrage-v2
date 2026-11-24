import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const SECTIONS: { title: string; text: string }[] = [
  {
    title: '1. Objet',
    text: "Les présentes conditions encadrent l'utilisation du portefeuille Covesting (le « Portefeuille »), qui vous permet de consulter les marchés, de préparer des échanges (swap) et de gérer vos actifs numériques.",
  },
  {
    title: '2. Portefeuille non-custodial',
    text: "Vous conservez seul(e) le contrôle de vos clés. Covesting ne demande jamais votre phrase de récupération ni votre clé privée, et ne peut ni les récupérer ni les réinitialiser. Si vous les perdez ou les communiquez, vos actifs peuvent être perdus définitivement.",
  },
  {
    title: '3. Services tiers',
    text: "Certaines opérations (swap, bridge, etc.) sont exécutées par des applications ou protocoles tiers. Ces opérations ne sont pas effectuées par Covesting, qui décline toute responsabilité quant à leur fonctionnement, leur disponibilité ou leur légitimité. Vérifiez toujours les applications tierces avant de les utiliser.",
  },
  {
    title: '4. Risques',
    text: "Les actifs numériques sont volatils et leur valeur peut chuter fortement. Les transactions sur blockchain sont irréversibles. Vous êtes seul(e) responsable de vos décisions et acceptez tous les risques associés.",
  },
  {
    title: '5. Pas de conseil',
    text: "Les informations affichées (prix, signaux, classements) sont fournies à titre informatif uniquement et ne constituent pas un conseil financier, juridique ou fiscal.",
  },
  {
    title: "6. Obligations de l'utilisateur",
    text: "Vous vous engagez à utiliser le Portefeuille conformément à la loi applicable, à sécuriser votre appareil et à ne pas utiliser le service à des fins frauduleuses ou illicites.",
  },
  {
    title: '7. Modifications',
    text: "Covesting peut modifier ces conditions ou suspendre tout ou partie du service. L'utilisation du Portefeuille après modification vaut acceptation des nouvelles conditions.",
  },
];

export function WalletTermsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent hideClose className="z-[90] gap-0 sm:max-w-md">
        <DialogTitle className="text-xl font-semibold tracking-normal">Conditions d'utilisation</DialogTitle>
        <DialogDescription className="sr-only">Conditions d'utilisation du portefeuille Covesting</DialogDescription>
        <div className="mt-4 max-h-[55vh] overflow-y-auto pr-1 space-y-4 text-[15px] leading-relaxed text-foreground/90">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1">{s.text}</p>
            </section>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-medium hover:brightness-95 transition"
        >
          J'ai compris
        </button>
      </DialogContent>
    </Dialog>
  );
}
