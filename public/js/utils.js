export function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const colors = {
    success: { bg: '#15803d', border: '#0d5e2d', icon: 'fa-check-circle' },
    error: { bg: '#dc2626', border: '#b91c1c', icon: 'fa-times-circle' },
    warning: { bg: '#d97706', border: '#b45309', icon: 'fa-exclamation-triangle' },
    info: { bg: '#0284c7', border: '#0369a1', icon: 'fa-info-circle' }
};

export function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '99999',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);
    }

    const c = colors[type] || colors.info;
    const el = document.createElement('div');
    Object.assign(el.style, {
        pointerEvents: 'auto',
        padding: '14px 20px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '280px',
        maxWidth: '420px',
        background: c.bg,
        borderLeft: `4px solid ${c.border}`,
        transform: 'translateX(120%)',
        opacity: '0',
        transition: 'transform 0.3s ease, opacity 0.3s ease'
    });
    el.innerHTML = `<i class="fa-solid ${c.icon}" style="font-size:18px"></i> ${escapeHtml(message)}`;
    container.appendChild(el);

    // Animação de entrada
    requestAnimationFrame(() => {
        el.style.transform = 'translateX(0)';
        el.style.opacity = '1';
    });

    setTimeout(() => {
        el.style.transform = 'translateX(120%)';
        el.style.opacity = '0';
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
    }, duration);

    return el;
}

export function showConfirm(message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', zIndex: '99998',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Segoe UI', sans-serif"
        });

        const box = document.createElement('div');
        Object.assign(box.style, {
            background: 'white', padding: '30px', borderRadius: '12px',
            width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        });
        box.innerHTML = `
            <div style="margin-bottom:20px">
                <h3 style="margin:0 0 10px 0;color:#333;font-size:16px">
                    <i class="fa-solid fa-question-circle" style="color:#059c0d"></i> Confirmação
                </h3>
                <p style="margin:0;font-size:14px;color:#666;line-height:1.5">${escapeHtml(message)}</p>
            </div>
            <div style="display:flex;gap:10px">
                <button id="confirm-yes" style="flex:1;padding:12px;background:#059c0d;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:14px;font-family:inherit">
                    <i class="fa-solid fa-check"></i> Sim
                </button>
                <button id="confirm-no" style="flex:1;padding:12px;background:#e91818;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:14px;font-family:inherit">
                    <i class="fa-solid fa-times"></i> Não
                </button>
            </div>`;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const cleanup = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
        overlay.querySelector('#confirm-yes').onclick = () => { cleanup(); resolve(true); };
        overlay.querySelector('#confirm-no').onclick = () => { cleanup(); resolve(false); };
        overlay.onclick = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };
    });
}

export function showPrompt(message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', zIndex: '99998',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Segoe UI', sans-serif"
        });

        const box = document.createElement('div');
        Object.assign(box.style, {
            background: 'white', padding: '30px', borderRadius: '12px',
            width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        });
        box.innerHTML = `
            <div style="margin-bottom:20px">
                <h3 style="margin:0 0 10px 0;color:#333;font-size:16px">
                    <i class="fa-solid fa-lock" style="color:#059c0d"></i> Confirmação de Senha
                </h3>
                <p style="margin:0 0 15px 0;font-size:14px;color:#666">${escapeHtml(message)}</p>
                <input type="password" id="prompt-input" placeholder="Sua senha atual" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:4px;font-size:14px;font-family:inherit;box-sizing:border-box;outline:none">
            </div>
            <div style="display:flex;gap:10px">
                <button id="prompt-ok" style="flex:1;padding:12px;background:#059c0d;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:14px;font-family:inherit">
                    <i class="fa-solid fa-check"></i> Confirmar
                </button>
                <button id="prompt-cancel" style="flex:1;padding:12px;background:#e91818;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:14px;font-family:inherit">
                    <i class="fa-solid fa-times"></i> Cancelar
                </button>
            </div>`;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const input = overlay.querySelector('#prompt-input');
        setTimeout(() => input.focus(), 50);

        const cleanup = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
        overlay.querySelector('#prompt-ok').onclick = () => { cleanup(); resolve(input.value); };
        overlay.querySelector('#prompt-cancel').onclick = () => { cleanup(); resolve(null); };
        overlay.onclick = (e) => { if (e.target === overlay) { cleanup(); resolve(null); } };
        input.onkeydown = (e) => { if (e.key === 'Enter') { cleanup(); resolve(input.value); } };
    });
}
