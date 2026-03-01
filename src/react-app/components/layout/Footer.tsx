import { Link } from "react-router";
import { Leaf, Instagram, Facebook, Mail, LayoutDashboard } from "lucide-react";

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer id="contato" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#2D5F4A] to-[#1B4332]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD166]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4 group">
                <div className="relative">
                  <Leaf className="h-12 w-12 text-[#FFD166] group-hover:rotate-12 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-[#FFD166]/30 blur-xl rounded-full" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold font-playfair">Natfoods</h1>
                  <p className="text-sm text-white/70">Chips da Amazônia</p>
                </div>
              </div>
              <p className="text-white/80 mb-6 max-w-md font-inter">
                Banana chips orgânicos premium, direto das plantações da Amazônia para sua mesa.
                Sabor autêntico e sustentável.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110 group"
                >
                  <Instagram className="h-5 w-5 group-hover:text-[#FFD166] transition-colors" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110 group"
                >
                  <Facebook className="h-5 w-5 group-hover:text-[#FFD166] transition-colors" />
                </a>
                <a
                  href="#"
                  className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-110 group"
                >
                  <Mail className="h-5 w-5 group-hover:text-[#FFD166] transition-colors" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-lg mb-4 font-playfair">Links Rápidos</h5>
              <ul className="space-y-2 font-inter">
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTop();
                    }}
                    className="text-white/80 hover:text-[#FFD166] transition-colors duration-300"
                  >
                    Início
                  </a>
                </li>
                <li>
                  <a href="#produtos" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Produtos
                  </a>
                </li>
                <li>
                  <a href="#historia" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Nossa História
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Onde Comprar
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Sustentabilidade
                  </a>
                </li>
                <li>
                  <Link
                    to="/admin/pedidos"
                    className="inline-flex items-center gap-1.5 text-white/80 hover:text-[#FFD166] transition-colors duration-300"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-lg mb-4 font-playfair">Suporte</h5>
              <ul className="space-y-2 font-inter">
                <li>
                  <a href="#" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Envios
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/80 hover:text-[#FFD166] transition-colors duration-300">
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 text-center text-white/60 font-inter">
            <p>&copy; 2024 Natfoods - Chips da Amazônia. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
