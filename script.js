document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const workerDashboard = document.getElementById('worker-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');

    // Login y Registro
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const btnShowRegister = document.getElementById('btn-show-register');
    const btnShowLogin = document.getElementById('btn-show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // App General
    const logoutBtn = document.getElementById('logout-button');
    const appTitle = document.getElementById('app-title');

    // Panel Trabajador
    const clockInBtn = document.getElementById('clock-in');
    const clockOutBtn = document.getElementById('clock-out');
    const workerStatus = document.getElementById('worker-status');
    const clockMessage = document.getElementById('clock-message');
    const myScheduleSpan = document.getElementById('my-schedule');
    const requestForm = document.getElementById('request-form');
    const workerMarksList = document.getElementById('worker-marks-list');
    const workerRequestsList = document.getElementById('worker-requests-list');

    // Panel Admin
    const adminRequestsList = document.getElementById('admin-requests-list');
    const adminRequestsHistoryList = document.getElementById('admin-requests-history-list'); // Nuevo
    const adminMarksList = document.getElementById('admin-marks-list');
    const noRequestsMsg = document.getElementById('no-requests-message');
    const adminUsersList = document.getElementById('admin-users-list');

    // --- 2. BASE DE DATOS (LOCAL STORAGE) ---
    let currentUser = null;

    let users = JSON.parse(localStorage.getItem('users')) || [
        { id: 1, name: 'Admin', password: '123', role: 'admin', workStart: '09:00', workEnd: '18:00' },
        { id: 2, name: 'Juan Pérez', password: '123', role: 'worker', workStart: '08:00', workEnd: '18:00' }
    ];
    
    let marcaciones = JSON.parse(localStorage.getItem('marcaciones')) || [];
    let solicitudes = JSON.parse(localStorage.getItem('solicitudes')) || [];

    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    // --- 3. FUNCIONES DE DATOS ---
    function saveData() {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('marcaciones', JSON.stringify(marcaciones));
        localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
    }

    // --- 4. LÓGICA DE CÁLCULO DE HORARIOS ---
    function calculateTimeDiff(markTimestamp, type, userId) {
        const user = users.find(u => u.id === userId);
        
        if (!user) return '<span class="tag-early">Usuario Eliminado</span>';
        if (!user.workStart || !user.workEnd) return '<span class="tag-early">Sin horario</span>';

        const markDate = new Date(markTimestamp);
        
        const scheduleTimeStr = (type === 'entrada') ? user.workStart : user.workEnd;
        const [hours, minutes] = scheduleTimeStr.split(':').map(Number);
        
        const scheduleDate = new Date(markDate);
        scheduleDate.setHours(hours, minutes, 0, 0);

        const diffMinutes = Math.floor((markDate - scheduleDate) / (1000 * 60));

        if (type === 'entrada') {
            if (diffMinutes > 5) {
                return `<span class="tag-late">Atraso: ${diffMinutes} min</span>`;
            } else if (diffMinutes < -30) {
                 return `<span class="tag-early">Llegada muy anticipada</span>`;
            } else {
                return `<span class="tag-ontime">A tiempo</span>`;
            }
        } else {
            if (diffMinutes > 0) {
                const hoursExtra = (diffMinutes / 60).toFixed(1);
                return `<span class="tag-extra">Extra: +${diffMinutes} min</span>`;
            } else if (diffMinutes < -5) { 
                return `<span class="tag-late">Salida anticipada (${Math.abs(diffMinutes)} min)</span>`;
            } else {
                return `<span class="tag-ontime">Salida puntual</span>`;
            }
        }
    }

    // --- 5. AUTENTICACIÓN ---

    btnShowRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    btnShowLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameIn = document.getElementById('login-name').value.trim(); 
        const passIn = document.getElementById('login-password').value.trim();

        const userFound = users.find(u => u.name === nameIn && u.password === passIn);

        if (userFound) {
            currentUser = userFound;
            loginForm.reset();
            initApp();
        } else {
            alert('Nombre o contraseña incorrectos.');
        }
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const role = document.getElementById('reg-role').value;

        if (users.some(u => u.name === name)) {
            alert('Ya existe una cuenta con este nombre.');
            return;
        }

        const newUser = {
            id: Date.now(),
            name: name,
            password: password,
            role: role,
            workStart: '09:00',
            workEnd: '18:00'
        };

        users.push(newUser);
        saveData();
        alert('Usuario registrado. Horario por defecto asignado: 09:00 - 18:00 (Admin puede cambiarlo).');
        
        registerForm.reset();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });

    function initApp() {
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        
        if (currentUser.role === 'admin') {
            appTitle.textContent = `Panel de Administración (${currentUser.name})`;
            adminDashboard.classList.remove('hidden');
            workerDashboard.classList.add('hidden');
            renderAdminView();
        } else {
            appTitle.textContent = `Panel de Trabajador (${currentUser.name})`;
            workerDashboard.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
            renderWorkerView();
        }
    }

    function logout() {
        currentUser = null;
        appView.classList.add('hidden');
        loginView.classList.remove('hidden');
        
        adminDashboard.classList.add('hidden');
        workerDashboard.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        registerContainer.classList.add('hidden');
    }

    // --- 6. LÓGICA DEL TRABAJADOR ---

    function renderWorkerView() {
        if (currentUser.workStart && currentUser.workEnd) {
            myScheduleSpan.textContent = `${currentUser.workStart} a ${currentUser.workEnd}`;
        } else {
            myScheduleSpan.textContent = "No asignado";
        }

        const ultimaMarca = marcaciones
            .filter(m => m.userId === currentUser.id)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (ultimaMarca && ultimaMarca.type === 'entrada') {
            workerStatus.textContent = 'En Turno';
            workerStatus.style.color = 'green';
            clockInBtn.disabled = true;
            clockOutBtn.disabled = false;
        } else {
            workerStatus.textContent = 'Fuera de Turno';
            workerStatus.style.color = 'red';
            clockInBtn.disabled = false;
            clockOutBtn.disabled = true;
        }
        clockMessage.textContent = '';
        
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
        clockMessage.textContent = `Entrada registrada.`;
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
        clockMessage.textContent = `Salida registrada.`;
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
            status: 'pendiente'
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
            .sort((a, b) => b.timestamp - a.timestamp)
            .forEach(m => {
                const statusHtml = calculateTimeDiff(m.timestamp, m.type, currentUser.id);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(m.timestamp).toLocaleString()}</td>
                    <td>${m.type === 'entrada' ? 'Entrada' : 'Salida'}</td>
                    <td>${statusHtml}</td>
                `;
                workerMarksList.appendChild(tr);
            });
    }

    function renderWorkerRequests() {
        workerRequestsList.innerHTML = '';
        solicitudes
            .filter(s => s.userId === currentUser.id)
            .sort((a, b) => b.id - a.id)
            .forEach(s => {
                const tr = document.createElement('tr');
                let statusColor = '#333';
                if(s.status === 'aprobado') statusColor = 'green';
                if(s.status === 'rechazado') statusColor = 'red';

                tr.innerHTML = `
                    <td>${s.type}</td>
                    <td>${s.startDate}</td>
                    <td>${s.endDate}</td>
                    <td style="color:${statusColor}; font-weight:bold;">${s.status.toUpperCase()}</td>
                `;
                workerRequestsList.appendChild(tr);
            });
    }

    // --- 7. LÓGICA DEL ADMINISTRADOR ---

    function renderAdminView() {
        renderAdminUsers(); 
        renderAdminRequests();
        renderAdminRequestHistory(); // Nueva función
        renderAdminMarks();
    }

    function renderAdminUsers() {
        adminUsersList.innerHTML = '';
        users.forEach(u => {
            // Cambio 1: Mostrar nombre de rol amigable
            const roleDisplay = (u.role === 'admin') ? 'Administrador' : 'Trabajador';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.name}</td>
                <td>${roleDisplay}</td>
                <td><input type="time" value="${u.workStart || '09:00'}" class="sched-start" data-id="${u.id}"></td>
                <td><input type="time" value="${u.workEnd || '18:00'}" class="sched-end" data-id="${u.id}"></td>
                <td><button class="btn-guardar btn-save-sched" data-id="${u.id}">Guardar</button></td>
                <td><button class="btn-delete btn-delete-user" data-id="${u.id}">Eliminar</button></td>
            `;
            
            tr.querySelector('.btn-save-sched').addEventListener('click', () => {
                const startVal = tr.querySelector('.sched-start').value;
                const endVal = tr.querySelector('.sched-end').value;
                updateUserSchedule(u.id, startVal, endVal);
            });

            tr.querySelector('.btn-delete-user').addEventListener('click', () => {
                handleDeleteUser(u.id);
            });

            adminUsersList.appendChild(tr);
        });
    }

    function handleDeleteUser(userId) {
        if (userId === currentUser.id) {
            alert("No puedes eliminar tu propia cuenta de administrador mientras estás conectado.");
            return;
        }

        const userToDelete = users.find(u => u.id === userId);
        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${userToDelete.name}"? Esta acción es irreversible.`)) {
            return;
        }

        users = users.filter(u => u.id !== userId);
        saveData();
        alert("Usuario eliminado correctamente.");
        renderAdminView();
    }

    function updateUserSchedule(userId, start, end) {
        const user = users.find(u => u.id === userId);
        if (user) {
            user.workStart = start;
            user.workEnd = end;
            saveData();
            alert(`Horario actualizado para ${user.name}`);
            renderAdminView(); 
        }
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
            const approveBtn = tr.querySelector('.btn-approve');
            const rejectBtn = tr.querySelector('.btn-reject');
            
            approveBtn.addEventListener('click', () => handleApproval(s.id, 'aprobado'));
            rejectBtn.addEventListener('click', () => handleApproval(s.id, 'rechazado'));
            
            adminRequestsList.appendChild(tr);
        });
    }

    // Cambio 2: Nueva función para renderizar historial
    function renderAdminRequestHistory() {
        adminRequestsHistoryList.innerHTML = '';
        // Filtramos todo lo que NO sea pendiente (es decir, aprobado o rechazado)
        const historial = solicitudes
            .filter(s => s.status !== 'pendiente')
            .sort((a, b) => b.id - a.id); // Más recientes primero

        historial.forEach(s => {
            const tr = document.createElement('tr');
            
            let color = '#333';
            if (s.status === 'aprobado') color = 'green';
            if (s.status === 'rechazado') color = 'red';

            tr.innerHTML = `
                <td>${s.name}</td>
                <td>${s.type}</td>
                <td>${s.startDate}</td>
                <td>${s.endDate}</td>
                <td style="color: ${color}; font-weight: bold;">${s.status.toUpperCase()}</td>
            `;
            adminRequestsHistoryList.appendChild(tr);
        });
    }

    function handleApproval(id, newStatus) {
        const solicitud = solicitudes.find(s => s.id === id);
        if (solicitud) {
            solicitud.status = newStatus;
            saveData();
            renderAdminView();
        }
    }

    function renderAdminMarks() {
        adminMarksList.innerHTML = '';
        marcaciones
            .sort((a, b) => b.timestamp - a.timestamp)
            .forEach(m => {
                const statusHtml = calculateTimeDiff(m.timestamp, m.type, m.userId);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${m.name}</td>
                    <td>${new Date(m.timestamp).toLocaleString()}</td>
                    <td>${m.type === 'entrada' ? 'Entrada' : 'Salida'}</td>
                    <td>${statusHtml}</td>
                `;
                adminMarksList.appendChild(tr);
            });
    }

    // --- 8. INICIALIZACIÓN DE EVENTOS ---
    logoutBtn.addEventListener('click', logout);
    clockInBtn.addEventListener('click', handleClockIn);
    clockOutBtn.addEventListener('click', handleClockOut);
    requestForm.addEventListener('submit', handleRequestSubmit);

});