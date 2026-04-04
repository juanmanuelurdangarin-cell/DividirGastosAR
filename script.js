// CONFIGURACIÓN Y PERSISTENCIA
const DB_KEY = 'divide_gastos_vFinal';
let state = JSON.parse(localStorage.getItem(DB_KEY)) || {
    onboarded: false,
    events: [],
    currentEventId: null
};

// --- NAVEGACIÓN ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'screen-history') renderHistory();
}

function saveState() {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
}

// --- ONBOARDING ---
window.onload = () => {
    if (state.onboarded) showScreen('screen-history');
};

function completeOnboarding() {
    state.onboarded = true;
    saveState();
    showScreen('screen-history');
}

// --- SETUP EVENTO ---
let tempMembers = [];
let tempCurrency = 'ARS';

function addMemberToSetup() {
    const input = document.getElementById('member-input');
    const name = input.value.trim();
    if (name && !tempMembers.includes(name)) {
        tempMembers.push(name);
        input.value = '';
        renderTempMembers();
    }
}

function renderTempMembers() {
    const container = document.getElementById('member-list-setup');
    container.innerHTML = tempMembers.map(m => `
        <div class="event-card" style="padding: 10px; margin-bottom: 5px;">
            <span>${m}</span>
            <i class="fa-solid fa-times" style="margin-left:auto; color:var(--red)" onclick="removeMember('${m}')"></i>
        </div>
    `).join('');
}

function removeMember(name) {
    tempMembers = tempMembers.filter(m => m !== name);
    renderTempMembers();
}

