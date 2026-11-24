import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { LINKEDIN_URL, TWITTER_URL, COMPANY_ADDRESS } from "@/lib/brand";
import { Facebook, Instagram, Twitter, Linkedin, MapPin } from "lucide-react";
import { headerData, footerLabels } from "./data";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="pt-16 bg-[#181A20]">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-1 sm:grid-cols-11 lg:gap-20 md:gap-6 sm:gap-12 gap-6 pb-16">
          <div className="lg:col-span-4 md:col-span-6 col-span-6 flex flex-col gap-6">
            <Logo size={36} variant="dark" />
            <p className="text-white/60">
              Covesting détecte et exploite automatiquement les écarts de prix entre exchanges,
              pour un profit récurrent sans intervention manuelle.
            </p>
            <p className="text-white/60 flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#FCD535]" />
              <span>Covesting — {COMPANY_ADDRESS}</span>
            </p>
            <div className="flex gap-6 items-center relative z-[1]">
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="group">
                <Linkedin width={22} height={22} className="text-white group-hover:text-[#FCD535]" />
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="group">
                <Facebook width={22} height={22} className="text-white group-hover:text-[#FCD535]" />
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="group">
                <Instagram width={22} height={22} className="text-white group-hover:text-[#FCD535]" />
              </a>
              <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="group">
                <Twitter width={22} height={22} className="text-white group-hover:text-[#FCD535]" />
              </a>
            </div>
          </div>
          <div className="lg:col-span-2 md:col-span-3 col-span-6">
            <h4 className="text-white mb-4 font-medium text-xl">Liens</h4>
            <ul>
              {headerData.map((item, index) => (
                <li key={index} className="pb-4">
                  <a href={item.href} className="text-white/60 hover:text-[#FCD535] text-base">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2 md:col-span-3 col-span-6">
            <h4 className="text-white mb-4 font-medium text-xl">Autres pages</h4>
            <ul>
              {footerLabels.map((item, index) => (
                <li key={index} className="pb-4">
                  <a href={item.href} className="text-white/60 hover:text-[#FCD535] text-base">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3 md:col-span-4 col-span-6">
            <h3 className="text-white text-xl font-medium mb-4">Commencer</h3>
            <div className="flex flex-col gap-3">
              <Link
                to="/register"
                className="text-[#181A20] bg-[#FCD535] hover:bg-[#FCD535]/80 text-center px-5 py-2.5 rounded-lg font-medium"
              >
                Créer un compte
              </Link>
              <Link
                to="/login"
                className="text-[#FCD535] border border-[#FCD535] hover:bg-[#FCD535]/10 text-center px-5 py-2.5 rounded-lg font-medium"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <p className="text-white/40 text-center py-8">Covesting · Token COVS — Tous droits réservés</p>
      </div>
    </footer>
  );
};

export default Footer;
