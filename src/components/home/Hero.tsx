import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BrandLogo from "./BrandLogo";
import CardSlider from "./CardSlider";

const Hero = () => {
  const navigate = useNavigate();

  const leftAnimation = {
    initial: { x: "-60px", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.6 },
  };

  const rightAnimation = {
    initial: { x: "60px", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.6 },
  };

  return (
    <section className="relative py-24 pt-48 overflow-hidden" id="main-banner">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div {...leftAnimation} className="flex flex-col items-center lg:items-start gap-10">
            <div className="flex flex-col gap-4 text-center lg:text-left">
              <div className="flex gap-6 items-center lg:justify-start justify-center">
                <Badge
                  variant="outline"
                  className="text-base py-1.5 px-4 bg-[#6bd672]/10 rounded-full border border-white/10 text-[#6bd672] font-medium h-9"
                >
                  L'arbitrage crypto nouvelle génération
                </Badge>
              </div>
              <h1 className="font-medium xl:text-[72px] md:text-6xl sm:text-5xl text-4xl text-white leading-[1.1]">
                Exploitez les écarts de prix crypto, automatiquement
              </h1>
              <p className="text-white/70 text-lg">
                Nos bots surveillent en continu plusieurs exchanges et exécutent l'achat/revente
                dès qu'un écart de prix rentable apparaît — pour un profit récurrent, sans intervention manuelle.
              </p>
            </div>
            <div className="flex items-center md:justify-start justify-center gap-8">
              <Button
                onClick={() => navigate("/register")}
                className="text-base bg-[#6bd672] hover:bg-[#6bd672]/80 flex items-center gap-2 border border-[#6bd672] rounded-lg font-semibold text-black py-6 px-7 cursor-pointer h-12"
              >
                Découvrir
                <img src="/images/icons/icon-arrow.svg" alt="arrow-icon" width={20} height={20} />
              </Button>
            </div>
          </motion.div>
          <motion.div {...rightAnimation} className="justify-self-center">
            <div className="w-full h-full">
              <img
                src="/images/hero/hero-banner-img.png"
                alt="Banner"
                width={584}
                height={582}
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </div>
        <BrandLogo />
        <CardSlider />
      </div>
    </section>
  );
};

export default Hero;
