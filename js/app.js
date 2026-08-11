// ==========================================
// SISTEMA BOTBOT - TODAS AS FUNÇÕES
// ==========================================

// Dados do sistema
const APP_DATA = {
    user: {
        name: 'Admin',
        email: 'admin@botbot.local',
        plan: 'Profissional'
    },
    whatsapp: {
        connected: false,
        devices: [],
        messages: []
    },
    telegram: {
        connected: false,
        devices: []
    },
    email: {
        sent: 0,
        templates: []
    },
    sms: {
        sent: 0
    },
    contacts: [
        { name: 'João Silva', phone: '+5511999999999', email: 'joao@email.com' },
        { name: 'Maria Santos', phone: '+5511888888888', email: 'maria@email.com' },
        { name: 'Pedro Costa', phone: '+5511777777777', email: 'pedro@email.com' }
    ],
    chatbots: [
        { name: 'Atendimento', status: 'Ativo', messages: 1234 },
        { name: 'Vendas', status: 'Ativo', messages: 856 }
    ],
    templates: [
        { name: 'Boas Vindas', category: 'Saudação', status: 'Aprovado' },
        { name: 'Promoção', category: 'Marketing', status: 'Aprovado' }
    ],
    campaigns: [
        { name: 'Black Friday', status: 'Ativa', sent: 5000 },
        { name: 'Boas Vindas', status: 'Ativa', sent: 1200 }
    ],
    apiKeys: {
        appKey: '',
        authKey: '',
        apiKey: ''
    }
};

