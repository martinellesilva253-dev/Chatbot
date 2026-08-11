class Chatbot {
    constructor() {
        this.responses = {
            'olá': 'Olá! Como posso ajudar você hoje? 😊',
            'oi': 'Oi! Em que posso ser útil?',
            'bom dia': 'Bom dia! Como posso ajudar?',
            'boa tarde': 'Boa tarde! Em que posso ser útil?',
            'boa noite': 'Boa noite! Como posso ajudar?',
            'preço': 'Nossos planos começam a partir de R$ 29,90/mês. Quer saber mais?',
            'valor': 'Temos planos a partir de R$ 29,90/mês. Posso te enviar os detalhes?',
            'suporte': 'Nossa equipe de suporte está disponível 24/7. Qual seria sua dúvida?',
            'ajuda': 'Claro! Qual seria sua dúvida específica?',
            'obrigado': 'De nada! Estou sempre aqui para ajudar. 😊',
            'obrigada': 'De nada! Estou sempre aqui para ajudar. 😊',
            'tchau': 'Até logo! Tenha um ótimo dia! 👋',
            'sim': 'Ótimo! Como posso prosseguir?',
            'não': 'Tudo bem! Se precisar, estou aqui.',
            'planos': 'Temos 3 planos: Básico (R$29,90), Pro (R$79,90) e Enterprise (R$199,90). Qual te interessa?',
            'contato': 'Você pode nos contatar pelo email: suporte@chatbot.com ou WhatsApp: (11) 99999-9999',
            'horário': 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.',
            'endereço': 'Estamos localizados na Av. Paulista, 1000 - São Paulo/SP',
            'pagamento': 'Aceitamos PIX, cartão de crédito e boleto bancário.',
            'cancelar': 'Para cancelar, entre em contato com nosso suporte. Lamento ver você partindo! 😢'
        };
    }

    processMessage(message) {
        const lowerMessage = message.toLowerCase().trim();
        
        // Verificar resposta exata
        if (this.responses[lowerMessage]) {
            return this.responses[lowerMessage];
        }
        
        // Verificar se contém palavras-chave
        for (const [key, response] of Object.entries(this.responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        // Resposta inteligente
        return this.generateSmartResponse(lowerMessage);
    }

    generateSmartResponse(message) {
        if (message.includes('como')) {
            return 'Interessante! Pode me dar mais detalhes sobre isso?';
        } else if (message.includes('quando')) {
            return 'Vou verificar essa informação para você. Um momento!';
        } else if (message.includes('onde')) {
            return 'Posso te ajudar a encontrar essa informação.';
        } else if (message.includes('quem')) {
            return 'Somos uma empresa de tecnologia especializada em chatbots!';
        } else if (message.includes('por que') || message.includes('porque')) {
            return 'Excelente pergunta! Deixe-me explicar melhor...';
        } else if (message.length < 5) {
            return 'Pode me dar mais detalhes? Assim consigo ajudar melhor.';
        } else {
            const genericResponses = [
                'Entendi! Pode me contar mais? 🤔',
                'Interessante! Como posso ajudar com isso?',
                'Estou aqui para ajudar! O que você precisa?',
                'Vamos resolver isso juntos! Me diga mais.',
                'Compreendo. Qual seria o próximo passo?',
                'Estou analisando sua mensagem. Continue!'
            ];
            return genericResponses[Math.floor(Math.random() * genericResponses.length)];
        }
    }
}

const chatbot = new Chatbot();
