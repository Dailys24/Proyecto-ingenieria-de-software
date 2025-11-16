// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECCIÓN DE ELEMENTOS DEL DOM (Sin cambios) ---
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const workerDashboard = document.getElementById('worker-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const btnShowRegister = document.getElementById('btn-show-register');
    const btnShowLogin = document.getElementById('btn-show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-button');
    const appTitle = document.getElementById('app-title');
    const clockInBtn = document.getElementById('clock-in');
    const clockOutBtn = document.getElementById('clock-out');
    const workerStatus = document.getElementById('worker-status');
    const clockMessage = document.getElementById('clock-message');
    const myScheduleSpan = document.getElementById('my-schedule');
    const requestForm = document.getElementById('request-form');
    const workerMarksList = document.getElementById('worker-marks-list');
    const workerRequestsList = document.getElementById('worker-requests-list');
    const adminRequestsList = document.getElementById('admin-requests-list');
    const adminRequestsHistoryList = document.getElementById('admin-requests-history-list');
    const adminMarksList = document.getElementById('admin-marks-list');
    const noRequestsMsg = document.getElementById('no-requests-message');
    const adminUsersList = document.getElementById('admin-users-list');

    // --- 2. ESTADO DE LA APLICACIÓN (Ahora vacío, se carga de la NUBE) ---
    let currentUser = null;
    let users = [];
    let marcaciones = [];
    let solicitudes = [];

    // --- 3. FUNCIONES DE FIREBASE (NUEVO) ---
    
    // Función auxiliar para convertir datos de Firebase (mapDoc)
    // Firebase nos da un 'snapshot', lo convertimos a un objeto JS normal
    const mapDoc = (doc) => ({ id: doc.id, ...doc.data() });

    // Cargar todos los datos de la nube
    async function loadAllData() {
        try {
            // Cargar Usuarios
            const usersSnapshot = await db.collection('users').get();
            users = usersSnapshot.docs.map(mapDoc);
            
            // Cargar Marcaciones
            const marksSnapshot = await db.collection('marcaciones').get();
            marcaciones = marksSnapshot.docs.map(mapDoc);

            // Cargar Solicitudes
            const requestsSnapshot = await db.collection('solicitudes').get();
            solicitudes = requestsSnapshot.docs.map(mapDoc);

            // Si no hay usuarios (primera vez), creamos el admin
            if (users.length === 0) {
                await db.collection('users').add({
                    name: 'Admin',
                    password: '123',
                    role: 'admin',
                    workStart: '09:00',
                    workEnd: '18:00'
                });
                // Volvemos a cargar los usuarios para incluir el admin
                const usersSnapshotRetry = await db.collection('users').get();
                users = usersSnapshotRetry.docs.map(mapDoc);
            }

        } catch (error) {
            console.error("Error al cargar datos: ", error);
            alert("Error de conexión con la base de datos.");
        }
    }

    // --- 4. LÓGICA DE CÁLCULO DE HORARIOS (Sin cambios) ---
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
            if (diffMinutes > 5) return `<span class="tag-late">Atraso: ${diffMinutes} min</span>`;
            else if (diffMinutes < -30) return `<span class="tag-early">Llegada muy anticipada</span>`;
            else return `<span class="tag-ontime">A tiempo</span>`;
        } else {
            if (diffMinutes > 0) return `<span class="tag-extra">Extra: +${diffMinutes} min</span>`;
            else if (diffMinutes < -5) return `<span class="tag-late">Salida anticipada (${Math.abs(diffMinutes)} min)</span>`;
            else return `<span class="tag-ontime">Salida puntual</span>`;
        }
    }

    // --- 5. AUTENTICACIÓN (Actualizado a ASYNC) ---

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

    // Login (Ahora es async)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Cargamos datos frescos de la nube en cada intento de login
        await loadAllData(); 
        
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

    // Registro (Ahora es async y usa db.collection('users').add)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const role = document.getElementById('reg-role').value;

        // Validamos contra los datos ya cargados
        if (users.some(u => u.name === name)) {
            alert('Ya existe una cuenta con este nombre.');
            return;
        }

        const newUser = {
            name: name,
            password: password,
            role: role,
            workStart: '09:00',
            workEnd: '18:00'
        };

        try {
            // Guardamos el nuevo usuario en Firebase
            await db.collection('users').add(newUser);
            alert('Usuario registrado con éxito. Ahora puedes iniciar sesión.');
            
            // Refrescamos los datos locales
            await loadAllData();
            
            registerForm.reset();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        } catch (error) {
            console.error("Error al registrar: ", error);
            alert("Error al registrar usuario.");
        }
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

    // --- 6. LÓGICA DEL TRABAJADOR (Actualizado a ASYNC) ---

    // renderWorkerView() AHORA lee de las variables globales (users, marcaciones)
    function renderWorkerView() {
        // Recargamos el currentUser por si el admin cambió el horario
        const userActualizado = users.find(u => u.id === currentUser.id);
        if (userActualizado) {
            currentUser = userActualizado;
        }
        
        if (currentUser.workStart && currentUser.workEnd) {
            myScheduleSpan.textContent = `${currentUser.workStart} a ${currentUser.workEnd}`;
        } else {
            myScheduleSpan.textContent = "No asignado";
        }

        const misMarcas = marcaciones.filter(m => m.userId === currentUser.id);
        const ultimaMarca = misMarcas.sort((a, b) => b.timestamp - a.timestamp)[0];
        
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

    // handleClockIn (Ahora es async y usa db.collection('marcaciones').add)
    async function handleClockIn() {
        const nuevaMarca = {
            userId: currentUser.id, // Guardamos el ID del documento de Firebase
            name: currentUser.name,
            timestamp: Date.now(),
            type: 'entrada'
        };

        try {
            await db.collection('marcaciones').add(nuevaMarca);
            clockMessage.textContent = `Entrada registrada.`;
            // Recargamos todo y renderizamos
            await loadAllData();
            renderWorkerView();
        } catch (error) {
            console.error("Error al marcar entrada: ", error);
        }
    }

    // handleClockOut (Ahora es async)
    async function handleClockOut() {
        const nuevaMarca = {
            userId: currentUser.id,
            name: currentUser.name,
            timestamp: Date.now(),
            type: 'salida'
        };

        try {
            await db.collection('marcaciones').add(nuevaMarca);
            clockMessage.textContent = `Salida registrada.`;
            await loadAllData();
            renderWorkerView();
        } catch (error) {
            console.error("Error al marcar salida: ", error);
        }
    }

    // handleRequestSubmit (Ahora es async)
    async function handleRequestSubmit(e) {
        e.preventDefault();
        const newRequest = {
            userId: currentUser.id,
            name: currentUser.name,
            type: document.getElementById('request-type').value,
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value,
            reason: document.getElementById('reason').value,
            status: 'pendiente'
        };

        try {
            await db.collection('solicitudes').add(newRequest);
            alert('Solicitud enviada con éxito.');
            requestForm.reset();
            await loadAllData();
            renderWorkerRequests(); // Solo re-renderiza la tabla de solicitudes
        } catch (error) {
            console.error("Error al enviar solicitud: ", error);
        }
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
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) // Ordenamos por timestamp si existe
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

    // --- 7. LÓGICA DEL ADMINISTRADOR (Actualizado a ASYNC) ---

    // renderAdminView() lee de las variables globales
    function renderAdminView() {
        renderAdminUsers(); 
        renderAdminRequests();
        renderAdminRequestHistory();
        renderAdminMarks();
    }

    // #### FUNCIÓN MODIFICADA ####
    function renderAdminUsers() {
        adminUsersList.innerHTML = '';
        users.forEach(u => {
            const roleDisplay = (u.role === 'admin') ? 'Administrador' : 'Trabajador';
            const tr = document.createElement('tr');
            
            // HTML para la fila, incluyendo el nuevo <select>
            tr.innerHTML = `
                <td>${u.name}</td>
                <td>${roleDisplay}</td>
                <td>
                    <select class="predefined-schedule">
                        <option value="">Elegir jornada...</option>
                        <option value="fijo">Jornada Fija (09:00-18:00)</option>
                        <option value="rotativo">Turno Rotativo (07:00-15:00)</option>
                        <option value="flexible">Jornada Flexible (10:00-19:00)</option>
                    </select>
                </td>
                <td><input type="time" value="${u.workStart || '09:00'}" class="sched-start"></td>
                <td><input type="time" value="${u.workEnd || '18:00'}" class="sched-end"></td>
                <td><button class="btn-guardar btn-save-sched">Guardar</button></td>
                <td><button class="btn-delete btn-delete-user">Eliminar</button></td>
            `;
            
            // Asignamos eventos con el ID de Firebase
            tr.querySelector('.btn-save-sched').addEventListener('click', () => {
                const startVal = tr.querySelector('.sched-start').value;
                const endVal = tr.querySelector('.sched-end').value;
                updateUserSchedule(u.id, startVal, endVal, u.name); // Pasamos u.id
            });
            
            tr.querySelector('.btn-delete-user').addEventListener('click', () => {
                handleDeleteUser(u.id, u.name); // Pasamos u.id
            });

            // #### NUEVO EVENT LISTENER ####
            // Se asigna al <select> que acabamos de crear en esta fila
            tr.querySelector('.predefined-schedule').addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                
                // Buscamos los inputs que están EN LA MISMA FILA (tr)
                const startInput = tr.querySelector('.sched-start');
                const endInput = tr.querySelector('.sched-end');

                if (selectedValue === 'fijo') {
                    startInput.value = '09:00';
                    endInput.value = '18:00';
                } else if (selectedValue === 'rotativo') {
                    startInput.value = '07:00';
                    endInput.value = '15:00';
                } else if (selectedValue === 'flexible') {
                    startInput.value = '10:00';
                    endInput.value = '19:00';
                }
            });

            adminUsersList.appendChild(tr);
        });
    }
    // #### FIN DE FUNCIÓN MODIFICADA ####


    // handleDeleteUser (Ahora es async y usa db.collection('users').doc(userId).delete())
    async function handleDeleteUser(userId, name) {
        if (userId === currentUser.id) {
            alert("No puedes eliminar tu propia cuenta.");
            return;
        }
        if (!confirm(`¿Estás seguro de que deseas eliminar a "${name}"?`)) {
            return;
        }

        try {
            await db.collection('users').doc(userId).delete();
            alert("Usuario eliminado.");
            await loadAllData(); // Recargamos todo
            renderAdminView(); // Re-renderizamos la vista de admin
        } catch (error) {
            console.error("Error al eliminar usuario: ", error);
        }
    }

    // updateUserSchedule (Ahora es async y usa .update())
    async function updateUserSchedule(userId, start, end, name) {
        try {
            await db.collection('users').doc(userId).update({
                workStart: start,
                workEnd: end
            });
            alert(`Horario actualizado para ${name}`);
            await loadAllData();
            renderAdminView();
        } catch (error) {
            console.error("Error al actualizar horario: ", error);
        }
    }

    function renderAdminRequests() {
        adminRequestsList.innerHTML = '';
        const pendientes = solicitudes.filter(s => s.status === 'pendiente');
        noRequestsMsg.style.display = pendientes.length === 0 ? 'block' : 'none';

        pendientes.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>${s.type}</td>
                <td>${s.startDate}</td>
                <td>${s.endDate}</td>
                <td>${s.reason || 'N/A'}</td>
                <td>
                    <button class="btn-approve">Aprobar</button>
                    <button class="btn-reject">Rechazar</button>
                </td>
            `;
            tr.querySelector('.btn-approve').addEventListener('click', () => handleApproval(s.id, 'aprobado'));
            tr.querySelector('.btn-reject').addEventListener('click', () => handleApproval(s.id, 'rechazado'));
            adminRequestsList.appendChild(tr);
        });
    }

    function renderAdminRequestHistory() {
        adminRequestsHistoryList.innerHTML = '';
        solicitudes
            .filter(s => s.status !== 'pendiente')
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(s => {
                const tr = document.createElement('tr');
                let color = s.status === 'aprobado' ? 'green' : 'red';
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

    // handleApproval (Ahora es async y usa .update())
    async function handleApproval(solicitudId, newStatus) {
        try {
            await db.collection('solicitudes').doc(solicitudId).update({
                status: newStatus
            });
            await loadAllData();
            renderAdminView();
        } catch (error) {
            console.error("Error al procesar solicitud: ", error);
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

    // --- 9. CARGA INICIAL (NUEVO) ---
    // Carga los datos de la nube en cuanto la página esté lista
    // para que el login funcione.
    loadAllData();
});