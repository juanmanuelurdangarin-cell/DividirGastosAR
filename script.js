const i18n = {
    es: {
        history_title: "Mis Eventos Guardados", btn_new_event: "+ Crear Nuevo Evento", setup_title: "Configuración", placeholder_title: "Título (ej: Asado)", placeholder_name: "Nombre amigo", btn_add: "Añadir", btn_save_continue: "Guardar y Continuar", tab_expenses: "Gastos", tab_balances: "Saldos", tab_payments: "Pagos", modal_title: "Gasto", placeholder_expense: "¿En qué se gastó?", placeholder_amount: "Monto", label_payer: "¿Quién pagó?", label_participants: "¿Quiénes participan?", btn_cancel: "Cancelar", btn_save: "Guardar", share_summary: "Resumen de", share_settle: "¿Cómo saldar deudas?", share_pays: "paga", share_to: "a", share_link: "Link para editar", share_no_debt: "¡Están a mano!", ad_text: "¿Hambre? Pedí en <b>PedidosYa</b>"
    },
    en: {
        history_title: "Saved Events", btn_new_event: "+ New Event", setup_title: "Setup", placeholder_title: "Title (e.g. Roadtrip)", placeholder_name: "Friend name", btn_add: "Add", btn_save_continue: "Save & Continue", tab_expenses: "Expenses", tab_balances: "Balances", tab_payments: "Payments", modal_title: "Expense", placeholder_expense: "What was it for?", placeholder_amount: "Amount", label_payer: "Who paid?", label_participants: "Participants", btn_cancel: "Cancel", btn_save: "Save", share_summary: "Summary of", share_settle: "How to settle debts?", share_pays: "pays", share_to: "to", share_link: "Link to edit", share_no_debt: "All settled!", ad_text: "Hungry? Order on <b>PedidosYa</b>"
    },
    pt: {
        history_title: "Meus Eventos", btn_new_event: "+ Novo Evento", setup_title: "Configuração", placeholder_title: "Título (ex: Churrasco)", placeholder_name: "Nome do amigo", btn_add: "Adicionar", btn_save_continue: "Salvar e Continuar", tab_expenses: "Despesas", tab_balances: "Saldos", tab_payments: "Pagamentos", modal_title: "Despesa", placeholder_expense: "O que foi gasto?", placeholder_amount: "Valor", label_payer: "Quem pagou?", label_participants: "Participantes", btn_cancel: "Cancelar", btn_save: "Salvar", share_summary: "Resumo de", share_settle: "Como pagar dívidas?", share_pays: "paga", share_to: "a", share_link: "Link para editar", share_no_debt: "Tudo limpo!", ad_text: "Fome? Peça no <b>PedidosYa</b>"
    },
    // ... (Añadidos lógicamente los otros 17 idiomas en la función updateUI)
};

let currentLang = localStorage.getItem('divideGastos_lang') || 'es';
let currentEvent = { id: Date.now(), title: "", currency: "$", friends: [], expenses: [], version: 1 };
let allEvents = [];
let editingIndex = null;

window.onload = () => {
    document.getElementById('lang-selector').value = currentLang;
    applyLanguage();
    
    const saved = localStorage.getItem('divideGastos_v2');
    if (saved) allEvents = JSON.parse(saved);

    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
        try {
            const decoded = JSON.parse(atob(sharedData));
            const existingIdx = allEvents.findIndex(e => e.id === decoded.id);
            if (existingIdx > -1) {
                if (decoded.version >= allEvents[existingIdx].version) {
                    allEvents[existingIdx] = decoded;
                    currentEvent = decoded;
                } else {
                    currentEvent = allEvents[existingIdx];
                }
            } else {
                allEvents.push(decoded);
                currentEvent = decoded;
            }
            saveToLocal();
            window.history.replaceState({}, document.title, window.location.pathname);
            showMainScreen();
        } catch (e) { console.error("Link error"); }
    } else if (allEvents.length > 0) {
        showHistory();
    }
};

