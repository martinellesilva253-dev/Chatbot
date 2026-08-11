// Gerenciamento de Chaves
class KeyManager {
    constructor() {
        this.keys = JSON.parse(localStorage.getItem('apiKeys') || '[]');
    }

    // Adicionar nova chave
    addKey(type, value) {
        const key = {
            id: Date.now(),
            type: type,
            value: value,
            createdAt: new Date().toISOString(),
            lastUsed: null,
            active: true
        };
        
        this.keys.push(key);
        this.saveKeys();
        this.updateDisplay();
        
        return key;
    }

    // Listar chaves
    getKeys() {
        return this.keys.filter(k => k.active);
    }

    // Revogar chave
    revokeKey(id) {
        const key = this.keys.find(k => k.id === id);
        if (key) {
            key.active = false;
            this.saveKeys();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    // Salvar no localStorage
    saveKeys() {
        localStorage.setItem('apiKeys', JSON.stringify(this.keys));
        this.updateStats();
    }

    // Atualizar display
    updateDisplay() {
        const display = document.getElementById('keysDisplay');
        const activeKeys = this.getKeys();
        
        if (activeKeys.length === 0) {
            display.innerHTML = '<p class="no-keys">Nenhuma chave gerada</p>';
            return;
        }

        display.innerHTML = activeKeys.map(key => `
            <div class="key-item">
                <div class="key-type">${key.type}</div>
                <div class="key-value">${key.value}</div>
                <div class="key-date">Criada em: ${new Date(key.createdAt).toLocaleDateString()}</div>
                <button onclick="keyManager.revokeKey(${key.id})" class="btn-revoke">
                    Revogar
                </button>
            </div>
        `).join('');
    }

    // Atualizar estatísticas
    updateStats() {
        const activeCount = this.getKeys().length;
        const element = document.getElementById('keysGenerated');
        if (element) element.textContent = activeCount;
    }
}

const keyManager = new KeyManager();
