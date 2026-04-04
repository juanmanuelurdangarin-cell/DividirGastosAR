// CONFIGURACIÓN DE PAISES Y MONEDAS
const countriesByLang = {
    es: [
        { name: "Argentina", currency: "ARS" },
        { name: "España", currency: "EUR" },
        { name: "México", currency: "MXN" },
        { name: "Uruguay", currency: "UYU" }
    ],
    en: [
        { name: "United States", currency: "USD" },
        { name: "United Kingdom", currency: "GBP" }
    ],
    pt: [
        { name: "Brasil", currency: "BRL" },
        { name: "Portugal", currency: "EUR" }
    ]
};

const i18n = {
    es: { history_title: "Tus Eventos", btn_new_event: "Nuevo Evento", setup_title: "Configuración", placeholder_title: "Nombre del viaje/evento", placeholder_name: "Nombre amigo", btn_add: "Añadir", btn_save_continue: "Crear ahora", tab_expenses: "Gastos", tab_balances: "Saldos", tab_payments: "Pagos", modal_title: "Agregar Gasto", placeholder_expense: "¿En qué se gastó?", placeholder_amount: "Monto", label_payer: "Pagó:", label_participants: "Dividen:", btn_cancel: "Cerrar", btn_save: "Guardar", ad_text: "¿Hambre? Pedí en <b>PedidosYa</b>" },
    en: { history_title: "Your Events", btn_new_event: "New Event", setup_title: "Settings", placeholder_title: "Event name", placeholder_name: "Friend name", btn_add: "Add", btn_save_continue: "Create now", tab_expenses: "Expenses", tab_balances: "Balances", tab_payments: "Payments", modal_title: "Add Expense", placeholder_expense: "What was it for?", placeholder_amount: "Amount", label_payer: "Paid by:", label_participants: "Participants:", btn_cancel: "Close", btn_save: "Save", ad_text: "Hungry? Order on <b>PedidosYa</b>" }
};

// MOTOR DE PERSISTENCIA (Blindado para no borrar)
const DB_KEY = 'dg_premium_data_v1';
let appState = {
    lang: localStorage.getItem('dg_lang') || '',
    country: JSON.parse(localStorage.getItem('dg_country')) || null,
    events: JSON.parse(localStorage.getItem(DB_KEY)) || [],
    currentEventId: null
};

window.onload = () => {
    // Intentar rescatar datos de versiones viejas si existen
    migrateOldData();
    
    if (!appState.lang || !appState.country) {
        document.getElementById('welcome-screen').classList.remove('hidden');
    } else {
        showHistory();
    }
};

function migrateOldData() {
    const oldKeys = ['dg_events_v3', 'divideGastos_v2'];
    oldKeys.forEach(key => {
        const oldData = localStorage.getItem(key);
        if (oldData) {
            const parsed = JSON.parse(oldData);
            // Si el evento no está ya en la nueva base, lo sumamos
            parsed.forEach(ev => {
                if (!appState.events.find(x => x.id === ev.id)) {
                    appState.events.push(ev);
                }
            });
            localStorage.removeItem(key); // Limpiamos lo viejo
            saveToDB();
        }
    });
}

function saveToDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(appState.events));
}

// LÓGICA DE INTERFAZ
function onLanguageChange(lang) {
    if(!lang) return;
    const countries = countriesByLang[lang] || countriesByLang.en;
    const selector = document.getElementById('main-country-selector');
    selector.innerHTML = countries.map(c => `<option value='${JSON.stringify(c)}'>${c.name} (${c.currency})</option>`).join('');
    document.getElementById('country-wrapper').classList.remove('hidden');
}

function confirmIdentity() {
    appState.lang = document.getElementById('main-lang-selector').value;
    appState.country = JSON.parse(document.getElementById('main-country-selector').value);
    
    localStorage.setItem('dg_lang', appState.lang);
    localStorage.setItem('dg_country', JSON.stringify(appState.country));
    
    document.getElementById('welcome-screen').classList.add('hidden');
    showHistory();
}

function showHistory() {
    applyLanguage();
    hideAllScreens();
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('content-area').classList.remove('hidden');
    document.getElementById('history-screen').classList.remove('hidden');
    document.getElementById('ads-container').classList.add('hidden'); // Ocultar publicidad en home
    
    const list = document.getElementById('history-list');
    list.innerHTML = appState.events.map(e => `
        <div class="card" onclick="loadEvent(${e.id})">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <div>
                    <h4 style="margin:0">${e.title}</h4>
                    <small style="color:#636e72">${e.friends.length} amigos • ${e.currency}</small>
                </div>
                <i class="fas fa-chevron-right" style="opacity:0.3"></i>
            </div>
        </div>
    `).join('') || `<p style="text-align:center; opacity:0.5; margin-top:40px;">No hay eventos todavía.</p>`;
}

