import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { globalReachData } from "./data";
import { Card, CardContent } from "@/components/ui/card";

const Counter = ({ end, duration = 1600 }: { end: number; duration?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let frame: number;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * end));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, end, duration]);

  return <span ref={ref}>{value}</span>;
};

const GlobalReach = () => {
  return (
    <section>
      <div className="container mx-auto max-w-[1400px] px-4">
        <div className="pt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-10">
          {globalReachData.map((item, index) => (
            <Card
              key={index}
              className="flex flex-col items-center border border-white/10 gap-4 bg-white/5 py-4 md:py-8 px-5 md:px-6 rounded-md ring-0 shadow-none"
            >
              <CardContent className="p-0 flex flex-col items-center gap-4">
                <h3 className="text-3xl font-black text-[#6bd672]">
                  {item.count === 247 ? "24/7" : (
                    <>
                      {item.prefix}
                      <Counter end={item.count} />
                      {item.postfix}
                    </>
                  )}
                </h3>
                <p className="text-white/80">{item.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GlobalReach;
