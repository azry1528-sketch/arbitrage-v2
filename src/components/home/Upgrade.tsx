import { CheckCircle2 } from "lucide-react";
import { upgradeData } from "./data";

const Upgrade = () => {
  return (
    <section className="py-20" id="upgrade">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-white font-medium">
              ArbiFlow <span className="text-[#6bd672]">évolue</span>
            </p>
            <h2 className="text-white sm:text-5xl text-3xl font-medium mb-5">
              Laissez vos bots travailler pour vous
            </h2>
            <p className="text-white/50 text-lg mb-7">
              Des stratégies d'arbitrage optimisées en continu par nos algorithmes, pour un rendement plus stable et prévisible.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              {upgradeData.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <CheckCircle2 className="text-[#6bd672] shrink-0" width={24} height={24} />
                  <h3 className="text-lg text-white/50">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="ml-0 lg:ml-7 justify-self-center">
              <img src="/images/upgrade/img-upgrade.png" alt="image" width={625} height={580} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Upgrade;
