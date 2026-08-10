import { brandList } from "./data";
import Marquee from "./Marquee";

const BrandLogo = () => {
  return (
    <section className="2xl:py-20 py-11">
      <div className="gap-4">
        <div className="flex justify-center text-center py-4 relative">
          <p className="text-white font-medium">
            Une technologie <span className="text-[#6bd672]">approuvée à travers le monde</span>
          </p>
        </div>
        <div className="py-3">
          <Marquee duration={25}>
            {brandList.map((item, index) => (
              <div key={index} className="flex items-center justify-center h-12 w-[130px] shrink-0 opacity-80 hover:opacity-100 transition-opacity gap-2">
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <span className="text-white/70 text-sm font-medium truncate">{item.title}</span>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
};

export default BrandLogo;
