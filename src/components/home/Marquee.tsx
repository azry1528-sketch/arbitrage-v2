import { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  duration?: number;
  className?: string;
}

// Bande de défilement infini en pur CSS (remplace les dépendances slider externes)
const Marquee = ({ children, duration = 30, className = "" }: MarqueeProps) => {
  return (
    <div className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}>
      <div
        className="flex w-max items-center gap-10 animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="flex items-center gap-10">{children}</div>
        <div className="flex items-center gap-10" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
