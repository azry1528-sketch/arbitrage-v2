import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { headerData } from "./data";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [sticky, setSticky] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY >= 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-40 w-full pb-5 transition-all duration-300 ${
        sticky ? "shadow-lg bg-[#181A20] pt-5" : "shadow-none pt-7"
      }`}
    >
      <div className="lg:py-0 py-2">
        <div className="container mx-auto max-w-[1400px] px-4 flex items-center justify-between">
          <Logo size={34} variant="dark" />

          <nav className="hidden lg:flex grow items-center gap-8 justify-center">
            {headerData.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-white/80 hover:text-[#FCD535] transition-colors text-base font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="lg:flex hidden gap-4 h-10">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="bg-transparent border border-[#FCD535] text-[#FCD535] px-4 py-2 rounded-lg hover:bg-[#FCD535] hover:text-[#181A20] h-full transition-all duration-300"
            >
              Connexion
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="bg-[#FCD535] text-[#181A20] px-4 py-2 rounded-lg hover:bg-transparent hover:text-[#FCD535] h-full transition-all duration-300 font-medium border border-[#FCD535]"
            >
              Inscription
            </Button>
          </div>

          <Sheet open={navbarOpen} onOpenChange={setNavbarOpen}>
            <SheetTrigger asChild>
              <button className="block lg:hidden p-2 rounded-lg text-white" aria-label="Menu">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-[#181A20] border-l border-white/10 p-0">
              <div className="flex items-center justify-between p-4">
                <Logo size={34} variant="dark" onClick={() => setNavbarOpen(false)} />
              </div>
              <nav className="flex flex-col items-start p-4 gap-1">
                {headerData.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    onClick={() => setNavbarOpen(false)}
                    className="text-white/80 hover:text-[#FCD535] py-3 text-base font-medium w-full"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="mt-4 flex flex-col gap-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNavbarOpen(false);
                      navigate("/login");
                    }}
                    className="w-full bg-transparent border border-[#FCD535] text-[#FCD535] rounded-lg hover:bg-[#FCD535] hover:text-[#181A20]"
                  >
                    Connexion
                  </Button>
                  <Button
                    onClick={() => {
                      setNavbarOpen(false);
                      navigate("/register");
                    }}
                    className="w-full bg-[#FCD535] text-[#181A20] rounded-lg hover:bg-transparent hover:text-[#FCD535] border border-[#FCD535] font-medium"
                  >
                    Inscription
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
