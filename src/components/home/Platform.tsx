import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Platform = () => {
  const navigate = useNavigate();
  return (
    <section className="md:pt-44 sm:pt-24 pt-12 relative">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="bg-white/[0.03] px-8 md:px-16 py-14 rounded-3xl border-2 border-white/10 grid grid-cols-12 items-center overflow-hidden relative">
          <div className="lg:col-span-8 col-span-12">
            <h2 className="text-white sm:text-[40px] text-3xl mb-6">
              ArbiFlow, propulsé par la technologie
            </h2>
            <p className="text-white/50 text-lg">
              Nos algorithmes surveillent des dizaines d'exchanges en continu pour saisir chaque
              opportunité d'arbitrage avant qu'elle ne disparaisse.
            </p>
          </div>
          <div className="lg:col-span-4 col-span-12">
            <div className="flex lg:justify-end lg:mt-0 mt-7 justify-center">
              <Button
                onClick={() => navigate("/register")}
                className="flex items-center gap-2.5 text-black bg-[#6bd672] hover:bg-[#6bd672]/80 border border-[#6bd672] py-6 px-5 rounded-lg text-lg font-medium h-14"
              >
                Créer un compte
                <img src="/images/icons/icon-arrow.svg" alt="icon" width={20} height={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Platform;