function createNewEvent() {
    hideAllScreens();
    document.getElementById('setup-screen').classList.remove('hidden');
    
    const currencies = [...new Set([appState.country.currency, 'USD', 'EUR'])];
    document.getElementById('event-currency').innerHTML = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
    
    // Reset temporal del evento actual
    tempFriends = [];
    document.getElementById('friends-chips').innerHTML = "";
}

let tempFriends = [];
function addFriend() {
    const name = document.getElementById('friend-name').value.trim();
    if (name && !tempFriends.includes(name)) {
        tempFriends.push(name);
        renderFriendsChips();
        document.getElementById('friend-name').value = "";
    }
}

function renderFriendsChips() {
    document.getElementById('friends-chips').innerHTML = tempFriends.map(f => `
        <span class="chip"><i class="fas fa-user-circle"></i> ${f}</span>
    `).join('');
}

function startEvent() {
    const title = document.getElementById('event-title').value.trim();
    if (!title || tempFriends.length < 2) return alert("Ponle un nombre y agrega al menos 2 amigos");
    
    const newEvent = {
        id: Date.now(),
        title: title,
        currency: document.getElementById('event-currency').value,
        friends: tempFriends,
        expenses: [],
        version: 1
    };
    
    appState.events.push(newEvent);
    appState.currentEventId = newEvent.id;
    saveToDB();
    loadEvent(newEvent.id);
}

function loadEvent(id) {
    appState.currentEventId = id;
    const ev = appState.events.find(x => x.id === id);
    
    hideAllScreens();
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('ads-container').classList.remove('hidden');
    document.getElementById('event-title-display').innerText = ev.title;
    document.getElementById('currency-display').innerText = ev.currency;
    
    calculateAll();
}

// CALCULOS Y UI DE GASTOS
function calculateAll() {
    const ev = appState.events.find(x => x.id === appState.currentEventId);
    let balances = {};
    ev.friends.forEach(f => balances[f] = 0);
    
    ev.expenses.forEach(ex => {
        balances[ex.payer] += ex.amount;
        const partShare = ex.amount / ex.participants.length;
        ex.participants.forEach(p => balances[p] -= partShare);
    });
    
    renderExpenses(ev);
    renderBalances(balances, ev.currency);
}

function renderExpenses(ev) {
    const list = document.getElementById('expenses-list');
    list.innerHTML = ev.expenses.map((ex, i) => `
        <div class="expense-card" onclick="editExpense(${i})">
            <div>
                <b style="display:block">${ex.title}</b>
                <small>${ex.payer} pagó</small>
            </div>
            <div style="text-align:right">
                <b style="color:var(--text)">${ev.currency} ${ex.amount.toFixed(2)}</b>
            </div>
        </div>
    `).join('') || '<p style="text-align:center; padding:40px; opacity:0.4;">No hay gastos registrados.</p>';
}

function renderBalances(balances, symbol) {
    const list = document.getElementById('balances-list');
    list.innerHTML = Object.entries(balances).map(([name, val]) => `
        <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f1f3f5">
            <span>${name}</span>
            <span style="font-weight:700; color:${val >= 0 ? 'var(--primary)' : '#e74c3c'}">
                ${val >= 0 ? '+' : ''}${val.toFixed(2)} ${symbol}
            </span>
        </div>
    `).join('');
}

// UTILS
function hideAllScreens() {
    document.querySelectorAll('.page, .screen').forEach(s => s.classList.add('hidden'));
}

function applyLanguage() {
    const texts = i18n[appState.lang] || i18n.es;
    document.querySelectorAll('[data-i18n]').forEach(el => el.innerText = texts[el.getAttribute('data-i18n')]);
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = texts[el.getAttribute('data-i18n-placeholder')]);
    document.getElementById('ad-text').innerHTML = texts.ad_text;
}

function showTab(name) {
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

function openExpenseModal() {
    const ev = appState.events.find(x => x.id === appState.currentEventId);
    document.getElementById('expense-modal').classList.remove('hidden');
    document.getElementById('exp-payer').innerHTML = ev.friends.map(f => `<option value="${f}">${f}</option>`).join('');
    document.getElementById('exp-participants').innerHTML = ev.friends.map(f => `
        <label class="p-check">
            <input type="checkbox" value="${f}" checked> <span>${f}</span>
        </label>
    `).join('');
}

function saveExpense() {
    const ev = appState.events.find(x => x.id === appState.currentEventId);
    const title = document.getElementById('exp-title').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const payer = document.getElementById('exp-payer').value;
    const participants = Array.from(document.querySelectorAll('#exp-participants input:checked')).map(i => i.value);

    if(!title || isNaN(amount) || participants.length === 0) return alert("Faltan datos");

    ev.expenses.push({ title, amount, payer, participants });
    ev.version++;
    saveToDB();
    calculateAll();
    closeExpenseModal();
}

function closeExpenseModal() { document.getElementById('expense-modal').classList.add('hidden'); }
