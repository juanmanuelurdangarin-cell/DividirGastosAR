let eventData = {
    title: "",
    currency: "$",
    friends: [],
    expenses: []
};

let editingIndex = null;

// CARGAR DATOS AL INICIAR
window.onload = () => {
    const saved = localStorage.getItem('divideGastosData');
    if (saved) {
        eventData = JSON.parse(saved);
        if (eventData.friends.length > 0) {
            renderFriendsList();
            updateUIPayerList();
            showMainScreen();
            calculateAll();
        }
    }
};

function saveToLocal() {
    localStorage.setItem('divideGastosData', JSON.stringify(eventData));
}

function resetApp() {
    if (confirm("¿Estás seguro de que querés borrar todo el evento?")) {
        localStorage.removeItem('divideGastosData');
        location.reload();
    }
}

// CONFIGURACIÓN
function addFriend() {
    const input = document.getElementById('friend-name');
    const name = input.value.trim();
    if (name && !eventData.friends.includes(name)) {
        eventData.friends.push(name);
        renderFriendsList();
        input.value = "";
        saveToLocal();
    }
}

function renderFriendsList() {
    const list = document.getElementById('friends-list');
    list.innerHTML = eventData.friends.map(f => `<li><i class="fas fa-user"></i> ${f}</li>`).join('');
}

function startEvent() {
    if (eventData.friends.length < 2) return alert("Agregá al menos 2 personas");
    eventData.title = document.getElementById('event-title').value || "Mi Juntada";
    eventData.currency = document.getElementById('event-currency').value;
    showMainScreen();
    saveToLocal();
}

function showMainScreen() {
    document.getElementById('event-title-display').innerText = eventData.title;
    document.getElementById('currency-display').innerText = eventData.currency;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    updateUIPayerList();
}

// GESTIÓN DE GASTOS
function openExpenseModal(index = null) {
    editingIndex = index;
    const modal = document.getElementById('expense-modal');
    modal.classList.remove('hidden');
    
    const partDiv = document.getElementById('exp-participants');
    partDiv.innerHTML = eventData.friends.map(f => `
        <label class="participant-item">
            <input type="checkbox" name="part-check" value="${f}" checked>
            <span>${f}</span>
        </label>
    `).join('');

    if (index !== null) {
        const exp = eventData.expenses[index];
        document.getElementById('modal-title').innerText = "Editar Gasto";
        document.getElementById('exp-title').value = exp.title;
        document.getElementById('exp-amount').value = exp.amount;
        document.getElementById('exp-payer').value = exp.payer;
        
        const checks = document.getElementsByName('part-check');
        checks.forEach(c => c.checked = exp.participants.includes(c.value));
    } else {
        document.getElementById('modal-title').innerText = "Agregar Gasto";
        document.getElementById('exp-title').value = "";
        document.getElementById('exp-amount').value = "";
    }
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.add('hidden');
}

function toggleAllFriends(status) {
    document.getElementsByName('part-check').forEach(c => c.checked = status);
}

function saveExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const payer = document.getElementById('exp-payer').value;
    const participants = Array.from(document.getElementsByName('part-check'))
                        .filter(c => c.checked).map(c => c.value);

    if (!title || isNaN(amount) || participants.length === 0) return alert("Completá todos los campos correctamente");

    const expense = { title, amount, payer, participants };

    if (editingIndex !== null) eventData.expenses[editingIndex] = expense;
    else eventData.expenses.push(expense);

    saveToLocal();
    calculateAll();
    closeExpenseModal();
}

// CÁLCULOS
function calculateAll() {
    let balances = {};
    eventData.friends.forEach(f => balances[f] = 0);

    eventData.expenses.forEach(exp => {
        balances[exp.payer] += exp.amount;
        const share = exp.amount / exp.participants.length;
        exp.participants.forEach(p => balances[p] -= share);
    });

    renderExpenses();
    renderBalances(balances);
    renderSettlements(balances);
}

function renderExpenses() {
    const list = document.getElementById('expenses-list');
    list.innerHTML = eventData.expenses.length ? eventData.expenses.map((exp, i) => `
        <div class="expense-card" onclick="openExpenseModal(${i})">
            <div><strong>${exp.title}</strong><br><small>Pagó: ${exp.payer}</small></div>
            <div style="text-align:right"><strong>${eventData.currency} ${exp.amount.toFixed(2)}</strong></div>
        </div>
    `).join('') : '<p style="text-align:center; padding:20px;">No hay gastos cargados aún.</p>';
}

function renderBalances(balances) {
    const list = document.getElementById('balances-list');
    list.innerHTML = eventData.friends.map(f => `
        <div class="balance-item">
            <span>${f}</span>
            <span class="${balances[f] >= 0 ? 'positive' : 'negative'}">
                ${balances[f] >= 0 ? '+' : ''}${balances[f].toFixed(2)} ${eventData.currency}
            </span>
        </div>
    `).join('');
}

function renderSettlements(balances) {
    const list = document.getElementById('settlements-list');
    let debtors = [], creditors = [];
    for (let f in balances) {
        if (balances[f] < -0.01) debtors.push({name: f, amount: Math.abs(balances[f])});
        if (balances[f] > 0.01) creditors.push({name: f, amount: balances[f]});
    }

    let html = "<h3>¿Cómo saldar deudas?</h3>";
    debtors.forEach(d => {
        creditors.forEach(c => {
            if (d.amount > 0 && c.amount > 0) {
                let pay = Math.min(d.amount, c.amount);
                html += `<div class="card">💸 <b>${d.name}</b> le paga <b>${pay.toFixed(2)} ${eventData.currency}</b> a <b>${c.name}</b></div>`;
                d.amount -= pay; c.amount -= pay;
            }
        });
    });
    list.innerHTML = (debtors.length && creditors.length) ? html : '<p style="text-align:center;">¡Todos están a mano! No hay deudas.</p>';
}

// UTILIDADES
function updateUIPayerList() {
    const select = document.getElementById('exp-payer');
    select.innerHTML = eventData.friends.map(f => `<option value="${f}">${f}</option>`).join('');
}

function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

async function shareResults() {
    const settlements = document.getElementById('settlements-list').innerText;
    let text = `📊 *Resumen de ${eventData.title}*\n\n${settlements}\n\n_Enviado desde DivideGastos_`;
    
    if (navigator.share) {
        try { await navigator.share({ title: eventData.title, text: text }); } 
        catch (e) { console.log(e); }
    } else {
        navigator.clipboard.writeText(text);
        alert("¡Resumen copiado al portapapeles!");
    }
}
