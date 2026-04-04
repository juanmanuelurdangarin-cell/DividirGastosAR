let eventData = {
    title: "",
    currency: "$",
    friends: [],
    expenses: []
};

let editingExpenseIndex = null;

// --- INICIO ---
function addFriend() {
    const input = document.getElementById('friend-name');
    const name = input.value.trim();
    if (name && !eventData.friends.includes(name)) {
        eventData.friends.push(name);
        renderFriendsList();
        input.value = "";
    }
}

function renderFriendsList() {
    const list = document.getElementById('friends-list');
    list.innerHTML = eventData.friends.map(f => `<li>${f}</li>`).join('');
}

function startEvent() {
    if (eventData.friends.length < 2) return alert("Mínimo 2 participantes");
    eventData.title = document.getElementById('event-title').value || "Mi Evento";
    eventData.currency = document.getElementById('event-currency').value;
    
    document.getElementById('event-title-display').innerText = eventData.title;
    document.getElementById('currency-display').innerText = eventData.currency;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    
    updateUIPayerList();
}

// --- GESTIÓN DE GASTOS ---
function openExpenseModal(index = null) {
    editingExpenseIndex = index;
    const modal = document.getElementById('expense-modal');
    modal.classList.remove('hidden');
    
    const participantsDiv = document.getElementById('exp-participants');
    participantsDiv.innerHTML = eventData.friends.map(f => `
        <div class="participant-item">
            <input type="checkbox" name="part-check" value="${f}" checked>
            <span>${f}</span>
        </div>
    `).join('');

    if (index !== null) {
        const exp = eventData.expenses[index];
        document.getElementById('exp-title').value = exp.title;
        document.getElementById('exp-amount').value = exp.amount;
        document.getElementById('exp-payer').value = exp.payer;
    }
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.add('hidden');
    document.getElementById('exp-title').value = "";
    document.getElementById('exp-amount').value = "";
}

function toggleAllFriends(status) {
    const checks = document.getElementsByName('part-check');
    checks.forEach(c => c.checked = status);
}

function saveExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const payer = document.getElementById('exp-payer').value;
    const participants = Array.from(document.getElementsByName('part-check'))
                        .filter(c => c.checked).map(c => c.value);

    if (!title || !amount || participants.length === 0) return alert("Completa todos los datos");

    const expense = { title, amount, payer, participants };

    if (editingExpenseIndex !== null) {
        eventData.expenses[editingExpenseIndex] = expense;
    } else {
        eventData.expenses.push(expense);
    }

    closeExpenseModal();
    calculateAll();
}

// --- CÁLCULOS ---
function calculateAll() {
    let balances = {};
    eventData.friends.forEach(f => balances[f] = 0);

    eventData.expenses.forEach(exp => {
        // Al que pagó se le suma el total
        balances[exp.payer] += exp.amount;
        // A cada participante se le resta su parte proporcional
        const share = exp.amount / exp.participants.length;
        exp.participants.forEach(p => {
            balances[p] -= share;
        });
    });

    renderExpenses();
    renderBalances(balances);
    renderSettlements(balances);
}

function renderExpenses() {
    const list = document.getElementById('expenses-list');
    list.innerHTML = eventData.expenses.map((exp, i) => `
        <div class="expense-card" onclick="openExpenseModal(${i})">
            <div>
                <strong>${exp.title}</strong><br>
                <small>Pagó: ${exp.payer}</small>
            </div>
            <div>${eventData.currency} ${exp.amount.toFixed(2)}</div>
        </div>
    `).join('');
}

function renderBalances(balances) {
    const list = document.getElementById('balances-list');
    list.innerHTML = eventData.friends.map(f => {
        const bal = balances[f];
        return `
            <div class="balance-item">
                <span>${f}</span>
                <span class="${bal >= 0 ? 'positive' : 'negative'}">
                    ${bal >= 0 ? '+' : ''}${bal.toFixed(2)} ${eventData.currency}
                </span>
            </div>
        `;
    }).join('');
}

function renderSettlements(balances) {
    const list = document.getElementById('settlements-list');
    let debtors = [];
    let creditors = [];

    // Separar los que deben de los que tienen que cobrar
    for (let f in balances) {
        if (balances[f] < -0.01) debtors.push({name: f, amount: Math.abs(balances[f])});
        if (balances[f] > 0.01) creditors.push({name: f, amount: balances[f]});
    }

    let html = "<h3>Sugerencias de pago</h3>";
    debtors.forEach(d => {
        creditors.forEach(c => {
            if (d.amount > 0 && c.amount > 0) {
                let payment = Math.min(d.amount, c.amount);
                html += `<div class="card"><strong>${d.name}</strong> debe transferir <strong>${payment.toFixed(2)} ${eventData.currency}</strong> a <strong>${c.name}</strong></div>`;
                d.amount -= payment;
                c.amount -= payment;
            }
        });
    });
    list.innerHTML = html;
}

// --- UTILS ---
function updateUIPayerList() {
    const select = document.getElementById('exp-payer');
    select.innerHTML = eventData.friends.map(f => `<option value="${f}">${f}</option>`).join('');
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}
