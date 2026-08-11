// Configuração do WhatsApp Business
class WhatsAppConfig {
    constructor() {
        this.config = {
            phoneNumberId: '',
            accessToken: '',
            businessId: '',
            webhookUrl: '',
            verifyToken: 'meu_token_secreto_2024'
        };
        
        this.loadConfig();
    }

    // Carregar configuração salva
    loadConfig() {
        const saved = localStorage.getItem('whatsapp_config');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }

    // Salvar configuração
    saveConfig() {
        localStorage.setItem('whatsapp_config', JSON.stringify(this.config));
        waAPI.setCredentials(
            this.config.phoneNumberId,
            this.config.accessToken,
            this.config.businessId
        );
    }

    // Configurar credenciais
    setupCredentials(phoneNumberId, accessToken, businessId) {
        this.config.phoneNumberId = phoneNumberId;
        this.config.accessToken = accessToken;
        this.config.businessId = businessId;
        this.saveConfig();
        
        return {
            success: true,
            message: 'Credenciais configuradas com sucesso!'
        };
    }

    // Obter instruções de configuração
    getSetupInstructions() {
        return {
            steps: [
                {
                    title: '1. Criar App no Meta Developers',
                    description: 'Acesse developers.facebook.com e crie um novo aplicativo',
                    link: 'https://developers.facebook.com/apps'
                },
                {
                    title: '2. Configurar WhatsApp',
                    description: 'Adicione o produto WhatsApp ao seu aplicativo',
                    details: 'Vá em "Adicionar Produto" > "WhatsApp"'
                },
                {
                    title: '3. Obter Token de Acesso',
                    description: 'Gere um token de acesso permanente',
                    details: 'Configure um token de sistema no painel de administração'
                },
                {
                    title: '4. Configurar Webhook',
                    description: 'Configure a URL do webhook para receber mensagens',
                    webhookUrl: this.config.webhookUrl || 'https://seu-dominio.com/webhook'
                },
                {
                    title: '5. Verificar Número',
                    description: 'Adicione e verifique seu número de telefone'
                }
            ],
            requiredFields: [
                { name: 'phoneNumberId', label: 'Phone Number ID', placeholder: '123456789012345' },
                { name: 'accessToken', label: 'Access Token', placeholder: 'EAA...' },
                { name: 'businessId', label: 'Business ID', placeholder: '123456789012345' }
            ]
        };
    }
}

const waConfig = new WhatsAppConfig();
