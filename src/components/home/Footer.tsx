import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { headerData, footerLabels } from "./data";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="pt-16 bg-[#04070d]">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-1 sm:grid-cols-11 lg:gap-20 md:gap-6 sm:gap-12 gap-6 pb-16">
          <div className="lg:col-span-4 md:col-span-6 col-span-6 flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/logo/logo.svg" alt="logo" className="h-8 w-auto" />
              <span className="text-white font-semibold text-lg">ArbiFlow</span>
            </Link>
            <p className="text-white/60">
              ArbiFlow détecte et exploite automatiquement les écarts de prix entre exchanges,
              pour un profit récurrent sans intervention manuelle.
            </p>
            <div className="flex gap-6 items-center relative z-[1]">
              <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="group">
                <Facebook width={22} height={22} className="text-white group-hover:text-[#6bd672]" />
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="group">
                <Instagram width={22} height={22} className="text-white group-hover:text-[#6bd672]" />
              </a>
              <a href="https://www.twitter.com/" target="_blank" rel="noreferrer" className="group">
                <Twitter width={22} height={22} className="text-white group-hover:text-[#6bd672]" />
              </a>
            </div>
          </div>
          <div className="lg:col-span-2 md:col-span-3 col-span-6">
            <h4 className="text-white mb-4 font-medium text-xl">Liens</h4>
            <ul>
              {headerData.map((item, index) => (
                <li key={index} className="pb-4">
                  <a href={item.href} className="text-white/60 hover:text-[#6bd672] text-base">
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
                  <a href={item.href} className="text-white/60 hover:text-[#6bd672] text-base">
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
                className="text-black bg-[#6bd672] hover:bg-[#6bd672]/80 text-center px-5 py-2.5 rounded-lg font-medium"
              >
                Créer un compte
              </Link>
              <Link
                to="/login"
                className="text-[#6bd672] border border-[#6bd672] hover:bg-[#6bd672]/10 text-center px-5 py-2.5 rounded-lg font-medium"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
        <Separator className="bg-white/10" />
        <p className="text-white/40 text-center py-8">ArbiFlow — Tous droits réservés</p>
      </div>
    </footer>
  );
};

export default Footer;
