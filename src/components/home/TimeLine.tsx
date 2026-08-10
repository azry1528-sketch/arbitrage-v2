import { motion } from "framer-motion";
import { timelineData } from "./data";

const TimeLine = () => {
  return (
    <section className="md:pt-40 pt-9" id="development">
      <div className="container mx-auto max-w-[1400px] lg:px-16 px-4">
        <div className="text-center">
          <motion.div
            whileInView={{ y: 0, opacity: 1 }}
            initial={{ y: "-40px", opacity: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col gap-4">
              <p className="text-white font-medium">
                Nous livrons <span className="text-[#6bd672]">la meilleure solution</span>
              </p>
              <h2 className="text-white sm:text-5xl text-3xl font-medium lg:w-[80%] mx-auto mb-16">
                Comment fonctionne l'arbitrage sur notre plateforme
              </h2>
            </div>
          </motion.div>

          <motion.div
            whileInView={{ scale: 1, opacity: 1 }}
            initial={{ scale: 0.9, opacity: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="md:block hidden relative">
              <div>
                <img
                  src="/images/timeline/img-timeline.png"
                  alt="image"
                  width={1220}
                  height={1000}
                  className="w-[80%] mx-auto"
                />
              </div>
              <div className="absolute top-36 lg:left-0 -left-20 w-72 flex items-center gap-6">
                <div className="text-right">
                  <h3 className="text-white/80 text-2xl mb-3">Détection</h3>
                  <p className="text-lg text-white/40">Scan continu des écarts de prix entre exchanges</p>
                </div>
                <div className="bg-[#6bd672]/15 backdrop-blur-sm px-6 py-2 h-fit rounded-full">
                  <img src="/images/solution/solution-icon-1.svg" alt="Détection" width={44} height={44} className="w-16 h-16" />
                </div>
              </div>
              <div className="absolute top-36 lg:right-0 -right-20 w-72 flex items-center gap-6">
                <div className="bg-[#6bd672]/15 backdrop-blur-sm p-6 h-fit rounded-full">
                  <img src="/images/solution/solution-icon-2.svg" alt="Analyse" width={44} height={44} />
                </div>
                <div className="text-left">
                  <h3 className="text-white/80 text-2xl mb-3">Analyse</h3>
                  <p className="text-lg text-white/40">Validation de l'opportunité et du seuil de profit</p>
                </div>
              </div>
              <div className="absolute bottom-36 lg:left-0 -left-20 w-72 flex items-center gap-6">
                <div className="text-right">
                  <h3 className="text-white/80 text-2xl mb-3">Exécution</h3>
                  <p className="text-lg text-white/40">Achat et revente automatisés en quelques millisecondes</p>
                </div>
                <div className="bg-[#6bd672]/15 backdrop-blur-sm px-6 py-2 h-fit rounded-full">
                  <img src="/images/solution/solution-icon-3.svg" alt="Exécution" width={44} height={44} className="w-16 h-16" />
                </div>
              </div>
              <div className="absolute bottom-36 lg:right-0 -right-20 w-72 flex items-center gap-6">
                <div className="bg-[#6bd672]/15 backdrop-blur-sm px-6 py-2 h-fit rounded-full">
                  <img src="/images/solution/solution-icon-4.svg" alt="Encaissement" width={44} height={44} className="w-16 h-16" />
                </div>
                <div className="text-left">
                  <h3 className="text-white/80 text-nowrap text-2xl mb-3">Encaissement</h3>
                  <p className="text-lg text-white/40">Le profit est crédité directement sur votre solde</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 md:hidden">
              {timelineData.map((item, index) => (
                <div key={index} className="flex items-center gap-6">
                  <div className="bg-[#6bd672]/15 p-6 rounded-full">
                    <img src={item.icon} alt={item.title} width={44} height={44} />
                  </div>
                  <div className="text-start">
                    <h4 className="text-2xl text-white/80 mb-2">{item.title}</h4>
                    <p className="text-white/40 text-lg">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TimeLine;
