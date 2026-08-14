// ============================================
// App State
// ============================================
let areas = [];
let usuarios = [];
let tickets = [];

let editingTicketId = null;
let editingUsuarioId = null;
let editingAreaId = null;

// ============================================
// DOM References
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Tabs
const tabNav = $('#tab-nav');
const tabBtns = $$('.tab-btn');
const tabPanels = $$('.tab-panel');

// Ticket form
const formTicket = $('#form-ticket');
const ticketFecha = $('#ticket-fecha');
const ticketUsuario = $('#ticket-usuario');
const ticketStatus = $('#ticket-status');
const ticketProblema = $('#ticket-problema');
const ticketDx = $('#ticket-dx');
const ticketSolucion = $('#ticket-solucion');
const btnTicketSubmit = $('#btn-ticket-submit');
const btnTicketCancel = $('#btn-ticket-cancel');
const ticketFormTitle = $('#ticket-form-title');

// Ticket table
const ticketsTbody = $('#tickets-tbody');
const ticketsLoading = $('#tickets-loading');
const ticketsTableWrapper = $('#tickets-table-wrapper');
const ticketsEmpty = $('#tickets-empty');

// Stats
const statTotal = $('#stat-total');
const statOpen = $('#stat-open');
const statClosed = $('#stat-closed');
const weekLabel = $('#week-label');

// PDF
const btnPdf = $('#btn-pdf');

// Usuario form
const formUsuario = $('#form-usuario');
const usuarioNombre = $('#usuario-nombre');
const usuarioArea = $('#usuario-area');
const btnUsuarioSubmit = $('#btn-usuario-submit');
const btnUsuarioCancel = $('#btn-usuario-cancel');
const usuarioFormTitle = $('#usuario-form-title');
const usuariosList = $('#usuarios-list');
const usuariosLoading = $('#usuarios-loading');
const usuariosEmpty = $('#usuarios-empty');

// Area form
const formArea = $('#form-area');
const areaNombre = $('#area-nombre');
const btnAreaSubmit = $('#btn-area-submit');
const btnAreaCancel = $('#btn-area-cancel');
const areaFormTitle = $('#area-form-title');
const areasList = $('#areas-list');
const areasLoading = $('#areas-loading');
const areasEmpty = $('#areas-empty');

// Badges
const badgeTickets = $('#badge-tickets');
const badgeUsuarios = $('#badge-usuarios');
const badgeAreas = $('#badge-areas');

// Modal
const modalOverlay = $('#modal-ticket-detail');
const modalCloseDetail = $('#modal-close-detail');
const modalDetailBody = $('#modal-detail-body');

// Toast
const toastContainer = $('#toast-container');

// Theme Toggle
const themeToggle = $('#theme-toggle');
const themeIcon = $('#theme-icon');
const themeLabel = $('#theme-label');

// ============================================
// Init
// ============================================
(async function init() {
  // Initialize theme from localStorage
  initTheme();

  // Set default date to today
  ticketFecha.value = new Date().toISOString().split('T')[0];
  updateWeekLabel();

  // Setup event listeners
  setupTabs();
  setupForms();
  setupModal();
  setupThemeToggle();

  // Load all data
  await Promise.all([loadAreas(), loadUsuarios(), loadTickets()]);
})();

// ============================================
// Tab Navigation
// ============================================
function setupTabs() {
  tabNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    const tab = btn.dataset.tab;

    tabBtns.forEach((b) => b.classList.remove('active'));
    tabPanels.forEach((p) => p.classList.remove('active'));

    btn.classList.add('active');
    $(`#panel-${tab}`).classList.add('active');
  });
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================================
// Week Helpers
// ============================================
function getWeekBounds() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday };
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

function updateWeekLabel() {
  const { monday, friday } = getWeekBounds();
  const fmt = (d) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  weekLabel.innerHTML = `Semana: <strong>${fmt(monday)} — ${fmt(friday)}</strong>`;
}

// ============================================
// AREAS CRUD
// ============================================
async function loadAreas() {
  try {
    areas = await fetchAreas();
    renderAreas();
    populateAreaSelects();
    badgeAreas.textContent = areas.length;
  } catch (err) {
    console.error('Error loading areas:', err);
    showToast('Error al cargar áreas', 'error');
  } finally {
    areasLoading.style.display = 'none';
  }
}

function renderAreas() {
  if (areas.length === 0) {
    areasList.style.display = 'none';
    areasEmpty.style.display = 'block';
    return;
  }

  areasEmpty.style.display = 'none';
  areasList.style.display = 'block';
  areasList.innerHTML = areas.map((a) => `
    <div class="list-item">
      <div class="list-item-info">
        <span class="list-item-name">${escapeHtml(a.nombre)}</span>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editArea('${a.id}')" title="Editar">✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="removeArea('${a.id}')" title="Eliminar">🗑️</button>
      </div>
    </div>
  `).join('');
}

