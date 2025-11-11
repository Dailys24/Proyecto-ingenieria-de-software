// Espera a que el DOM (la página HTML) esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const movieForm = document.getElementById('movie-form');
    const movieIdInput = document.getElementById('movie-id');
    const titleInput = document.getElementById('title');
    const directorInput = document.getElementById('director');
    const yearInput = document.getElementById('year');
    const genreInput = document.getElementById('genre');
    const movieList = document.getElementById('movie-list');
    const emptyMessage = document.getElementById('empty-message');
    const btnCancel = document.getElementById('btn-cancel');

    // --- 2. DATOS ---
    // Carga las películas desde Local Storage o usa un array vacío
    let movies = JSON.parse(localStorage.getItem('movies')) || [];

    // --- 3. FUNCIONES PRINCIPALES ---

    /**
     * Guarda el array de películas en Local Storage
     */
    function saveMovies() {
        localStorage.setItem('movies', JSON.stringify(movies));
    }

    /**
     * Muestra (renderiza) la lista de películas en la tabla.
     * Esta es la función "READ" del CRUD.
     */
    function renderMovies() {
        // Limpia la tabla actual
        movieList.innerHTML = '';

        // Comprueba si hay películas
        if (movies.length === 0) {
            emptyMessage.style.display = 'block';
            return;
        }
        
        emptyMessage.style.display = 'none';

        // Recorre el array y crea una fila <tr> por cada película
        movies.forEach(movie => {
            const tr = document.createElement('tr');
            
            // Define el contenido HTML de la fila
            tr.innerHTML = `
                <td>${movie.title}</td>
                <td>${movie.director}</td>
                <td>${movie.year}</td>
                <td>${movie.genre}</td>
                <td>
                    <button class="btn-edit" data-id="${movie.id}">Editar</button>
                    <button class="btn-delete" data-id="${movie.id}">Borrar</button>
                </td>
            `;

            // Añade los event listeners a los botones de la fila
            tr.querySelector('.btn-edit').addEventListener('click', handleEdit);
            tr.querySelector('.btn-delete').addEventListener('click', handleDelete);

            // Añade la fila a la tabla
            movieList.appendChild(tr);
        });
    }

    /**
     * Maneja el envío del formulario (Crear y Actualizar)
     */
    function handleFormSubmit(event) {
        event.preventDefault(); // Evita que la página se recargue

        // Recoge los valores del formulario
        const id = movieIdInput.value;
        const title = titleInput.value.trim();
        const director = directorInput.value.trim();
        const year = yearInput.value.trim();
        const genre = genreInput.value.trim();

        // Validación (Punto extra del taller)
        if (!title || !director || !year || !genre) {
            alert('Todos los campos son obligatorios.');
            return;
        }

        if (id) {
            // --- Lógica de UPDATE (Actualizar) ---
            // Si hay un ID, estamos editando una película existente
            const movieIndex = movies.findIndex(movie => movie.id == id);
            if (movieIndex > -1) {
                movies[movieIndex] = { id: Number(id), title, director, year, genre };
            }
        } else {
            // --- Lógica de CREATE (Crear) ---
            // Si no hay ID, es una película nueva
            const newMovie = {
                // Usamos Date.now() como un ID único
                id: Date.now(), 
                title,
                director,
                year,
                genre
            };
            movies.push(newMovie);
        }

        // Guarda en Local Storage y actualiza la tabla
        saveMovies();
        renderMovies();
        
        // Resetea el formulario y el botón de cancelar
        resetForm();
    }

    /**
     * Carga los datos de una película en el formulario para editarla.
     * Esta es la preparación para "UPDATE".
     */
    function handleEdit(event) {
        const id = event.target.dataset.id;
        const movieToEdit = movies.find(movie => movie.id == id);

        if (movieToEdit) {
            // Rellena el formulario con los datos de la película
            movieIdInput.value = movieToEdit.id;
            titleInput.value = movieToEdit.title;
            directorInput.value = movieToEdit.director;
            yearInput.value = movieToEdit.year;
            genreInput.value = movieToEdit.genre;
            
            // Muestra el botón de cancelar
            btnCancel.style.display = 'block';
        }
    }

    /**
     * Borra una película de la lista.
     * Esta es la función "DELETE" del CRUD.
     */
    function handleDelete(event) {
        const id = event.target.dataset.id;
        
        // Pide confirmación antes de borrar
        if (confirm('¿Estás seguro de que quieres borrar esta película?')) {
            // Filtra el array, quitando la película con el ID seleccionado
            movies = movies.filter(movie => movie.id != id);
            
            // Guarda y actualiza la tabla
            saveMovies();
            renderMovies();
        }
    }

    /**
     * Resetea el formulario a su estado inicial
     */
    function resetForm() {
        movieForm.reset();
        movieIdInput.value = ''; // Limpia el ID oculto
        btnCancel.style.display = 'none'; // Oculta el botón de cancelar
    }


    // --- 4. INICIALIZACIÓN ---
    
    // Añade el listener al formulario
    movieForm.addEventListener('submit', handleFormSubmit);
    
    // Añade el listener al botón de cancelar
    btnCancel.addEventListener('click', resetForm);
    
    // Muestra la lista de películas al cargar la página por primera vez
    renderMovies();
});
