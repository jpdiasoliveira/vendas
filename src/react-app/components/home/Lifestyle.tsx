import { storefrontShellClass } from "@/react-app/utils/storefrontLayout";

export function Lifestyle() {
    return (
        <section className="relative overflow-hidden py-24">
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F3] via-white to-[#FAF8F3]"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FFD166]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className={`relative z-10 ${storefrontShellClass}`}>
                <div className="text-center mb-16">
                    <div className="inline-block bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full mb-4 border border-[#1B4332]/10">
                        <span className="text-sm font-medium text-[#1B4332] font-inter">Estilo de Vida</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-bold text-[#1B4332] mb-4 font-playfair">
                        Momentos Natfoods
                    </h3>
                    <p className="text-lg text-[#6D4C41] font-inter">
                        Snacks saudáveis para todos os momentos da sua vida
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332]/20 to-[#FFD166]/20 blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100 z-0"></div>
                        <div className="relative">
                            <img
                                src="https://019bbfb8-9605-7525-9961-da2eb272419f.mochausercontent.com/lifestyle-outdoor.png"
                                alt="Pessoas aproveitando ao ar livre"
                                className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/80 via-[#1B4332]/40 to-transparent"></div>
                            <div className="absolute inset-0 flex items-end p-8">
                                <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h4 className="text-2xl font-bold mb-2 text-white font-playfair">Aventuras ao Ar Livre</h4>
                                    <p className="text-white/90 font-inter">O snack perfeito para suas trilhas e caminhadas</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD166]/20 to-[#1B4332]/20 blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100 z-0"></div>
                        <div className="relative">
                            <img
                                src="https://019bbfb8-9605-7525-9961-da2eb272419f.mochausercontent.com/lifestyle-home.png"
                                alt="Família em casa"
                                className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/80 via-[#1B4332]/40 to-transparent"></div>
                            <div className="absolute inset-0 flex items-end p-8">
                                <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h4 className="text-2xl font-bold mb-2 text-white font-playfair">Momentos em Família</h4>
                                    <p className="text-white/90 font-inter">Snacks saudáveis para compartilhar com quem você ama</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
