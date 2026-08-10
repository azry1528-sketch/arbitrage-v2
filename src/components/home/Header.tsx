import { useEffect, useState } from "react";
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
        sticky ? "shadow-lg bg-[#04070d] pt-5" : "shadow-none pt-7"
      }`}
    >
      <div className="lg:py-0 py-2">
        <div className="container mx-auto max-w-[1400px] px-4 flex items-center justify-between">
          <Link to="/" className="cursor-pointer flex items-center gap-2">
            <img src="/images/logo/logo.svg" alt="logo" className="h-8 w-auto" />
            <span className="text-white font-semibold text-lg">ArbiFlow</span>
          </Link>

          <nav className="hidden lg:flex grow items-center gap-8 justify-center">
            {headerData.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-white/80 hover:text-[#6bd672] transition-colors text-base font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="lg:flex hidden gap-4 h-10">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="bg-transparent border border-[#6bd672] text-[#6bd672] px-4 py-2 rounded-lg hover:bg-[#6bd672] hover:text-black h-full transition-all duration-300"
            >
              Connexion
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="bg-[#6bd672] text-black px-4 py-2 rounded-lg hover:bg-transparent hover:text-[#6bd672] h-full transition-all duration-300 font-medium border border-[#6bd672]"
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
            <SheetContent side="right" className="w-full max-w-xs bg-[#04070d] border-l border-white/10 p-0">
              <div className="flex items-center justify-between p-4">
                <Link to="/" onClick={() => setNavbarOpen(false)}>
                  <img src="/images/logo/logo.svg" alt="logo" className="h-8 w-auto" />
                </Link>
              </div>
              <nav className="flex flex-col items-start p-4 gap-1">
                {headerData.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    onClick={() => setNavbarOpen(false)}
                    className="text-white/80 hover:text-[#6bd672] py-3 text-base font-medium w-full"
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
                    className="w-full bg-transparent border border-[#6bd672] text-[#6bd672] rounded-lg hover:bg-[#6bd672] hover:text-black"
                  >
                    Connexion
                  </Button>
                  <Button
                    onClick={() => {
                      setNavbarOpen(false);
                      navigate("/register");
                    }}
                    className="w-full bg-[#6bd672] text-black rounded-lg hover:bg-transparent hover:text-[#6bd672] border border-[#6bd672] font-medium"
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
