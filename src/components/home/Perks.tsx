import { perksData } from "./data";
import { Card, CardContent } from "@/components/ui/card";

const Perks = () => {
  return (
    <section className="pb-28 relative">
      <div className="container mx-auto max-w-[1400px] px-4 relative z-[2]">
        <div className="text-center">
          <div className="flex flex-col gap-4">
            <p className="text-white/70 text-base relative">
              Toujours à <span className="text-[#6bd672]">vos côtés</span>
            </p>
            <h2 className="text-white sm:text-5xl text-3xl font-medium">
              Soyez parmi les premiers sur ArbiFlow !
            </h2>
          </div>
          <div className="mt-16 border border-white/10 grid lg:grid-cols-3 sm:grid-cols-2 py-16 gap-10 px-6 md:px-20 rounded-3xl bg-white/[0.02]">
            {perksData.map((item, index) => (
              <Card
                key={index}
                className="text-center flex items-center justify-end flex-col bg-transparent border-none shadow-none ring-0 p-0"
              >
                <CardContent className="p-0 flex flex-col items-center justify-end">
                  <div className="bg-[#6bd672]/25 backdrop-blur-sm p-4 rounded-full w-fit">
                    <img src={item.icon} alt={item.title} width={44} height={44} />
                  </div>
                  <h3 className={`text-white text-2xl mb-4 mt-6 ${item.space}`}>{item.title}</h3>
                  <p className="text-white/50">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-[#477e70] to-[#666c78] w-96 h-96 rounded-full -bottom-48 blur-[200px] absolute -left-48 opacity-40" />
    </section>
  );
};

export default Perks;
