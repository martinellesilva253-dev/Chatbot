// ==========================================
// BOTBOT - SISTEMA COMPLETO COM BACKEND REAL
// ==========================================

// Configuração
const API_URL = window.location.hostname === 'localhost' ? 
    'http://localhost:3000' : 
    'https://seu-backend.com';

let socket = null;
let backendDisponivel = false;

// Dados do sistema
const APP_DATA = {
    whatsapp: {
        connected: false,
        pairingCode: null,
        phoneNumber: null,
        sessionId: null,
        devices: [],
        connectionMethod: 'simulation' // 'simulation' ou 'backend'
    },
    apiKeys: { appKey: '', authKey: '', apiKey: '' },
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
    smsSent: 0,
    messagesSent: 0,
    contacts: [
        { name: 'João Silva', phone: '+5511999999999', email: 'joao@email.com' },
        { name: 'Maria Santos', phone: '+5511888888888', email: 'maria@email.com' },
        { name: 'Pedro Costa', phone: '+5511777777777', email: 'pedro@email.com' }
    ]
};

// ==========================================
// NAVEGAÇÃO
// ==========================================
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Atualizar menu ativo
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
// TOAST
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
// CONEXÃO COM BACKEND (TEMPO REAL)
// ==========================================
function conectarBackend() {
    try {
        // Tentar carregar Socket.IO
        const script = document.createElement('script');
        script.src = `${API_URL}/socket.io/socket.io.js`;
        script.onload = () => {
            socket = io(API_URL, {
                transports: ['websocket', 'polling']
            });
            
            socket.on('connect', () => {
                console.log('🟢 Conectado ao servidor backend');
                backendDisponivel = true;
                showToast('🟢 Servidor conectado!', 'success');
            });
            
            socket.on('whatsapp_qr', (qr) => {
                mostrarQRCodeReal(qr);
            });
            
            socket.on('whatsapp_connected', (data) => {
                APP_DATA.whatsapp.connected = true;
                APP_DATA.whatsapp.phoneNumber = data.number;
                APP_DATA.whatsapp.connectionMethod = 'backend';
                APP_DATA.whatsapp.sessionId = 'WA_BACKEND_' + Date.now().toString(36);
                
                whatsAppConectadoUI(data.number);
                showToast('✅ WhatsApp conectado via backend!', 'success');
            });
            
            socket.on('whatsapp_disconnected', () => {
                APP_DATA.whatsapp.connected = false;
                APP_DATA.whatsapp.connectionMethod = 'simulation';
                atualizarDashboard();
                showToast('❌ WhatsApp desconectado', 'error');
            });
            
            socket.on('whatsapp_message', (data) => {
                console.log('📩 Mensagem recebida:', data);
                APP_DATA.messagesSent++;
                atualizarDashboard();
                showToast(`📩 Nova mensagem de ${data.from}`, 'info');
            });
            
            socket.on('whatsapp_sent', (data) => {
                console.log('📤 Mensagem enviada:', data);
            });
            
            socket.on('connect_error', () => {
                console.log('⚠️ Backend não disponível, usando simulação');
                backendDisponivel = false;
            });
        };
        
        script.onerror = () => {
            console.log('⚠️ Backend não disponível, usando simulação');
            backendDisponivel = false;
        };
        
        document.head.appendChild(script);
        
    } catch (error) {
        console.log('⚠️ Modo simulação ativado');
        backendDisponivel = false;
    }
}

// ==========================================
// WHATSAPP - CONEXÃO VIA CÓDIGO (SIMULAÇÃO)
// ==========================================
async function conectarWhatsAppViaNumero() {
    const phoneNumber = document.getElementById('whatsappNumber')?.value.replace(/\D/g, '');
    
    if (!phoneNumber || phoneNumber.length < 10) {
        showToast('❌ Digite um número válido com DDD!', 'error');
        return;
    }
    
    // Se backend disponível, tenta conectar via ele
    if (backendDisponivel && socket?.connected) {
        await conectarViaBackend(phoneNumber);
        return;
    }
    
    // Modo simulação
    await conectarViaSimulacao(phoneNumber);
}