function populateAreaSelects() {
  const options = areas.map((a) => `<option value="${a.id}">${escapeHtml(a.nombre)}</option>`).join('');
  const defaultOption = '<option value="">Seleccionar área...</option>';
  usuarioArea.innerHTML = defaultOption + options;
}

function setupAreaForm() {
  formArea.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = areaNombre.value.trim();
    if (!nombre) return;

    try {
      if (editingAreaId) {
        await updateArea(editingAreaId, nombre);
        showToast('Área actualizada');
        cancelAreaEdit();
      } else {
        await createArea(nombre);
        showToast('Área agregada');
      }
      formArea.reset();
      await loadAreas();
      // Refresh usuarios since they show area names
      await loadUsuarios();
    } catch (err) {
      console.error('Error saving area:', err);
      showToast('Error al guardar área', 'error');
    }
  });

  btnAreaCancel.addEventListener('click', cancelAreaEdit);
}

function cancelAreaEdit() {
  editingAreaId = null;
  areaFormTitle.textContent = 'Agregar Área';
  btnAreaSubmit.textContent = 'Agregar Área';
  btnAreaCancel.style.display = 'none';
  formArea.reset();
}

window.editArea = function (id) {
  const area = areas.find((a) => a.id === id);
  if (!area) return;

  editingAreaId = id;
  areaNombre.value = area.nombre;
  areaFormTitle.textContent = 'Editar Área';
  btnAreaSubmit.textContent = 'Actualizar Área';
  btnAreaCancel.style.display = 'block';

  // Switch to areas tab
  activateTab('areas');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.removeArea = async function (id) {
  if (!confirm('¿Eliminar esta área? Se eliminarán también los usuarios y tickets asociados.')) return;

  try {
    await deleteArea(id);
    showToast('Área eliminada');
    await Promise.all([loadAreas(), loadUsuarios(), loadTickets()]);
  } catch (err) {
    console.error('Error deleting area:', err);
    showToast('Error al eliminar área', 'error');
  }
};

// ============================================
// USUARIOS CRUD
// ============================================
async function loadUsuarios() {
  try {
    usuarios = await fetchUsuarios();
    renderUsuarios();
    populateUsuarioSelects();
    badgeUsuarios.textContent = usuarios.length;
  } catch (err) {
    console.error('Error loading usuarios:', err);
    showToast('Error al cargar usuarios', 'error');
  } finally {
    usuariosLoading.style.display = 'none';
  }
}

function renderUsuarios() {
  if (usuarios.length === 0) {
    usuariosList.style.display = 'none';
    usuariosEmpty.style.display = 'block';
    return;
  }

  usuariosEmpty.style.display = 'none';
  usuariosList.style.display = 'block';
  usuariosList.innerHTML = usuarios.map((u) => `
    <div class="list-item">
      <div class="list-item-info">
        <span class="list-item-name">${escapeHtml(u.nombre)}</span>
        <span class="list-item-meta">${u.areas ? escapeHtml(u.areas.nombre) : 'Sin área'}</span>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="editUsuario('${u.id}')" title="Editar">✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="removeUsuario('${u.id}')" title="Eliminar">🗑️</button>
      </div>
    </div>
  `).join('');
}

function populateUsuarioSelects() {
  const options = usuarios.map((u) => {
    const areaName = u.areas ? u.areas.nombre : '';
    return `<option value="${u.id}">${escapeHtml(u.nombre)}${areaName ? ` (${escapeHtml(areaName)})` : ''}</option>`;
  }).join('');
  const defaultOption = '<option value="">Seleccionar usuario...</option>';
  ticketUsuario.innerHTML = defaultOption + options;
}

function setupUsuarioForm() {
  formUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = usuarioNombre.value.trim();
    const area_id = usuarioArea.value;
    if (!nombre || !area_id) return;

    try {
      if (editingUsuarioId) {
        await updateUsuario(editingUsuarioId, nombre, area_id);
        showToast('Usuario actualizado');
        cancelUsuarioEdit();
      } else {
        await createUsuario(nombre, area_id);
        showToast('Usuario agregado');
      }
      formUsuario.reset();
      await loadUsuarios();
    } catch (err) {
      console.error('Error saving usuario:', err);
      showToast('Error al guardar usuario', 'error');
    }
  });

  btnUsuarioCancel.addEventListener('click', cancelUsuarioEdit);
}

function cancelUsuarioEdit() {
  editingUsuarioId = null;
  usuarioFormTitle.textContent = 'Agregar Usuario';
  btnUsuarioSubmit.textContent = 'Agregar Usuario';
  btnUsuarioCancel.style.display = 'none';
  formUsuario.reset();
}

