import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const services = [
  { icon: "/images/chooseus/chooseus-icon-1.svg", text: "Bots d'arbitrage actifs 24h/24 sur plusieurs exchanges" },
  { icon: "/images/chooseus/chooseus-icon-2.svg", text: "Commencez à arbitrer dès aujourd'hui, sans expérience requise" },
  { icon: "/images/chooseus/chooseus-icon-3.svg", text: "Retraits rapides vers votre portefeuille personnel" },
];

const Work = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const bottomAnimation = {
    initial: { y: "60px", opacity: 0 },
    animate: inView ? { y: 0, opacity: 1 } : { y: "60px", opacity: 0 },
    transition: { duration: 0.6, delay: 0.2 },
  };

  const topAnimation = {
    initial: { y: "-60px", opacity: 0 },
    animate: inView ? { y: 0, opacity: 1 } : { y: "-60px", opacity: 0 },
    transition: { duration: 0.6, delay: 0.4 },
  };

  return (
    <section id="work">
      <div className="container mx-auto max-w-[1400px] px-4">
        <div ref={ref} className="grid grid-cols-12 items-center">
          <motion.div {...bottomAnimation} className="lg:col-span-7 col-span-12">
            <div className="flex flex-col gap-3">
              <p className="text-white font-medium">
                Pourquoi choisir <span className="text-[#6bd672]">ArbiFlow</span>
              </p>
              <h2 className="sm:text-5xl text-3xl text-white lg:w-full font-medium">
                Les atouts de notre plateforme d'arbitrage crypto
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-7 mt-11">
              {services.map((service, index) => (
                <div key={index} className="flex items-center gap-5">
                  <div className="p-3 bg-[#6bd672]/15 rounded-full">
                    <img src={service.icon} alt={`${service.text} icon`} width={25} height={25} />
                  </div>
                  <p className="text-white font-medium">{service.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div {...topAnimation} className="lg:col-span-5 col-span-12">
            <div className="2xl:-mr-40 mt-9 flex justify-center">
              <img src="/images/work/img-work-with-us.png" alt="image" width={600} height={425} className="lg:w-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Work;
