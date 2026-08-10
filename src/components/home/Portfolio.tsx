import { motion } from "framer-motion";
import { portfolioData } from "./data";

const Portfolio = () => {
  return (
    <section className="pt-12" id="portfolio">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 items-center gap-20">
          <motion.div
            whileInView={{ y: 0, opacity: 1 }}
            initial={{ y: "-40px", opacity: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:-ml-16"
          >
            <img src="/images/portfolio/img-portfolio.png" alt="Crypto Portfolio" width={780} height={700} />
          </motion.div>

          <motion.div
            whileInView={{ y: 0, opacity: 1 }}
            initial={{ y: "40px", opacity: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col gap-4">
              <p className="text-white font-medium">
                Suivi <span className="text-[#6bd672]">en temps réel</span>
              </p>
              <h2 className="text-white sm:text-5xl text-3xl mb-4 font-medium">
                Suivez vos gains d'arbitrage dès aujourd'hui
              </h2>
            </div>
            <p className="text-white/50 text-lg">
              Un tableau de bord complet pour suivre vos bots, vos stratégies et vos gains d'arbitrage au quotidien.
            </p>

            <table className="w-full sm:w-[80%] mt-10">
              <tbody>
                {portfolioData.map((item, index) => (
                  <tr key={index} className="border-b border-white/10">
                    <td className="py-5">
                      <div className="bg-[#6bd672]/20 p-3 rounded-full w-fit">
                        <img src={item.image} alt={item.title} width={24} height={24} />
                      </div>
                    </td>
                    <td className="py-5">
                      <h3 className="text-white/80 text-xl ml-5">{item.title}</h3>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
