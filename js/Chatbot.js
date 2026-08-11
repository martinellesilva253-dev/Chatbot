// Sistema de Chatbot
class Chatbot {
    constructor() {
        this.responses = {
            'olá': 'Olá! Como posso ajudar você hoje?',
            'oi': 'Oi! Em que posso ser útil?',
            'preço': 'Nossos planos começam a partir de R$ 29,90/mês.',
            'suporte': 'Nossa equipe de suporte está disponível 24/7.',
            'ajuda': 'Claro! Qual seria sua dúvida específica?',
            'obrigado': 'De nada! Estou sempre aqui para ajudar.',
            'tchau': 'Até logo! Tenha um ótimo dia!'
        };
        
        this.conversationHistory = [];
    }

    // Processar mensagem
    processMessage(message) {
        const lowerMessage = message.toLowerCase().trim();
        let response = this.responses[lowerMessage];
        
        if (!response) {
            // Resposta inteligente
            response = this.generateSmartResponse(lowerMessage);
        }
        
        this.conversationHistory.push({
            user: message,
            bot: response,
            timestamp: new Date()
        });
        
        return response;
    }

    // Gerar resposta inteligente
    generateSmartResponse(message) {
        if (message.includes('como')) {
            return 'Interessante! Pode me dar mais detalhes sobre isso?';
        } else if (message.includes('quando')) {
            return 'Vou verificar essa informação para você.';
        } else if (message.includes('onde')) {
            return 'Posso te ajudar a encontrar essa informação.';
        } else {
            const genericResponses = [
                'Entendi! Pode me contar mais?',
                'Interessante! Como posso ajudar com isso?',
                'Estou aqui para ajudar!',
                'Vamos resolver isso juntos!'
            ];
            return genericResponses[Math.floor(Math.random() * genericResponses.length)];
        }
    }

    // Adicionar resposta personalizada
    addCustomResponse(keyword, response) {
        this.responses[keyword.toLowerCase()] = response;
        localStorage.setItem('customResponses', JSON.stringify(this.responses));
    }

    // Carregar respostas personalizadas
    loadCustomResponses() {
        const saved = localStorage.getItem('customResponses');
        if (saved) {
            this.responses = JSON.parse(saved);
        }
    }
}

const chatbot = new Chatbot();
chatbot.loadCustomResponses();