// ==========================================
// NAVEGAÇÃO
// ==========================================
function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    
    // Mostrar seção selecionada
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Atualizar item ativo no menu
    document.querySelectorAll('.nav-item').forEach(el => {
        el.style.background = '';
        el.style.color = '#ccc';
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.style.background = '#0f3460';
        activeLink.style.color = 'white';
    }
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ==========================================
// WHATSAPP
// ==========================================
function conectarWhatsApp() {
    const numero = prompt('Digite o número do WhatsApp (com código do país):\nEx: 5511999999999');
    
    if (!numero) return;
    
    showToast('🔄 Conectando WhatsApp...', 'info');
    
    setTimeout(() => {
        APP_DATA.whatsapp.connected = true;
        APP_DATA.whatsapp.devices.push({
            id: Date.now(),
            numero: numero,
            status: 'Conectado',
            conectadoEm: new Date().toLocaleString()
        });
        
        atualizarDispositivosWhatsApp();
        showToast('✅ WhatsApp conectado com sucesso!', 'success');
    }, 2000);
}

function atualizarDispositivosWhatsApp() {
    const container = document.getElementById('whatsappDevices');
    if (!container) return;
    
    if (APP_DATA.whatsapp.devices.length === 0) {
        container.innerHTML = '<p style="color:#999; padding:20px;">Nenhum dispositivo conectado</p>';
        return;
    }
    
    container.innerHTML = APP_DATA.whatsapp.devices.map(device => `
        <div class="card">
            <h3>📱 Dispositivo</h3>
            <p><strong>Número:</strong> +${device.numero}</p>
            <p><strong>Status:</strong> 🟢 ${device.status}</p>
            <p><strong>Conectado em:</strong> ${device.conectadoEm}</p>
            <button class="btn btn-danger" onclick="desconectarWhatsApp(${device.id})">Desconectar</button>
        </div>
    `).join('');
}

function desconectarWhatsApp(id) {
    APP_DATA.whatsapp.devices = APP_DATA.whatsapp.devices.filter(d => d.id !== id);
    if (APP_DATA.whatsapp.devices.length === 0) {
        APP_DATA.whatsapp.connected = false;
    }
    atualizarDispositivosWhatsApp();
    showToast('WhatsApp desconectado', 'error');
}

// ==========================================
// CHATBOTS
// ==========================================
function criarChatbot() {
    const nome = prompt('Nome do chatbot:');
    if (!nome) return;
    
    APP_DATA.chatbots.push({
        name: nome,
        status: 'Ativo',
        messages: 0
    });
    
    atualizarChatbots();
    showToast(`✅ Chatbot "${nome}" criado!`, 'success');
}

function atualizarChatbots() {
    const container = document.getElementById('listaChatbots');
    if (!container) return;
    
    container.innerHTML = APP_DATA.chatbots.map(bot => `
        <div class="card">
            <h3>🤖 ${bot.name}</h3>
            <p>Status: 🟢 ${bot.status}</p>
            <p>Mensagens: ${bot.messages}</p>
            <button class="btn btn-primary" onclick="showToast('Editando ${bot.name}')">Editar</button>
            <button class="btn btn-danger" onclick="deletarChatbot('${bot.name}')">Excluir</button>
        </div>
    `).join('');
}

function deletarChatbot(nome) {
    APP_DATA.chatbots = APP_DATA.chatbots.filter(b => b.name !== nome);
    atualizarChatbots();
    showToast(`Chatbot "${nome}" removido`, 'error');
}

function testarChatbot() {
    const input = document.getElementById('chatbotInput');
    const messages = document.getElementById('chatbotMessages');
    
    if (!input || !messages) return;
    
    const msg = input.value.trim();
    if (!msg) return;
    
    // Mensagem do usuário
    messages.innerHTML += `
        <div style="text-align:right; margin:10px;">
            <span style="background:#DCF8C6; padding:10px 15px; border-radius:15px; display:inline-block;">
                ${msg}
            </span>
        </div>
    `;
    
    input.value = '';
    
    // Resposta do bot
    setTimeout(() => {
        const respostas = [
            'Olá! Como posso ajudar? 😊',
            'Entendi! Me conte mais.',
            'Estou aqui para ajudar!',
            'Ótima pergunta! Vou verificar.',
            'Interessante! Continue.',
            'Compreendo. O que mais?'
        ];
        const resposta = respostas[Math.floor(Math.random() * respostas.length)];
        
        messages.innerHTML += `
            <div style="text-align:left; margin:10px;">
                <span style="background:white; padding:10px 15px; border-radius:15px; display:inline-block; border:1px solid #e0e0e0;">
                    ${resposta}
                </span>
            </div>
        `;
        
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
    
    messages.scrollTop = messages.scrollHeight;
}

// ==========================================
// TEMPLATES
// ==========================================
function criarTemplate() {
    const nome = prompt('Nome do template:');
    if (!nome) return;
    
    APP_DATA.templates.push({
        name: nome,
        category: 'Personalizado',
        status: 'Pendente'
    });
    
    atualizarTemplates();
    showToast(`✅ Template "${nome}" criado!`, 'success');
}

function atualizarTemplates() {
    const container = document.getElementById('listaTemplates');
    if (!container) return;
    
    container.innerHTML = APP_DATA.templates.map(t => `
        <div class="card">
            <h3>📋 ${t.name}</h3>
            <p>Categoria: ${t.category}</p>
            <p>Status: ${t.status === 'Aprovado' ? '🟢' : '🟡'} ${t.status}</p>
        </div>
    `).join('');
}

// ==========================================
// SMS
// ==========================================
function enviarSMS() {
    const numero = document.getElementById('smsNumber')?.value;
    const mensagem = document.getElementById('smsMessage')?.value;
    const resultDiv = document.getElementById('smsResult');
    
    if (!numero || !mensagem) {
        showToast('Preencha número e mensagem!', 'error');
        return;
    }
    
    if (mensagem.length > 160) {
        showToast('SMS deve ter no máximo 160 caracteres!', 'error');
        return;
    }
    
    APP_DATA.sms.sent++;
    
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="card" style="background:#d4edda; margin-top:15px;">
                <h4>✅ SMS Enviado!</h4>
                <p>Para: ${numero}</p>
                <p>Mensagem: ${mensagem}</p>
                <p>Total enviado hoje: ${APP_DATA.sms.sent}</p>
            </div>
        `;
    }
    
    showToast('📱 SMS enviado com sucesso!', 'success');
}

// ==========================================
// CAMPANHAS
// ==========================================
function criarCampanha() {
    const nome = prompt('Nome da campanha:');
    if (!nome) return;
    
    APP_DATA.campaigns.push({
        name: nome,
        status: 'Ativa',
        sent: 0
    });
    
    atualizarCampanhas();
    showToast(`✅ Campanha "${nome}" criada!`, 'success');
}

function atualizarCampanhas() {
    const container = document.getElementById('listaCampanhas');
    if (!container) return;
    
    container.innerHTML = APP_DATA.campaigns.map(c => `
        <div class="card">
            <h3>📢 ${c.name}</h3>
            <p>Status: 🟢 ${c.status}</p>
            <p>Enviadas: ${c.sent}</p>
        </div>
    `).join('');
}

// ==========================================
// MENSAGENS PROGRAMADAS
// ==========================================
function programarMensagem() {
    const data = document.getElementById('dataProgramada')?.value;
    const msg = document.getElementById('msgProgramada')?.value;
    
    if (!data || !msg) {
        showToast('Preencha data e mensagem!', 'error');
        return;
    }
    
    showToast(`✅ Mensagem programada para ${new Date(data).toLocaleString()}`, 'success');
}

// ==========================================
// MENSAGEM EM MASSA
// ==========================================
function enviarMassa() {
    const msg = document.getElementById('msgMassa')?.value;
    
    if (!msg) {
        showToast('Digite a mensagem!', 'error');
        return;
    }
    
    const total = APP_DATA.contacts.length;
    showToast(`📨 Enviando mensagem para ${total} contatos...`, 'info');
    
    setTimeout(() => {
        showToast(`✅ Mensagem enviada para ${total} contatos!`, 'success');
    }, 3000);
}

// ==========================================
// CONTATOS
// ==========================================
function atualizarContatos() {
    const tabela = document.getElementById('tabelaContatos');
    if (!tabela) return;
    
    tabela.innerHTML = `
        <tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Ações</th></tr>
        ${APP_DATA.contacts.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.email}</td>
                <td>
                    <button class="btn btn-primary" style="padding:5px 10px; font-size:12px;">Editar</button>
                </td>
            </tr>
        `).join('')}
    `;
}

// ==========================================
// CHAVES API
// ==========================================
function gerarAppKey() {
    const key = 'AK_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    APP_DATA.apiKeys.appKey = key;
    atualizarChavesAPI();
    showToast('✅ App Key gerada!', 'success');
}

function gerarAuthKey() {
    const key = 'AUTH_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 16).toUpperCase();
    APP_DATA.apiKeys.authKey = key;
    atualizarChavesAPI();
    showToast('✅ Auth Key gerada!', 'success');
}

function gerarAPIKey() {
    const key = 'API_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 24).toUpperCase();
    APP_DATA.apiKeys.apiKey = key;
    atualizarChavesAPI();
    showToast('✅ Chave API gerada!', 'success');
}

function gerarTodasChaves() {
    gerarAppKey();
    gerarAuthKey();
    gerarAPIKey();
}

function atualizarChavesAPI() {
    const container = document.getElementById('apiKeysDisplay');
    const appKeyEl = document.getElementById('appKeyDisplay');
    const authKeyEl = document.getElementById('authKeyDisplay');
    const apiKeyEl = document.getElementById('apiKeyDisplay');
    
    if (appKeyEl) appKeyEl.textContent = APP_DATA.apiKeys.appKey || '-';
    if (authKeyEl) authKeyEl.textContent = APP_DATA.apiKeys.authKey || '-';
    if (apiKeyEl) apiKeyEl.textContent = APP_DATA.apiKeys.apiKey || '-';
    
    if (container) {
        container.innerHTML = `
            ${APP_DATA.apiKeys.appKey ? `<div class="api-key-box">📱 App Key: ${APP_DATA.apiKeys.appKey}</div>` : ''}
            ${APP_DATA.apiKeys.authKey ? `<div class="api-key-box">🔐 Auth Key: ${APP_DATA.apiKeys.authKey}</div>` : ''}
            ${APP_DATA.apiKeys.apiKey ? `<div class="api-key-box">🔌 API Key: ${APP_DATA.apiKeys.apiKey}</div>` : ''}
            ${!APP_DATA.apiKeys.appKey && !APP_DATA.apiKeys.authKey && !APP_DATA.apiKeys.apiKey ? 
                '<p style="color:#999;">Nenhuma chave gerada</p>' : ''}
        `;
    }
}

// ==========================================
// MENSAGENS
// ==========================================
function enviarMsg() {
    const numero = document.getElementById('msgNumber')?.value;
    const texto = document.getElementById('msgTexto')?.value;
    
    if (!numero || !texto) {
        showToast('Preencha todos os campos!', 'error');
        return;
    }
    
    showToast('✅ Mensagem enviada!', 'success');
}

// ==========================================
// LOGOUT
// ==========================================
function logout() {
    if (confirm('Deseja realmente sair?')) {
        showToast('Saindo...', 'info');
        setTimeout(() => {
            alert('Logout realizado com sucesso!');
            location.reload();
        }, 1000);
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 BotBot System iniciado!');
    console.log('👤 Usuário:', APP_DATA.user.email);
    console.log('📱 WhatsApp:', APP_DATA.whatsapp.connected ? 'Conectado' : 'Desconectado');
    console.log('✈️ Telegram:', APP_DATA.telegram.connected ? 'Conectado' : 'Desconectado');
    
    // Inicializar componentes
    atualizarDispositivosWhatsApp();
    atualizarChatbots();
    atualizarTemplates();
    atualizarCampanhas();
    atualizarContatos();
    atualizarChavesAPI();
    
    // Event listener para Enter no chatbot
    document.getElementById('chatbotInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') testarChatbot();
    });
    
    showToast('✅ Sistema pronto!', 'success');
});
