import { priceData } from "./data";
import { Card, CardContent } from "@/components/ui/card";
import Marquee from "./Marquee";

const CardSlider = () => {
  return (
    <div className="pt-14 flex flex-col gap-10">
      <div className="flex flex-col gap-3 items-center justify-center text-center">
        <p className="text-white font-medium">
          Cryptos <span className="text-[#6bd672]">en vedette</span>
        </p>
        <h2 className="sm:text-5xl text-3xl text-white font-medium">
          Suivi des principales cryptomonnaies
        </h2>
      </div>

      <Marquee duration={35}>
        {priceData.map((item, index) => (
          <div key={index} className="w-[220px] shrink-0">
            <Card className="bg-white/5 border-none shadow-none rounded-xl p-0">
              <CardContent className="px-5 py-6">
                <div className="flex flex-col items-center gap-5">
                  <div className={`${item.background} ${item.padding} rounded-full`}>
                    <img src={item.icon} alt={`${item.title} icon`} width={item.width} height={item.height} />
                  </div>
                  <p className="text-white text-xs font-normal">
                    <span className="text-base font-bold mr-2">{item.title}</span>
                    {item.short}
                  </p>
                </div>
                <div className="flex flex-col items-center mt-2">
                  <p className="text-xl font-bold text-white mb-0 leading-none">{item.price}</p>
                  <p className="text-xs text-white/40 mt-1">{item.mark}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </Marquee>
    </div>
  );
};

export default CardSlider;