// Conexão via Backend Real
async function conectarViaBackend(phoneNumber) {
    const connectionArea = document.getElementById('whatsappConnectionArea');
    connectionArea.innerHTML = `
        <div class="pairing-container">
            <h3>📱 Conectando ao WhatsApp...</h3>
            <p>Número: <strong>+${phoneNumber}</strong></p>
            <p style="color:#FF9800;">🔄 Aguardando QR Code do servidor...</p>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/api/pairing-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarCodigoEmparelhamento(data.code, phoneNumber);
        }
    } catch (error) {
        console.log('Erro backend, usando simulação');
        await conectarViaSimulacao(phoneNumber);
    }
}

// Conexão via Simulação
async function conectarViaSimulacao(phoneNumber) {
    const connectionArea = document.getElementById('whatsappConnectionArea');
    
    connectionArea.innerHTML = `
        <div class="pairing-container">
            <h3>📱 Conectando via Número</h3>
            <p>Número: <strong>+${phoneNumber}</strong></p>
            
            <div id="pairingCodeDisplay" class="pairing-code-box">
                <p style="color:white;">🔄 Gerando código...</p>
                <div class="loading-spinner"></div>
            </div>
            
            <div class="pairing-instructions">
                <h4>📋 Como conectar:</h4>
                <div class="instruction-step">
                    <span class="step-num">1</span>
                    <p>Abra o <strong>WhatsApp</strong> no celular</p>
                </div>
                <div class="instruction-step">
                    <span class="step-num">2</span>
                    <p>Vá em <strong>Aparelhos Conectados</strong></p>
                </div>
                <div class="instruction-step">
                    <span class="step-num">3</span>
                    <p>Toque em <strong>Conectar um aparelho</strong></p>
                </div>
                <div class="instruction-step">
                    <span class="step-num">4</span>
                    <p><strong>Digite o código</strong> gerado abaixo</p>
                </div>
            </div>
            
            <button class="btn btn-danger" onclick="cancelarConexao()" style="margin-top:15px;">
                ❌ Cancelar
            </button>
        </div>
    `;
    
    showToast('🔄 Gerando código de emparelhamento...', 'info');
    
    setTimeout(() => {
        const parte1 = Math.floor(1000 + Math.random() * 9000);
        const parte2 = Math.floor(1000 + Math.random() * 9000);
        const pairingCode = `${parte1}-${parte2}`;
        
        APP_DATA.whatsapp.pairingCode = pairingCode;
        APP_DATA.whatsapp.phoneNumber = phoneNumber;
        APP_DATA.whatsapp.connectionMethod = 'simulation';
        
        mostrarCodigoEmparelhamento(pairingCode, phoneNumber);
        
        // Simular conexão após alguns segundos
        setTimeout(() => {
            whatsAppConectadoUI(phoneNumber);
        }, 6000);
        
    }, 2000);
}

// Mostrar código de emparelhamento
function mostrarCodigoEmparelhamento(codigo, phoneNumber) {
    document.getElementById('pairingCodeDisplay').innerHTML = `
        <p style="color:#aaa; font-size:14px;">CÓDIGO DE CONEXÃO</p>
        <div class="pairing-code">${codigo}</div>
        <p style="color:#FF9800; margin-top:15px;">⏰ Válido por 5 minutos</p>
        <button class="btn btn-copy-code" onclick="copiarCodigo('${codigo}')">
            📋 Copiar Código
        </button>
    `;
    
    showToast('📋 Código gerado! Digite no WhatsApp', 'success');
}

// Mostrar QR Code real do backend
function mostrarQRCodeReal(qr) {
    const connectionArea = document.getElementById('whatsappConnectionArea');
    connectionArea.innerHTML = `
        <div class="pairing-container">
            <h3>📱 Escaneie o QR Code</h3>
            <p style="color:#666;">Abra o WhatsApp no celular e escaneie</p>
            <div id="qrCodeContainer" style="display:flex; justify-content:center; margin:20px 0;"></div>
            <div class="pairing-instructions">
                <h4>📋 Instruções:</h4>
                <div class="instruction-step">
                    <span class="step-num">1</span>
                    <p>Abra o <strong>WhatsApp</strong> no celular</p>
                </div>
                <div class="instruction-step">
                    <span class="step-num">2</span>
                    <p>Vá em <strong>Aparelhos Conectados</strong></p>
                </div>
                <div class="instruction-step">
                    <span class="step-num">3</span>
                    <p>Escaneie o <strong>QR Code</strong> acima</p>
                </div>
            </div>
            <button class="btn btn-danger" onclick="cancelarConexao()" style="margin-top:15px;">
                ❌ Cancelar
            </button>
        </div>
    `;
    
    // Gerar QR Code visual (se tiver a biblioteca)
    if (typeof QRCode !== 'undefined') {
        new QRCode(document.getElementById('qrCodeContainer'), {
            text: qr,
            width: 256,
            height: 256
        });
    }
}

// UI de conectado
function whatsAppConectadoUI(phoneNumber) {
    APP_DATA.whatsapp.connected = true;
    APP_DATA.whatsapp.sessionId = 'WA_' + Date.now().toString(36);
    
    localStorage.setItem('whatsapp_connected', 'true');
    localStorage.setItem('whatsapp_phone', phoneNumber);
    
    // Adicionar dispositivo
    APP_DATA.whatsapp.devices.push({
        id: Date.now(),
        numero: phoneNumber,
        status: 'Conectado',
        sessionId: APP_DATA.whatsapp.sessionId,
        conectadoEm: new Date().toLocaleString(),
        metodo: APP_DATA.whatsapp.connectionMethod
    });
    
    // Atualizar UI
    const connectionArea = document.getElementById('whatsappConnectionArea');
    if (connectionArea) {
        connectionArea.innerHTML = `
            <div class="connection-success">
                <div style="font-size:60px;">✅</div>
                <h3>WhatsApp Conectado!</h3>
                <p>📱 Número: <strong>+${phoneNumber}</strong></p>
                <p>🔢 Sessão: <strong>${APP_DATA.whatsapp.sessionId}</strong></p>
                <p>🔌 Método: <strong>${APP_DATA.whatsapp.connectionMethod === 'backend' ? 'Servidor Real' : 'Simulação'}</strong></p>
                <p>🕐 ${new Date().toLocaleString()}</p>
                <button class="btn btn-primary" onclick="showSection('testar-chatbot')" style="margin:5px;">
                    💬 Testar Chatbot
                </button>
                <button class="btn btn-danger" onclick="desconectarWhatsApp()" style="margin:5px;">
                    ❌ Desconectar
                </button>
            </div>
        `;
    }
    
    atualizarDispositivos();
    atualizarDashboard();
    showToast('✅ WhatsApp conectado com sucesso!', 'success');
}

// Desconectar WhatsApp
function desconectarWhatsApp() {
    if (APP_DATA.whatsapp.connectionMethod === 'backend' && socket?.connected) {
        socket.emit('disconnect_device');
    }
    
    APP_DATA.whatsapp.connected = false;
    APP_DATA.whatsapp.pairingCode = null;
    APP_DATA.whatsapp.sessionId = null;
    APP_DATA.whatsapp.devices = [];
    APP_DATA.whatsapp.connectionMethod = 'simulation';
    
    localStorage.removeItem('whatsapp_connected');
    
    const connectionArea = document.getElementById('whatsappConnectionArea');
    if (connectionArea) {
        connectionArea.innerHTML = `
            <div class="connection-form">
                <h3>🔌 Gerar Código de Conexão</h3>
                <p style="color:#666; margin-bottom:15px;">
                    Digite o número do WhatsApp para gerar o código de emparelhamento
                </p>
                <input type="tel" id="whatsappNumber" placeholder="5511999999999" style="font-size:18px; padding:15px;">
                <button class="btn btn-success btn-large" onclick="conectarWhatsAppViaNumero()"
                        style="width:100%; padding:15px; font-size:18px; margin-top:15px;">
                    🔌 Gerar Código de Conexão
                </button>
                ${backendDisponivel ? '<p style="color:#25D366; margin-top:10px; text-align:center;">🟢 Servidor disponível</p>' : ''}
            </div>
        `;
    }
    
    atualizarDispositivos();
    atualizarDashboard();
    showToast('WhatsApp desconectado', 'error');
}

function cancelarConexao() {
    const connectionArea = document.getElementById('whatsappConnectionArea');
    if (connectionArea) {
        connectionArea.innerHTML = `
            <div class="connection-form">
                <h3>🔌 Gerar Código de Conexão</h3>
                <p style="color:#666; margin-bottom:15px;">
                    Digite o número do WhatsApp para gerar o código
                </p>
                <input type="tel" id="whatsappNumber" placeholder="5511999999999" style="font-size:18px; padding:15px;">
                <button class="btn btn-success btn-large" onclick="conectarWhatsAppViaNumero()"
                        style="width:100%; padding:15px; font-size:18px; margin-top:15px;">
                    🔌 Gerar Código de Conexão
                </button>
            </div>
        `;
    }
    showToast('Conexão cancelada', 'info');
}

function copiarCodigo(codigo) {
    const codigoLimpo = codigo.replace('-', '');
    navigator.clipboard.writeText(codigoLimpo).then(() => {
        showToast('📋 Código copiado! Cole no WhatsApp', 'success');
    }).catch(() => {
        prompt('Copie o código (sem o traço):', codigoLimpo);
    });
}

function atualizarDispositivos() {
    const container = document.getElementById('whatsappDevices');
    if (!container) return;
    
    if (APP_DATA.whatsapp.devices.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Nenhum dispositivo conectado</p>';
        return;
    }
    
    container.innerHTML = APP_DATA.whatsapp.devices.map(d => `
        <div class="card" style="border-left:4px solid #25D366;">
            <h3>📱 Dispositivo ${d.metodo === 'backend' ? '🔌 Real' : '💻 Simulação'}</h3>
            <p><strong>Número:</strong> +${d.numero}</p>
            <p><strong>Status:</strong> 🟢 ${d.status}</p>
            <p><strong>Sessão:</strong> ${d.sessionId}</p>
            <p><strong>Conectado em:</strong> ${d.conectadoEm}</p>
        </div>
    `).join('');
}

// ==========================================
// CHAVES API
// ==========================================
function gerarAppKey() {
    APP_DATA.apiKeys.appKey = 'AK_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    atualizarChaves();
    showToast('✅ App Key gerada!', 'success');
}

function gerarAuthKey() {
    APP_DATA.apiKeys.authKey = 'AUTH_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 16).toUpperCase();
    atualizarChaves();
    showToast('✅ Auth Key gerada!', 'success');
}

function gerarAPIKey() {
    APP_DATA.apiKeys.apiKey = 'API_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 24).toUpperCase();
    atualizarChaves();
    showToast('✅ Chave API gerada!', 'success');
}

function gerarTodasChaves() {
    gerarAppKey();
    gerarAuthKey();
    gerarAPIKey();
}

function atualizarChaves() {
    const display = document.getElementById('apiKeysDisplay');
    const appKeyEl = document.getElementById('appKeyDisplay');
    const authKeyEl = document.getElementById('authKeyDisplay');
    const apiKeyEl = document.getElementById('apiKeyDisplay');
    
    if (appKeyEl) appKeyEl.textContent = APP_DATA.apiKeys.appKey || '-';
    if (authKeyEl) authKeyEl.textContent = APP_DATA.apiKeys.authKey || '-';
    if (apiKeyEl) apiKeyEl.textContent = APP_DATA.apiKeys.apiKey || '-';
    
    if (display) {
        display.innerHTML = `
            ${APP_DATA.apiKeys.appKey ? `<div class="api-key-box">📱 App Key: ${APP_DATA.apiKeys.appKey}</div>` : ''}
            ${APP_DATA.apiKeys.authKey ? `<div class="api-key-box">🔐 Auth Key: ${APP_DATA.apiKeys.authKey}</div>` : ''}
            ${APP_DATA.apiKeys.apiKey ? `<div class="api-key-box">🔌 API Key: ${APP_DATA.apiKeys.apiKey}</div>` : ''}
            ${!APP_DATA.apiKeys.appKey && !APP_DATA.apiKeys.authKey && !APP_DATA.apiKeys.apiKey ? 
                '<p style="color:#999;">Nenhuma chave gerada</p>' : ''}
        `;
    }
    
    const chavesCount = document.getElementById('chavesCount');
    if (chavesCount) {
        chavesCount.textContent = 
            (APP_DATA.apiKeys.appKey ? 1 : 0) + 
            (APP_DATA.apiKeys.authKey ? 1 : 0) + 
            (APP_DATA.apiKeys.apiKey ? 1 : 0);
    }
}

// ==========================================
// DASHBOARD
// ==========================================
function atualizarDashboard() {
    const statusEl = document.getElementById('whatsappDashboardStatus');
    const textEl = document.getElementById('whatsappDashboardText');
    const msgEl = document.getElementById('mensagensHoje');
    const diagEl = document.getElementById('diagWhatsApp');
    
    if (statusEl) statusEl.textContent = APP_DATA.whatsapp.connected ? '🟢' : '⚫';
    if (textEl) textEl.textContent = APP_DATA.whatsapp.connected ? 'Conectado' : 'Desconectado';
    if (msgEl) msgEl.textContent = APP_DATA.messagesSent;
    if (diagEl) diagEl.innerHTML = APP_DATA.whatsapp.connected ? 
        `🟢 WhatsApp: Conectado (${APP_DATA.whatsapp.connectionMethod})` : 
        '⚫ WhatsApp: Desconectado';
}

// ==========================================
// CHATBOT
// ==========================================
                    function criarChatbot() {
    const nome = prompt('Nome do chatbot:');
    if (!nome) return;
    APP_DATA.chatbots.push({ name: nome, status: 'Ativo', messages: 0 });
    atualizarChatbots();
    showToast(`✅ Chatbot "${nome}" criado!`, 'success');
}

function atualizarChatbots() {
    const container = document.getElementById('listaChatbots');
    if (!container) return;
    container.innerHTML = APP_DATA.chatbots.map(b => `
        <div class="card">
            <h3>🤖 ${b.name}</h3>
            <p>Status: 🟢 ${b.status}</p>
            <p>Mensagens: ${b.messages}</p>
            <button class="btn btn-primary" style="margin:5px;">Editar</button>
            <button class="btn btn-danger" style="margin:5px;" onclick="deletarChatbot('${b.name}')">Excluir</button>
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
            <span style="background:#DCF8C6; padding:10px 15px; border-radius:15px; display:inline-block; max-width:70%;">
                ${msg}
            </span>
        </div>
    `;
    input.value = '';
    
    // Resposta do bot
    setTimeout(() => {
        const resposta = gerarRespostaBot(msg);
        messages.innerHTML += `
            <div style="text-align:left; margin:10px;">
                <span style="background:white; padding:10px 15px; border-radius:15px; display:inline-block; max-width:70%; border:1px solid #e0e0e0;">
                    ${resposta}
                </span>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
    
    messages.scrollTop = messages.scrollHeight;
    APP_DATA.messagesSent++;
    atualizarDashboard();
}

