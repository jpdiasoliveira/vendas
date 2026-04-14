import { useState } from 'react';

export function Newsletter() {
    const [email, setEmail] = useState('');

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) return;

        // [MOCK LOCAL]: Salvando no localStorage para simular o banco de dados
        // No futuro, isso será uma chamada para a API: await apiFetch('/api/newsletter/subscribe', 'POST', { email })
        try {
            const existingSubscribers = JSON.parse(localStorage.getItem('@natfoods:newsletter') || '[]');
            
            // Verifica se já está inscrito localmente
            if (!existingSubscribers.includes(email)) {
                existingSubscribers.push(email);
                localStorage.setItem('@natfoods:newsletter', JSON.stringify(existingSubscribers));
                console.log('✅ [LocalDB] E-mail salvo com sucesso:', email);
                console.log('📦 [LocalDB] Total de inscritos:', existingSubscribers.length);
            } else {
                console.log('⚠️ [LocalDB] E-mail já estava inscrito:', email);
            }
            
            alert('Obrigado por se inscrever! (Modo Teste: Salvo Localmente)');
        } catch (error) {
            console.error('Erro ao salvar e-mail localmente', error);
        }

        setEmail('');
    };

    return (
        <section className="py-24 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F3] to-white"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#FFD166]/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-3xl mx-auto text-center relative z-10">
                <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-12 border border-white/50 shadow-2xl">
                    <div className="inline-block bg-gradient-to-r from-[#1B4332]/10 to-[#FFD166]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-[#1B4332]/10">
                        <span className="text-sm font-medium text-[#1B4332] font-inter">Newsletter</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold text-[#1B4332] mb-4 font-playfair">
                        Fique Por Dentro
                    </h3>
                    <p className="text-lg text-[#6D4C41] mb-8 font-inter">
                        Receba novidades, receitas e ofertas exclusivas
                    </p>
                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Seu melhor e-mail"
                            className="flex-1 px-6 py-4 rounded-full border-2 border-white/50 bg-white/50 backdrop-blur-sm focus:border-[#1B4332]/30 focus:bg-white/70 focus:outline-none font-inter transition-all duration-300 shadow-lg"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-[#FFD166] to-[#FFE084] text-[#1B4332] px-10 py-4 rounded-full font-bold hover:shadow-2xl hover:shadow-[#FFD166]/50 transition-all duration-300 hover:scale-105 font-inter whitespace-nowrap"
                        >
                            Inscrever-se
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