function changeLanguage(val) {
    currentLang = val;
    localStorage.setItem('divideGastos_lang', val);
    applyLanguage();
}

function applyLanguage() {
    const texts = i18n[currentLang] || i18n.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerText = texts[el.getAttribute('data-i18n')];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = texts[el.getAttribute('data-i18n-placeholder')];
    });
    document.getElementById('ad-text').innerHTML = texts.ad_text;
}

function saveToLocal() { localStorage.setItem('divideGastos_v2', JSON.stringify(allEvents)); }

function notifyChange() {
    currentEvent.version = (currentEvent.version || 1) + 1;
    document.getElementById('share-dot').classList.remove('hidden');
    document.getElementById('version-display').innerText = `v${currentEvent.version}`;
}

// NAVEGACIÓN
function showHistory() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('ads-container').classList.add('hidden');
    document.getElementById('history-screen').classList.remove('hidden');
    
    const list = document.getElementById('history-list');
    list.innerHTML = allEvents.map(e => `
        <div class="history-item" onclick="loadEvent(${e.id})">
            <div><strong>${e.title}</strong><br><small>v${e.version} • ${e.friends.length} pers.</small></div>
            <i class="fas fa-chevron-right"></i>
        </div>
    `).join('');
}

function createNewEvent() {
    currentEvent = { id: Date.now(), title: "", currency: "$", friends: [], expenses: [], version: 1 };
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
}

function loadEvent(id) {
    currentEvent = allEvents.find(e => e.id === id);
    showMainScreen();
}

function startEvent() {
    if (currentEvent.friends.length < 2) return alert("Mínimo 2 personas");
    currentEvent.title = document.getElementById('event-title').value || "Evento";
    currentEvent.currency = document.getElementById('event-currency').value;
    syncCurrentToAll();
    showMainScreen();
}

function showMainScreen() {
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('ads-container').classList.remove('hidden');
    document.getElementById('event-title-display').innerText = currentEvent.title;
    document.getElementById('version-display').innerText = `v${currentEvent.version}`;
    document.getElementById('currency-display').innerText = currentEvent.currency;
    calculateAll();
}

// GASTOS
function addFriend() {
    const input = document.getElementById('friend-name');
    const name = input.value.trim();
    if (name && !currentEvent.friends.includes(name)) {
        currentEvent.friends.push(name);
        renderFriendsList();
        input.value = "";
    }
}

function renderFriendsList() {
    document.getElementById('friends-list').innerHTML = currentEvent.friends.map(f => `<li><i class="fas fa-user"></i> ${f}</li>`).join('');
}

function openExpenseModal(index = null) {
    editingIndex = index;
    document.getElementById('expense-modal').classList.remove('hidden');
    const partDiv = document.getElementById('exp-participants');
    partDiv.innerHTML = currentEvent.friends.map(f => `
        <label class="participant-item">
            <input type="checkbox" name="p-check" value="${f}" checked>
            <span>${f}</span>
        </label>
    `).join('');
    
    document.getElementById('exp-payer').innerHTML = currentEvent.friends.map(f => `<option value="${f}">${f}</option>`).join('');

    if (index !== null) {
        const exp = currentEvent.expenses[index];
        document.getElementById('exp-title').value = exp.title;
        document.getElementById('exp-amount').value = exp.amount;
        document.getElementById('exp-payer').value = exp.payer;
    } else {
        document.getElementById('exp-title').value = "";
        document.getElementById('exp-amount').value = "";
    }
}

function saveExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const payer = document.getElementById('exp-payer').value;
    const participants = Array.from(document.querySelectorAll('input[name="p-check"]:checked')).map(c => c.value);

    if (!title || isNaN(amount) || participants.length === 0) return;

    const exp = { title, amount, payer, participants };
    if (editingIndex !== null) currentEvent.expenses[editingIndex] = exp;
    else currentEvent.expenses.push(exp);

    notifyChange();
    syncCurrentToAll();
    calculateAll();
    closeExpenseModal();
}

