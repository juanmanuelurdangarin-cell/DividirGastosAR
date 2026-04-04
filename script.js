let eventData = {
    title: "",
    currency: "$",
    friends: [],
    expenses: []
};

// --- PERSISTENCIA (LOCAL STORAGE) ---
function saveToLocal() {
    localStorage.setItem('split_app_data', JSON.stringify(eventData));
}

function loadFromLocal() {
    const saved = localStorage.getItem('split_app_data');
    if (saved) {
        eventData = JSON.parse(saved);
        if (eventData.friends.length > 0) {
            document.getElementById('setup-screen').classList.add('hidden');
            document.getElementById('main-screen').classList.remove('hidden');
            document.getElementById('event-title-display').innerText = eventData.title;
            document.getElementById('currency-display').innerText = eventData.currency;
            updateUIPayerList();
            calculateAll();
        }
    }
}

// Cargar datos al iniciar
window.onload = loadFromLocal;

// --- GESTIÓN DE EVENTO ---
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

function startEvent() {
    if (eventData.friends.length < 2) return alert("Mínimo 2 participantes");
    eventData.title = document.getElementById('event-title').value || "Mi Evento";
    eventData.currency = document.getElementById('event-currency').value;
    
    document.getElementById('event-title-display').innerText = eventData.title;
    document.getElementById('currency-display').innerText = eventData.currency;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    
    updateUIPayerList();
    saveToLocal();
}

// --- FUNCIÓN COMPARTIR ---
async function shareResults() {
    let text = `📊 *Resumen de Gastos: ${eventData.title}*\n\n`;
    
    // Sacamos los saldos actuales
    const settlements = document.getElementById('settlements-list').innerText;
    if (settlements.includes("Sugerencias")) {
        text += `✅ *Deudas a saldar:*\n${settlements.replace("Sugerencias de pago", "")}`;
    } else {
        text += "No hay deudas pendientes.";
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: eventData.title,
                text: text
            });
        } catch (err) {
            console.log("Error al compartir");
        }
    } else {
        // Fallback: Copiar al portapapeles
        navigator.clipboard.writeText(text);
        alert("Resumen copiado al portapapeles para pegar en WhatsApp.");
    }
}

// --- RESTO DE LA LÓGICA (MODIFICADA PARA GUARDAR) ---
function saveExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const payer = document.getElementById('exp-payer').value;
    const participants = Array.from(document.getElementsByName('part-check'))
                        .filter(c => c.checked).map(c => c.value);

    if (!title || !amount || participants.length === 0) return alert("Completa todos los datos");

    const expense = { title, amount, payer, participants };
    eventData.expenses.push(expense);
    
    closeExpenseModal();
    calculateAll();
    saveToLocal(); // Guardamos después de cada gasto
}

// (Mantené las funciones renderExpenses, renderBalances, renderSettlements, etc. del código anterior)
