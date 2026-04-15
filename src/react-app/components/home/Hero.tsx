import { ChevronRight, Sparkles } from 'lucide-react';

export function Hero({ onShopClick }: { onShopClick: () => void }) {
    return (
        <section className="relative min-h-[100dvh] min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src="https://019bbfb8-9605-7525-9961-da2eb272419f.mochausercontent.com/hero-banana-plantation.png"
                    alt="Plantação de banana orgânica na Amazônia"
                    className="w-full h-full max-w-none object-cover sm:scale-105 scale-100 animate-[zoom_20s_ease-in-out_infinite_alternate]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1B4332]/60 via-[#1B4332]/40 to-[#1B4332]/70"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD166]/10 via-transparent to-[#1B4332]/20"></div>
            </div>
            <div className="relative z-10 text-center px-4 max-w-3xl mx-auto w-full">
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl animate-[float_6s_ease-in-out_infinite]">
                    <div className="inline-flex items-center space-x-2 bg-[#FFD166]/20 backdrop-blur-sm px-3 py-2 rounded-full mb-4 border border-[#FFD166]/30">
                        <Sparkles className="h-4 w-4 text-[#FFD166] shrink-0" />
                        <span className="text-sm text-white font-inter font-medium">Premium Orgânico</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 font-playfair leading-tight drop-shadow-2xl">
                        O Sabor Autêntico da Amazônia em cada Snack
                    </h2>
                    <p className="text-base md:text-lg text-white mb-5 font-inter font-normal drop-shadow-lg leading-relaxed">
                        Banana chips orgânicos premium, cultivados com respeito à natureza
                    </p>
                    <button
                        onClick={onShopClick}
                        className="min-h-[48px] min-w-[min(100%,200px)] justify-center bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-8 py-3.5 rounded-full text-base font-bold hover:shadow-2xl hover:shadow-[#FFD166]/50 transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105 transform font-inter inline-flex items-center space-x-2 group relative overflow-hidden w-full sm:w-auto"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <span className="relative z-10">Compre Agora</span>
                        <ChevronRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                </div>
            </div>

            <div className="absolute top-20 left-10 w-20 h-20 bg-[#FFD166]/20 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#1B4332]/20 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"></div>
        </section>
    );
}