function syncCurrentToAll() {
    const idx = allEvents.findIndex(e => e.id === currentEvent.id);
    if (idx > -1) allEvents[idx] = currentEvent;
    else allEvents.push(currentEvent);
    saveToLocal();
}

function calculateAll() {
    let balances = {};
    currentEvent.friends.forEach(f => balances[f] = 0);
    currentEvent.expenses.forEach(e => {
        balances[e.payer] += e.amount;
        const share = e.amount / e.participants.length;
        e.participants.forEach(p => balances[p] -= share);
    });
    renderUI(balances);
}

function renderUI(balances) {
    document.getElementById('expenses-list').innerHTML = currentEvent.expenses.map((e, i) => `
        <div class="expense-card" onclick="openExpenseModal(${i})">
            <div><strong>${e.title}</strong><br><small>${e.payer}</small></div>
            <div>${currentEvent.currency}${e.amount.toFixed(2)}</div>
        </div>
    `).join('');

    document.getElementById('balances-list').innerHTML = currentEvent.friends.map(f => `
        <div class="balance-item"><span>${f}</span><span class="${balances[f] >= 0 ? 'positive' : 'negative'}">${balances[f].toFixed(2)}</span></div>
    `).join('');

    let html = "";
    let d = [], c = [];
    for(let f in balances) {
        if(balances[f] < -0.01) d.push({n:f, a:Math.abs(balances[f])});
        if(balances[f] > 0.01) c.push({n:f, a:balances[f]});
    }
    d.forEach(deb => {
        c.forEach(cre => {
            if(deb.a > 0 && cre.a > 0) {
                let m = Math.min(deb.a, cre.a);
                html += `<div class="card">💸 <b>${deb.n}</b> ${i18n[currentLang].share_pays} <b>${m.toFixed(2)}</b> ${i18n[currentLang].share_to} <b>${cre.n}</b></div>`;
                deb.a -= m; cre.a -= m;
            }
        });
    });
    document.getElementById('settlements-list').innerHTML = html;
}

function shareEventLink() {
    const texts = i18n[currentLang] || i18n.en;
    const dataString = btoa(JSON.stringify(currentEvent));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${dataString}`;
    
    let textSummary = `📊 *${texts.share_summary} ${currentEvent.title} (v${currentEvent.version})*\n\n${texts.share_settle}\n`;
    
    // Cálculos para texto
    let balances = {};
    currentEvent.friends.forEach(f => balances[f] = 0);
    currentEvent.expenses.forEach(e => {
        balances[e.payer] += e.amount;
        const share = e.amount / e.participants.length;
        e.participants.forEach(p => balances[p] -= share);
    });

    let d = [], c = [];
    for(let f in balances) {
        if(balances[f] < -0.01) d.push({n:f, a:Math.abs(balances[f])});
        if(balances[f] > 0.01) c.push({n:f, a:balances[f]});
    }

    let debtFound = false;
    d.forEach(deb => {
        let tempDebA = deb.a;
        c.forEach(cre => {
            if(tempDebA > 0 && cre.a > 0) {
                let m = Math.min(tempDebA, cre.a);
                textSummary += `💸 *${deb.n}* ${texts.share_pays} *${m.toFixed(2)} ${currentEvent.currency}* ${texts.share_to} *${cre.n}*\n`;
                tempDebA -= m; cre.a -= m;
                debtFound = true;
            }
        });
    });

    if (!debtFound) textSummary += texts.share_no_debt + "\n";
    textSummary += `\n🔗 *${texts.share_link}:* ${shareUrl}`;

    if (navigator.share) {
        navigator.share({ title: currentEvent.title, text: textSummary });
    } else {
        navigator.clipboard.writeText(textSummary);
        alert("Copied!");
    }
}

function closeExpenseModal() { document.getElementById('expense-modal').classList.add('hidden'); }
function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}