function setCurrency(cur, btn) {
    tempCurrency = cur;
    document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function createNewEvent() {
    const title = document.getElementById('setup-title').value.trim();
    if (!title || tempMembers.length < 2) return alert("Poné un título y al menos 2 personas.");
    
    const newEvent = {
        id: Date.now(),
        title,
        currency: tempCurrency,
        members: [...tempMembers],
        expenses: []
    };
    
    state.events.push(newEvent);
    saveState();
    tempMembers = [];
    document.getElementById('setup-title').value = '';
    showScreen('screen-history');
}

// --- DASHBOARD & GASTOS ---
function renderHistory() {
    const list = document.getElementById('history-list');
    if (state.events.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding-top:50px; color:var(--muted)">
            <i class="fa-solid fa-folder-open" style="font-size:48px; margin-bottom:10px"></i>
            <p>No tenés eventos todavía.</p></div>`;
        return;
    }
    list.innerHTML = state.events.map(ev => `
        <div class="event-card" onclick="openEvent(${ev.id})">
            <div style="background:var(--accent); width:10px; height:40px; border-radius:5px"></div>
            <div>
                <div style="font-weight:700">${ev.title}</div>
                <div style="font-size:12px; color:var(--muted)">${ev.members.length} personas • ${ev.currency}</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="margin-left:auto; opacity:0.3"></i>
        </div>
    `).join('');
}

function openEvent(id) {
    state.currentEventId = id;
    const ev = state.events.find(e => e.id === id);
    document.getElementById('dash-event-title').innerText = ev.title;
    showScreen('screen-dashboard');
    switchTab('gastos');
}

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}-btn`).classList.add('active');
    document.getElementById(`tab-content-${tab}`).classList.add('active');
    renderTab(tab);
}

// --- CÁLCULOS (ALGORITMO) ---
function calculateBalances(ev) {
    const balances = {};
    ev.members.forEach(m => balances[m] = 0);
    
    ev.expenses.forEach(ex => {
        const share = ex.amount / ev.members.length;
        ev.members.forEach(m => {
            if (m === ex.payer) balances[m] += (ex.amount - share);
            else balances[m] -= share;
        });
    });
    return balances;
}

function renderTab(tab) {
    const ev = state.events.find(e => e.id === state.currentEventId);
    const container = document.getElementById(`tab-content-${tab}`);
    
    if (tab === 'gastos') {
        container.innerHTML = ev.expenses.map((ex, i) => `
            <div class="event-card">
                <div><small style="color:var(--accent)">${ex.payer} pagó</small><br><b>${ex.desc}</b></div>
                <div style="margin-left:auto; text-align:right"><b>${ev.currency} ${ex.amount}</b></div>
            </div>
        `).join('') || '<p style="text-align:center; color:var(--muted)">No hay gastos aún.</p>';
    } else if (tab === 'saldos') {
        const bals = calculateBalances(ev);
        container.innerHTML = Object.entries(bals).map(([name, val]) => `
            <div class="event-card">
                <b>${name}</b>
                <span style="margin-left:auto; color:${val >= 0 ? 'var(--accent)' : 'var(--red)'}">
                    ${val >= 0 ? 'A favor:' : 'Debe:'} ${ev.currency} ${Math.abs(val).toFixed(2)}
                </span>
            </div>
        `).join('');
    } else if (tab === 'pagos') {
        const bals = calculateBalances(ev);
        const payments = [];
        let creditors = Object.entries(bals).filter(x => x[1] > 0.01).sort((a,b) => b[1] - a[1]);
        let debtors = Object.entries(bals).filter(x => x[1] < -0.01).sort((a,b) => a[1] - b[1]);

        while (debtors.length && creditors.length) {
            let d = debtors[0], c = creditors[0];
            let amount = Math.min(Math.abs(d[1]), c[1]);
            payments.push(`${d[0]} → ${c[0]}: <b>${ev.currency} ${amount.toFixed(2)}</b>`);
            d[1] += amount;
            c[1] -= amount;
            if (Math.abs(d[1]) < 0.01) debtors.shift();
            if (c[1] < 0.01) creditors.shift();
        }
        container.innerHTML = payments.map(p => `<div class="event-card">${p}</div>`).join('') || '<p style="text-align:center; color:var(--accent)">¡Están todos saldados!</p>';
    }
}

// --- MODAL GASTO ---
let selectedPayer = '';
function openExpenseModal() {
    const ev = state.events.find(e => e.id === state.currentEventId);
    document.getElementById('modal-payer-grid').innerHTML = ev.members.map(m => `
        <button class="payer-btn" onclick="selectPayer('${m}', this)">${m}</button>
    `).join('');
    document.getElementById('modal-expense').classList.add('active');
}

function selectPayer(name, btn) {
    selectedPayer = name;
    document.querySelectorAll('.payer-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function saveExpense() {
    const desc = document.getElementById('exp-desc').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    if (!desc || !amount || !selectedPayer) return alert("Completá todos los campos.");

    const ev = state.events.find(e => e.id === state.currentEventId);
    ev.expenses.push({ desc, amount, payer: selectedPayer });
    saveState();
    closeModal();
    renderTab('gastos');
    showToast("¡Gasto guardado!");
}

function closeModal() {
    document.getElementById('modal-expense').classList.remove('active');
    document.getElementById('exp-desc').value = '';
    document.getElementById('exp-amount').value = '';
    selectedPayer = '';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 2500);
}

function deleteCurrentEvent() {
    if(confirm("¿Seguro que querés borrar este evento?")) {
        state.events = state.events.filter(e => e.id !== state.currentEventId);
        saveState();
        showScreen('screen-history');
    }
}

function shareEvent() {
    const ev = state.events.find(e => e.id === state.currentEventId);
    const bals = calculateBalances(ev);
    let text = `*Resumen de ${ev.title}*\n\n`;
    text += `Total gastos: ${ev.currency} ${ev.expenses.reduce((a,b)=>a+b.amount, 0)}\n\n`;
    text += `Deudas:\n`;
    // ... lógica de pagos igual a la del tab pagos pero para texto
    showToast("Link copiado (simulado)");
    console.log(text); // Aquí podés usar navigator.share
}
