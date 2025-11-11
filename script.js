// Espera a que el DOM (la página HTML) esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Vistas
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const workerDashboard = document.getElementById('worker-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');

    // Botones Login/Logout
    const loginAdminBtn = document.getElementById('login-admin');
    const loginWorkerBtn = document.getElementById('login-worker');
    const logoutBtn = document.getElementById('logout-button');
    const appTitle = document.getElementById('app-title');

    // Panel Trabajador
    const clockInBtn = document.getElementById('clock-in');
    const clockOutBtn = document.getElementById('clock-out');
    const workerStatus = document.getElementById('worker-status');
    const clockMessage = document.getElementById('clock-message');
    const requestForm = document.getElementById('request-form');
    const workerMarksList = document.getElementById('worker-marks-list');
    const workerRequestsList = document.getElementById('worker-requests-list');

    // Panel Admin
    const adminRequestsList = document.getElementById('admin-requests-list');
    const adminMarksList = document.getElementById('admin-marks-list');
    const noRequestsMsg = document.getElementById('no-requests-message');

    // --- 2. BASE DE DATOS (SIMULADA CON LOCAL STORAGE) ---
    let currentUser = null;
    let users = JSON.parse(localStorage.getItem('users')) || [
        { id: 1, username: 'admin', role: 'admin', name: 'Admin' },
        { id: 2, username: 'worker', role: 'worker', name: 'Juan Pérez' }
        // Se pueden agregar más trabajadores
    ];
    let marcaciones = JSON.parse(localStorage.getItem('marcaciones')) || [];
    let solicitudes = JSON.parse(localStorage.getItem('solicitudes')) || [];

    // --- 3. FUNCIONES DE DATOS ---
    function saveData() {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('marcaciones', JSON.stringify(marcaciones));
        localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
    }

    // --- 4. LÓGICA DE NAVEGACIÓN Y SESIÓN ---

    // Simula el login
    function login(role) {
        if (role === 'admin') {
            currentUser = users.find(u => u.role === 'admin');
            appTitle.textContent = `Panel de Administración (${currentUser.name})`;
        } else {
            currentUser = users.find(u => u.role === 'worker'); // Usamos el primer trabajador
            appTitle.textContent = `Panel de Trabajador (${currentUser.name})`;
        }
        
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        renderDashboard();
    }

    function logout() {
        currentUser = null;
        appView.classList.add('hidden');
        loginView.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
        workerDashboard.classList.add('hidden');
    }

    // Muestra el panel correcto según el rol
    function renderDashboard() {
        if (!currentUser) return;

        if (currentUser.role === 'admin') {
            adminDashboard.classList.remove('hidden');
            workerDashboard.classList.add('hidden');
            renderAdminView();
        } else {
            workerDashboard.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
            renderWorkerView();
        }
    }

    // --- 5. LÓGICA DEL TRABAJADOR ---

    function renderWorkerView() {
        // Actualizar estado (Simplificado)
        const ultimaMarca = marcaciones
            .filter(m => m.userId === currentUser.id)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (ultimaMarca && ultimaMarca.type === 'entrada') {
            workerStatus.textContent = 'En Turno';
            clockInBtn.disabled = true;
            clockOutBtn.disabled = false;
        } else {
            workerStatus.textContent = 'Fuera de Turno';
            clockInBtn.disabled = false;
            clockOutBtn.disabled = true;
        }
        clockMessage.textContent = '';
        
        // Renderizar tablas
        renderWorkerMarks();
        renderWorkerRequests();
    }

    function handleClockIn() {
        const nuevaMarca = {
            id: Date.now(),
            userId: currentUser.id,
            name: currentUser.name,
            timestamp: Date.now(),
            type: 'entrada'
        };
        marcaciones.push(nuevaMarca);
        saveData();
        renderWorkerView();
        clockMessage.textContent = `Entrada marcada a las ${new Date(nuevaMarca.timestamp).toLocaleTimeString()}`;
    }

    function handleClockOut() {
        const nuevaMarca = {
            id: Date.now(),
            userId: currentUser.id,
            name: currentUser.name,
            timestamp: Date.now(),
            type: 'salida'
        };
        marcaciones.push(nuevaMarca);
        saveData();
        renderWorkerView();
        clockMessage.textContent = `Salida marcada a las ${new Date(nuevaMarca.timestamp).toLocaleTimeString()}`;
    }

    function handleRequestSubmit(e) {
        e.preventDefault();
        const newRequest = {
            id: Date.now(),
            userId: currentUser.id,
            name: currentUser.name,
            type: document.getElementById('request-type').value,
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value,
            reason: document.getElementById('reason').value,
            status: 'pendiente' // Estados: pendiente, aprobado, rechazado
        };

        solicitudes.push(newRequest);
        saveData();
        renderWorkerRequests();
        requestForm.reset();
        alert('Solicitud enviada con éxito.');
    }

    function renderWorkerMarks() {
        workerMarksList.innerHTML = '';
        marcaciones
            .filter(m => m.userId === currentUser.id)
            .sort((a, b) => b.timestamp - a.timestamp) // Más nuevas primero
            .forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(m.timestamp).toLocaleString()}</td>
                    <td>${m.type === 'entrada' ? 'Entrada' : 'Salida'}</td>
                `;
                workerMarksList.appendChild(tr);
            });
    }

    function renderWorkerRequests() {
        workerRequestsList.innerHTML = '';
        solicitudes
            .filter(s => s.userId === currentUser.id)
            .sort((a, b) => b.id - a.id) // Más nuevas primero
            .forEach(s => {
                const tr = document.createElement('tr');
                tr.className = `status-${s.status}`;
                tr.innerHTML = `
                    <td>${s.type}</td>
                    <td>${s.startDate}</td>
                    <td>${s.endDate}</td>
                    <td>${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</td>
                `;
                workerRequestsList.appendChild(tr);
            });
    }

    // --- 6. LÓGICA DEL ADMINISTRADOR ---

    function renderAdminView() {
        renderAdminRequests();
        renderAdminMarks();
    }

    function renderAdminRequests() {
        adminRequestsList.innerHTML = '';
        const pendientes = solicitudes.filter(s => s.status === 'pendiente');

        if (pendientes.length === 0) {
            noRequestsMsg.style.display = 'block';
        } else {
            noRequestsMsg.style.display = 'none';
        }

        pendientes.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>${s.type}</td>
                <td>${s.startDate}</td>
                <td>${s.endDate}</td>
                <td>${s.reason || 'N/A'}</td>
                <td>
                    <button class="btn-approve" data-id="${s.id}">Aprobar</button>
                    <button class="btn-reject" data-id="${s.id}">Rechazar</button>
                </td>
            `;
            tr.querySelector('.btn-approve').addEventListener('click', () => handleApproval(s.id, 'aprobado'));
            tr.querySelector('.btn-reject').addEventListener('click', () => handleApproval(s.id, 'rechazado'));
            adminRequestsList.appendChild(tr);
        });
    }

    function handleApproval(id, newStatus) {
        const solicitud = solicitudes.find(s => s.id === id);
        if (solicitud) {
            solicitud.status = newStatus;
            saveData();
            renderAdminView(); // Recarga la vista de admin
        }
    }

    function renderAdminMarks() {
        adminMarksList.innerHTML = '';
        marcaciones
            .sort((a, b) => b.timestamp - a.timestamp) // Más nuevas primero
            .forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${m.name}</td>
                    
                    <td>${new Date(m.timestamp).toLocaleString()}</td>
                    <td>${m.type === 'entrada' ? 'Entrada' : 'Salida'}</td>
                `;
                adminMarksList.appendChild(tr);
            });
    }

    // --- 7. INICIALIZACIÓN DE EVENTOS ---
    loginAdminBtn.addEventListener('click', () => login('admin'));
    loginWorkerBtn.addEventListener('click', () => login('worker'));
    logoutBtn.addEventListener('click', logout);
    
    clockInBtn.addEventListener('click', handleClockIn);
    clockOutBtn.addEventListener('click', handleClockOut);
    requestForm.addEventListener('submit', handleRequestSubmit);
});