function gerarRespostaBot(msg) {
    const m = msg.toLowerCase();
    if (m.includes('olá') || m.includes('oi')) return 'Olá! Como posso ajudar? 😊';
    if (m.includes('preço') || m.includes('valor')) return 'Nossos planos começam a partir de R$ 29,90/mês!';
    if (m.includes('suporte')) return 'Nossa equipe está disponível 24/7. Qual sua dúvida?';
    if (m.includes('obrigado')) return 'De nada! Estou sempre aqui! 👋';
    if (m.includes('tchau')) return 'Até logo! Tenha um ótimo dia!';
    
    const respostas = [
        'Entendi! Me conte mais.',
        'Estou aqui para ajudar!',
        'Interessante! Continue.',
        'Como posso ajudar com isso?'
    ];
    return respostas[Math.floor(Math.random() * respostas.length)];
}

// ==========================================
// TEMPLATES
// ==========================================
function criarTemplate() {
    const nome = prompt('Nome do template:');
    if (!nome) return;
    APP_DATA.templates.push({ name: nome, category: 'Personalizado', status: 'Pendente' });
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
// CAMPANHAS
// ==========================================
function criarCampanha() {
    const nome = prompt('Nome da campanha:');
    if (!nome) return;
    APP_DATA.campaigns.push({ name: nome, status: 'Ativa', sent: 0 });
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
    
    APP_DATA.smsSent++;
    
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="card" style="background:#d4edda; margin-top:15px;">
                <h4>✅ SMS Enviado!</h4>
                <p>Para: ${numero}</p>
                <p>Mensagem: ${mensagem}</p>
                <p>Total SMS hoje: ${APP_DATA.smsSent}</p>
            </div>
        `;
    }
    
    showToast('📱 SMS enviado!', 'success');
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
    
    showToast(`✅ Agendado para ${new Date(data).toLocaleString()}`, 'success');
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
    showToast(`📨 Enviando para ${total} contatos...`, 'info');
    
    setTimeout(() => {
        showToast(`✅ Mensagem enviada para ${total} contatos!`, 'success');
        APP_DATA.messagesSent += total;
        atualizarDashboard();
    }, 3000);
}

// ==========================================
// ENVIAR MENSAGEM INDIVIDUAL
// ==========================================
function enviarMsg() {
    const numero = document.getElementById('msgNumber')?.value;
    const texto = document.getElementById('msgTexto')?.value;
    
    if (!numero || !texto) {
        showToast('Preencha todos os campos!', 'error');
        return;
    }
    
    // Tentar enviar via backend
    if (APP_DATA.whatsapp.connected && APP_DATA.whatsapp.connectionMethod === 'backend' && socket?.connected) {
        socket.emit('send_message', { to: numero, message: texto });
    }
    
    showToast('✅ Mensagem enviada!', 'success');
    APP_DATA.messagesSent++;
    atualizarDashboard();
}

// ==========================================
// LOGOUT
// ==========================================
function logout() {
    if (confirm('Deseja realmente sair?')) {
        showToast('Saindo...', 'info');
        setTimeout(() => {
            alert('Logout realizado!');
            location.reload();
        }, 1000);
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 BotBot System iniciado!');
    
    // Tentar conectar ao backend
    conectarBackend();
    
    // Verificar conexão anterior
    const wasConnected = localStorage.getItem('whatsapp_connected');
    const phoneNumber = localStorage.getItem('whatsapp_phone');
    
    if (wasConnected === 'true' && phoneNumber) {
        APP_DATA.whatsapp.connected = true;
        APP_DATA.whatsapp.phoneNumber = phoneNumber;
        whatsAppConectadoUI(phoneNumber);
    }
    
    // Inicializar componentes
    atualizarDispositivos();
    atualizarChatbots();
    atualizarTemplates();
    atualizarCampanhas();
    atualizarChaves();
    atualizarDashboard();
    
    // Enter no chatbot
    document.getElementById('chatbotInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') testarChatbot();
    });
    
    console.log('📊 Status:', {
        backend: backendDisponivel ? 'Conectado' : 'Simulação',
        whatsapp: APP_DATA.whatsapp.connected ? 'Conectado' : 'Desconectado',
        chaves: (APP_DATA.apiKeys.appKey ? 1 : 0) + (APP_DATA.apiKeys.authKey ? 1 : 0) + (APP_DATA.apiKeys.apiKey ? 1 : 0)
    });
});
