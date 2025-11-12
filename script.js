document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Vistas
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
    const requestForm = document.getElementById('request-form');
    const workerMarksList = document.getElementById('worker-marks-list');
    const workerRequestsList = document.getElementById('worker-requests-list');

    // Panel Admin
    const adminRequestsList = document.getElementById('admin-requests-list');
    const adminMarksList = document.getElementById('admin-marks-list');
    const noRequestsMsg = document.getElementById('no-requests-message');

    // --- 2. BASE DE DATOS (LOCAL STORAGE) ---
    let currentUser = null;

    // Usuarios por defecto (Sin 'username', solo 'name' y 'password')
    let users = JSON.parse(localStorage.getItem('users')) || [
        { id: 1, name: 'Admin', password: '123', role: 'admin' },
        { id: 2, name: 'Juan Pérez', password: '123', role: 'worker' }
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

    // --- 4. AUTENTICACIÓN (LOGIN Y REGISTRO) ---

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

    // Manejar Login (Por Nombre Completo)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // 'login-name' ahora captura el Nombre Completo
        const nameIn = document.getElementById('login-name').value.trim(); 
        const passIn = document.getElementById('login-password').value.trim();

        // Buscamos coincidencia exacta del nombre
        const userFound = users.find(u => u.name === nameIn && u.password === passIn);

        if (userFound) {
            currentUser = userFound;
            loginForm.reset();
            initApp();
        } else {
            alert('Nombre o contraseña incorrectos.');
        }
    });

    // Manejar Registro (Por Nombre Completo)
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const role = document.getElementById('reg-role').value;

        // Validar que el Nombre no exista ya
        if (users.some(u => u.name === name)) {
            alert('Ya existe una cuenta con este nombre.');
            return;
        }

        const newUser = {
            id: Date.now(),
            name: name, // Usamos el nombre como identificador principal visual
            password: password,
            role: role
        };

        users.push(newUser);
        saveData();
        alert('Usuario registrado con éxito. Ahora puedes iniciar sesión con tu nombre.');
        
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

    // --- 5. LÓGICA DEL TRABAJADOR ---

    function renderWorkerView() {
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
            const approveBtn = tr.querySelector('.btn-approve');
            const rejectBtn = tr.querySelector('.btn-reject');
            
            approveBtn.addEventListener('click', () => handleApproval(s.id, 'aprobado'));
            rejectBtn.addEventListener('click', () => handleApproval(s.id, 'rechazado'));
            
            adminRequestsList.appendChild(tr);
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
    logoutBtn.addEventListener('click', logout);
    clockInBtn.addEventListener('click', handleClockIn);
    clockOutBtn.addEventListener('click', handleClockOut);
    requestForm.addEventListener('submit', handleRequestSubmit);

});