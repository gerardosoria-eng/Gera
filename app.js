const formulario = document.getElementById('form-soporte');
const listaServicios = document.getElementById('lista-servicios');
const btnResumen = document.getElementById('btn-resumen');
const mensajeResumen = document.getElementById('mensaje-resumen');
const btnSubmit = formulario.querySelector('button[type="submit"]');

// 1. Cargar servicios y asegurar que tengan un ID (compatibilidad con el registro de Mirella)
let servicios = JSON.parse(localStorage.getItem('serviciosIT')) || [];
servicios = servicios.map(s => s.id ? s : { ...s, id: Date.now() + Math.floor(Math.random() * 1000) });
localStorage.setItem('serviciosIT', JSON.stringify(servicios));

let idEdicion = null; // Variable clave para saber si estamos editando o creando

mostrarServicios();

// 2. Guardar o Actualizar un servicio
formulario.addEventListener('submit', function(e) {
    e.preventDefault();

    const servicioData = {
        id: idEdicion ? idEdicion : Date.now(), // Crea un ID único basado en la hora actual
        fecha: document.getElementById('fecha').value,
        usuario: document.getElementById('usuario').value,
        area: document.getElementById('area').value,
        descripcion: document.getElementById('descripcion').value
    };

    if (idEdicion) {
        // MODO ACTUALIZAR
        const index = servicios.findIndex(s => s.id === idEdicion);
        servicios[index] = servicioData;
        idEdicion = null; // Limpiamos el modo edición
        btnSubmit.innerText = "Registrar Servicio";
        btnSubmit.style.backgroundColor = "#27ae60"; // Regresamos al verde original
    } else {
        // MODO GUARDAR NUEVO
        servicios.push(servicioData);
    }

    localStorage.setItem('serviciosIT', JSON.stringify(servicios)); 
    formulario.reset(); 
    mostrarServicios(); 
});

// 3. Mostrar los servicios en la tabla
function mostrarServicios() {
    listaServicios.innerHTML = ''; 
    const serviciosInvertidos = [...servicios].reverse(); 
    
    serviciosInvertidos.forEach(servicio => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td width="15%">${servicio.fecha}</td>
            <td width="20%">${servicio.usuario}</td>
            <td width="15%">${servicio.area}</td>
            <td width="35%">${servicio.descripcion}</td>
            <td width="15%">
                <button type="button" class="btn-editar" onclick="editarServicio(${servicio.id})" title="Editar">✏️</button>
                <button type="button" class="btn-eliminar" onclick="eliminarServicio(${servicio.id})" title="Eliminar">🗑️</button>
            </td>
        `;
        listaServicios.appendChild(fila);
    });
}

// 4. Función para Cargar los datos al formulario y Actualizar
window.editarServicio = function(id) {
    const servicio = servicios.find(s => s.id === id);
    if(servicio) {
        document.getElementById('fecha').value = servicio.fecha;
        document.getElementById('usuario').value = servicio.usuario;
        document.getElementById('area').value = servicio.area;
        document.getElementById('descripcion').value = servicio.descripcion;
        
        idEdicion = id; // Activamos el modo edición
        btnSubmit.innerText = "Actualizar Servicio";
        btnSubmit.style.backgroundColor = "#f39c12"; // Botón naranja
        window.scrollTo(0, 0); // Sube la pantalla al formulario automáticamente
    }
};

// 5. Función para Eliminar un registro
window.eliminarServicio = function(id) {
    if(confirm("¿Estás seguro de que deseas eliminar este registro?")) {
        servicios = servicios.filter(s => s.id !== id);
        localStorage.setItem('serviciosIT', JSON.stringify(servicios));
        mostrarServicios();
    }
};

// 6. Calcular el total de la semana (Lunes a Viernes)
btnResumen.addEventListener('click', function() {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); 
    
    const lunes = new Date(hoy);
    const ajusteLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    lunes.setDate(hoy.getDate() + ajusteLunes);
    lunes.setHours(0, 0, 0, 0);

    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);
    viernes.setHours(23, 59, 59, 999);

    let totalSemana = 0;
    servicios.forEach(serv => {
        const fechaServ = new Date(serv.fecha + 'T00:00:00'); 
        if (fechaServ >= lunes && fechaServ <= viernes) {
            totalSemana++;
        }
    });

    mensajeResumen.innerText = `Esta semana (Lunes a Viernes) has brindado ${totalSemana} servicios de soporte.`;
});