window.editUsuario = function (id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;

  editingUsuarioId = id;
  usuarioNombre.value = usuario.nombre;
  usuarioArea.value = usuario.area_id;
  usuarioFormTitle.textContent = 'Editar Usuario';
  btnUsuarioSubmit.textContent = 'Actualizar Usuario';
  btnUsuarioCancel.style.display = 'block';

  activateTab('usuarios');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.removeUsuario = async function (id) {
  if (!confirm('¿Eliminar este usuario? Se eliminarán también sus tickets.')) return;

  try {
    await deleteUsuario(id);
    showToast('Usuario eliminado');
    await Promise.all([loadUsuarios(), loadTickets()]);
  } catch (err) {
    console.error('Error deleting usuario:', err);
    showToast('Error al eliminar usuario', 'error');
  }
};

// ============================================
// TICKETS CRUD
// ============================================
async function loadTickets() {
  try {
    tickets = await fetchTickets();
    renderTickets();
    updateStats();
    badgeTickets.textContent = tickets.length;
  } catch (err) {
    console.error('Error loading tickets:', err);
    showToast('Error al cargar tickets', 'error');
  } finally {
    ticketsLoading.style.display = 'none';
  }
}

function renderTickets() {
  if (tickets.length === 0) {
    ticketsTableWrapper.style.display = 'none';
    ticketsEmpty.style.display = 'block';
    return;
  }

  ticketsEmpty.style.display = 'none';
  ticketsTableWrapper.style.display = 'block';

  ticketsTbody.innerHTML = tickets.map((t) => {
    const userName = t.usuarios ? t.usuarios.nombre : 'Desconocido';
    const areaName = t.usuarios && t.usuarios.areas ? t.usuarios.areas.nombre : '—';
    const statusLabel = { abierto: 'Abierto', en_progreso: 'En progreso', cerrado: 'Cerrado' };

    return `
      <tr>
        <td>${formatDateShort(t.fecha)}</td>
        <td>${escapeHtml(userName)}</td>
        <td>${escapeHtml(areaName)}</td>
        <td class="td-description" title="${escapeHtml(t.problema)}">${escapeHtml(t.problema)}</td>
        <td><span class="status-badge status-${t.status}">${statusLabel[t.status] || t.status}</span></td>
        <td class="td-actions">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="viewTicket('${t.id}')" title="Ver detalle">👁️</button>
          <button class="btn btn-secondary btn-sm btn-icon" onclick="editTicket('${t.id}')" title="Editar">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="removeTicket('${t.id}')" title="Eliminar">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateStats() {
  const { monday, friday } = getWeekBounds();

  let weekTotal = 0;
  let openCount = 0;
  let closedCount = 0;

  tickets.forEach((t) => {
    const d = new Date(t.fecha + 'T00:00:00');
    if (d >= monday && d <= friday) weekTotal++;
    if (t.status === 'abierto' || t.status === 'en_progreso') openCount++;
    if (t.status === 'cerrado') closedCount++;
  });

  statTotal.textContent = weekTotal;
  statOpen.textContent = openCount;
  statClosed.textContent = closedCount;
}

function setupTicketForm() {
  formTicket.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      usuario_id: ticketUsuario.value,
      problema: ticketProblema.value.trim(),
      dx: ticketDx.value.trim() || null,
      solucion: ticketSolucion.value.trim() || null,
      fecha: ticketFecha.value,
      status: ticketStatus.value,
    };

    if (!data.usuario_id || !data.problema || !data.fecha) return;

    try {
      if (editingTicketId) {
        await updateTicket(editingTicketId, data);
        showToast('Ticket actualizado');
        cancelTicketEdit();
      } else {
        await createTicket(data);
        showToast('Ticket registrado');
      }
      formTicket.reset();
      ticketFecha.value = new Date().toISOString().split('T')[0];
      ticketStatus.value = 'abierto';
      await loadTickets();
    } catch (err) {
      console.error('Error saving ticket:', err);
      showToast('Error al guardar ticket', 'error');
    }
  });

  btnTicketCancel.addEventListener('click', cancelTicketEdit);
}

function cancelTicketEdit() {
  editingTicketId = null;
  ticketFormTitle.textContent = 'Nuevo Ticket';
  btnTicketSubmit.textContent = 'Registrar Ticket';
  btnTicketCancel.style.display = 'none';
  formTicket.reset();
  ticketFecha.value = new Date().toISOString().split('T')[0];
  ticketStatus.value = 'abierto';
}

window.editTicket = function (id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  editingTicketId = id;
  ticketFecha.value = ticket.fecha;
  ticketUsuario.value = ticket.usuario_id;
  ticketStatus.value = ticket.status;
  ticketProblema.value = ticket.problema;
  ticketDx.value = ticket.dx || '';
  ticketSolucion.value = ticket.solucion || '';

  ticketFormTitle.textContent = 'Editar Ticket';
  btnTicketSubmit.textContent = 'Actualizar Ticket';
  btnTicketCancel.style.display = 'block';

  activateTab('tickets');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.viewTicket = function (id) {
  const t = tickets.find((tk) => tk.id === id);
  if (!t) return;

  const userName = t.usuarios ? t.usuarios.nombre : 'Desconocido';
  const areaName = t.usuarios && t.usuarios.areas ? t.usuarios.areas.nombre : '—';
  const statusLabel = { abierto: 'Abierto', en_progreso: 'En progreso', cerrado: 'Cerrado' };

  modalDetailBody.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div>
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Fecha</div>
        <div>${formatDateFull(t.fecha)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Usuario</div>
          <div>${escapeHtml(userName)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Área</div>
          <div>${escapeHtml(areaName)}</div>
        </div>
      </div>
      <div>
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Estado</div>
        <span class="status-badge status-${t.status}">${statusLabel[t.status] || t.status}</span>
      </div>
      <div>
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Problema</div>
        <div style="white-space:pre-wrap;">${escapeHtml(t.problema)}</div>
      </div>
      <div>
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Diagnóstico</div>
        <div style="white-space:pre-wrap;">${t.dx ? escapeHtml(t.dx) : '<span style="color:var(--text-muted);">Sin diagnóstico</span>'}</div>
      </div>
      <div>
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Solución</div>
        <div style="white-space:pre-wrap;">${t.solucion ? escapeHtml(t.solucion) : '<span style="color:var(--text-muted);">Sin solución</span>'}</div>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');
};

window.removeTicket = async function (id) {
  if (!confirm('¿Eliminar este ticket?')) return;

  try {
    await deleteTicket(id);
    showToast('Ticket eliminado');
    await loadTickets();
  } catch (err) {
    console.error('Error deleting ticket:', err);
    showToast('Error al eliminar ticket', 'error');
  }
};

// ============================================
// Modal
// ============================================
function setupModal() {
  modalCloseDetail.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });
}

// ============================================
// PDF Generation
// ============================================
function setupPdf() {
  btnPdf.addEventListener('click', generateWeeklyPdf);
}

function generateWeeklyPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const { monday, friday } = getWeekBounds();
  const fmtDate = (d) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  // Filter tickets for this week
  const weekTickets = tickets.filter((t) => {
    const d = new Date(t.fecha + 'T00:00:00');
    return d >= monday && d <= friday;
  });

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Reporte Semanal de Soporte IT', 14, 22);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text(`Periodo: ${fmtDate(monday)} — ${fmtDate(friday)}`, 14, 30);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 36);
  doc.text(`Total de tickets: ${weekTickets.length}`, 14, 42);

  doc.setDrawColor(200);
  doc.line(14, 46, 196, 46);

  if (weekTickets.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(150);
    doc.text('No se registraron tickets esta semana.', 14, 56);
  } else {
    const tableData = weekTickets.map((t) => {
      const userName = t.usuarios ? t.usuarios.nombre : 'Desconocido';
      const areaName = t.usuarios && t.usuarios.areas ? t.usuarios.areas.nombre : '—';
      const statusLabel = { abierto: 'Abierto', en_progreso: 'En progreso', cerrado: 'Cerrado' };
      return [
        t.fecha,
        userName,
        areaName,
        t.problema,
        t.dx || '—',
        t.solucion || '—',
        statusLabel[t.status] || t.status,
      ];
    });

    doc.autoTable({
      startY: 50,
      head: [['Fecha', 'Usuario', 'Área', 'Problema', 'Diagnóstico', 'Solución', 'Estado']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [108, 99, 255], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 20 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
        6: { cellWidth: 20 },
      },
      margin: { left: 14, right: 14 },
    });
  }

  const fileName = `reporte_soporte_${monday.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  showToast('Reporte PDF generado');
}

// ============================================
// Tab Helper
// ============================================
function activateTab(tabName) {
  tabBtns.forEach((b) => b.classList.remove('active'));
  tabPanels.forEach((p) => p.classList.remove('active'));

  const btn = $(`[data-tab="${tabName}"]`);
  const panel = $(`#panel-${tabName}`);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

// ============================================
// Utilities
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// Setup all forms
// ============================================
function setupForms() {
  setupAreaForm();
  setupUsuarioForm();
  setupTicketForm();
  setupPdf();
}

// ============================================
// Theme Toggle (Dark / Light)
// ============================================
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'light') {
    themeIcon.textContent = '☀️';
    themeLabel.textContent = 'Claro';
  } else {
    themeIcon.textContent = '🌙';
    themeLabel.textContent = 'Oscuro';
  }
}

function setupThemeToggle() {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
    showToast(`Tema ${next === 'dark' ? 'oscuro' : 'claro'} activado`);
  });
}