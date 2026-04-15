import { Leaf, Shield, MapPin } from "lucide-react";
import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";

export function Benefits() {
    return (
        <section className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#2D5F4A] to-[#1B4332]"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-[#FFD166]/20 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#FFD166]/20 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"></div>
            </div>

            <div className={`relative z-10 ${storefrontShellClass}`}>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center space-y-4 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#FFD166] rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                            <div className="relative bg-gradient-to-br from-[#FFD166] to-[#FFE084] rounded-full p-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                <Leaf className="h-12 w-12 text-[#1B4332]" />
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                            <h4 className="text-xl font-bold text-white mb-2 font-playfair">100% Orgânico</h4>
                            <p className="text-white/90 font-inter">Certificação orgânica em todas as etapas da produção</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#FFD166] rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                            <div className="relative bg-gradient-to-br from-[#FFD166] to-[#FFE084] rounded-full p-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                <Shield className="h-12 w-12 text-[#1B4332]" />
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                            <h4 className="text-xl font-bold text-white mb-2 font-playfair">Sem Conservantes</h4>
                            <p className="text-white/90 font-inter">Apenas ingredientes naturais, nada artificial</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#FFD166] rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                            <div className="relative bg-gradient-to-br from-[#FFD166] to-[#FFE084] rounded-full p-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                <MapPin className="h-12 w-12 text-[#1B4332]" />
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                            <h4 className="text-xl font-bold text-white mb-2 font-playfair">Direto da Amazônia</h4>
                            <p className="text-white/90 font-inter">Colhido e processado nas plantações certificadas</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
