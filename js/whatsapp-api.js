// WhatsApp Business API Oficial - Meta
class WhatsAppBusinessAPI {
    constructor() {
        this.baseURL = 'https://graph.facebook.com/v18.0';
        this.phoneNumberId = localStorage.getItem('wa_phone_number_id') || '';
        this.accessToken = localStorage.getItem('wa_access_token') || '';
        this.businessId = localStorage.getItem('wa_business_id') || '';
        this.connected = false;
        this.webhookVerifyToken = 'seu_token_de_verificacao';
    }

    // Configurar credenciais
    setCredentials(phoneNumberId, accessToken, businessId) {
        this.phoneNumberId = phoneNumberId;
        this.accessToken = accessToken;
        this.businessId = businessId;
        
        localStorage.setItem('wa_phone_number_id', phoneNumberId);
        localStorage.setItem('wa_access_token', accessToken);
        localStorage.setItem('wa_business_id', businessId);
    }

    // Verificar conexão
    async checkConnection() {
        if (!this.phoneNumberId || !this.accessToken) {
            return { connected: false, error: 'Credenciais não configuradas' };
        }

        try {
            const response = await fetch(
                `${this.baseURL}/${this.phoneNumberId}?access_token=${this.accessToken}`
            );
            const data = await response.json();
            
            this.connected = response.ok;
            return {
                connected: response.ok,
                data: data,
                phoneNumber: data.display_phone_number || 'N/A'
            };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    // Enviar mensagem de texto
    async sendTextMessage(to, message) {
        if (!this.connected) {
            throw new Error('WhatsApp não está conectado');
        }

        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: message
                    }
                })
            }
        );

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Erro ao enviar mensagem');
        }

        return {
            success: true,
            messageId: data.messages?.[0]?.id,
            timestamp: new Date().toISOString()
        };
    }

    // Enviar template
    async sendTemplate(to, templateName, language = 'pt_BR', components = []) {
        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: language },
                        components: components
                    }
                })
            }
        );

        return await response.json();
    }

    // Enviar imagem
    async sendImage(to, imageUrl, caption = '') {
        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'image',
                    image: {
                        link: imageUrl,
                        caption: caption
                    }
                })
            }
        );

        return await response.json();
    }

    // Enviar documento
    async sendDocument(to, documentUrl, filename, caption = '') {
        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'document',
                    document: {
                        link: documentUrl,
                        filename: filename,
                        caption: caption
                    }
                })
            }
        );

        return await response.json();
    }

    // Enviar botões interativos
    async sendInteractiveButtons(to, headerText, bodyText, buttons) {
        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        header: {
                            type: 'text',
                            text: headerText
                        },
                        body: {
                            text: bodyText
                        },
                        action: {
                            buttons: buttons.map(btn => ({
                                type: 'reply',
                                reply: {
                                    id: btn.id,
                                    title: btn.title
                                }
                            }))
                        }
                    }
                })
            }
        );

        return await response.json();
    }

    // Enviar lista de opções
    async sendList(to, headerText, bodyText, buttonText, sections) {
        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'interactive',
                    interactive: {
                        type: 'list',
                        header: {
                            type: 'text',
                            text: headerText
                        },
                        body: {
                            text: bodyText
                        },
                        action: {
                            button: buttonText,
                            sections: sections
                        }
                    }
                })
            }
        );

        return await response.json();
    }

    // Marcar mensagem como lida
    async markAsRead(messageId) {
        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId
                })
            }
        );

        return await response.json();
    }

    // Obter templates
    async getTemplates() {
        const response = await fetch(
            `${this.baseURL}/${this.businessId}/message_templates?access_token=${this.accessToken}`
        );

        return await response.json();
    }

    // Criar template
    async createTemplate(name, category, language, components) {
        const response = await fetch(
            `${this.baseURL}/${this.businessId}/message_templates`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    category: category,
                    language: language,
                    components: components
                })
            }
        );

        return await response.json();
    }

    // Upload de mídia
    async uploadMedia(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('messaging_product', 'whatsapp');

        const response = await fetch(
            `${this.baseURL}/${this.phoneNumberId}/media`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: formData
            }
        );

        return await response.json();
    }

    // Webhook - Verificar assinatura
    verifyWebhook(mode, token, challenge) {
        if (mode === 'subscribe' && token === this.webhookVerifyToken) {
            return { verified: true, challenge: challenge };
        }
        return { verified: false };
    }

    // Webhook - Processar mensagem recebida
    processWebhook(body) {
        try {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            
            if (value?.messages) {
                const message = value.messages[0];
                const contact = value.contacts?.[0];
                
                return {
                    type: 'message',
                    from: message.from,
                    name: contact?.profile?.name,
                    messageId: message.id,
                    timestamp: message.timestamp,
                    messageType: message.type,
                    content: message.text?.body || message.image || message.document || null
                };
            }
            
            if (value?.statuses) {
                const status = value.statuses[0];
                return {
                    type: 'status',
                    messageId: status.id,
                    status: status.status,
                    timestamp: status.timestamp
                };
            }
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            return null;
        }
    }

    // Configurar webhook
    async setWebhook(url) {
        // Isso deve ser feito pelo servidor backend
        console.log('Configure o webhook no Meta Developers:', url);
        return {
            callback_url: url,
            verify_token: this.webhookVerifyToken
        };
    }
}

// Instância global
const waAPI = new WhatsAppBusinessAPI();
