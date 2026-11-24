import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CovsCoin } from "@/components/brand/CovsToken";
import { TOKEN_SYMBOL } from "@/lib/brand";

// Section dédiée au token COVS sur la page d'accueil.
const TokenCovs = () => {
  const navigate = useNavigate();
  return (
    <section id="covs" className="py-16 md:py-24">
      <div className="container mx-auto max-w-[1400px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl border border-[#FCD535]/30 bg-[#1E2329] px-6 py-12 md:px-14 md:py-16"
        >
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#FCD535]/20" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-5 text-center lg:text-left items-center lg:items-start">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-[#FCD535]/10 px-4 py-1.5 text-sm font-medium text-[#FCD535]">
                Le token de l'écosystème Covesting
              </span>
              <h2 className="text-3xl md:text-5xl font-medium text-white leading-tight">
                Token <span className="text-[#FCD535]">{TOKEN_SYMBOL}</span>
              </h2>
              <p className="text-white/70 text-lg max-w-xl">
                Le {TOKEN_SYMBOL} est le token de Covesting : il est au cœur de la plateforme et
                de sa communauté. Rejoignez Covesting et suivez toutes les nouvelles du {TOKEN_SYMBOL}.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-[#FCD535] hover:bg-[#FCD535]/80 text-[#181A20] font-semibold rounded-lg h-12 px-7"
                >
                  Rejoindre Covesting
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#FCD535]/30" />
                <CovsCoin className="relative w-56 h-56 md:w-72 md:h-72" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TokenCovs;
