// ============================================
// SISTEMA DE TICKETS DE SOPORTE IT - APP CONTROLLER
// ============================================

// State
let currentUser = null;
let currentProfile = null;

let areas = [];
let usuarios = [];
let tickets = [];
let perfiles = [];

let editingTicketId = null;
let editingUsuarioId = null;
let editingAreaId = null;

// ============================================
// DOM References
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Screens
const loginScreen = $('#login-screen');
const appContainer = $('#app-container');

// Auth Form Elements
const formLogin = $('#form-login');
const loginEmail = $('#login-email');
const loginPassword = $('#login-password');
const loginError = $('#login-error');
const btnLogin = $('#btn-login');
const btnLoginText = $('#btn-login-text');
const btnLoginSpinner = $('#btn-login-spinner');

const loginDivider = $('.login-divider');
const btnShowRegister = $('#btn-show-register');

const formRegister = $('#form-register');
const registerEmail = $('#register-email');
const registerPassword = $('#register-password');
const registerPasswordConfirm = $('#register-password-confirm');
const registerError = $('#register-error');
const btnRegister = $('#btn-register');
const btnRegisterText = $('#btn-register-text');
const btnRegisterSpinner = $('#btn-register-spinner');
const btnBackLogin = $('#btn-back-login');

// Header & Session
const sessionEmail = $('#session-email');
const sessionRoleBadge = $('#session-role-badge');
const btnLogout = $('#btn-logout');

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

// Admin panel
const adminTbody = $('#admin-tbody');
const adminLoading = $('#admin-loading');
const adminTableWrapper = $('#admin-table-wrapper');
const adminEmpty = $('#admin-empty');
const modalAdminEdit = $('#modal-admin-edit');
const modalCloseAdmin = $('#modal-close-admin');
const formAdminEdit = $('#form-admin-edit');
const adminEditEmail = $('#admin-edit-email');
const adminEditRol = $('#admin-edit-rol');
const adminEditArea = $('#admin-edit-area');
const adminEditId = $('#admin-edit-id');
const btnAdminEditCancel = $('#btn-admin-edit-cancel');

// Badges
const badgeTickets = $('#badge-tickets');
const badgeUsuarios = $('#badge-usuarios');
const badgeAreas = $('#badge-areas');

// Modal ticket
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
// Initialization & Auth Flow
// ============================================
(async function init() {
  initTheme();
  ticketFecha.value = new Date().toISOString().split('T')[0];
  updateWeekLabel();

  // Setup UI event listeners
  setupAuthEvents();
  setupTabs();
  setupForms();
  setupModal();
  setupAdminModal();
  setupThemeToggle();

  // Monitor auth state changes
  onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      await handleAuthenticated(session.user);
    } else {
      handleUnauthenticated();
    }
  });

  // Check initial session
  try {
    const session = await getSession();
    if (session && session.user) {
      await handleAuthenticated(session.user);
    } else {
      handleUnauthenticated();
    }
  } catch (err) {
    console.warn('No active session or error checking session:', err);
    handleUnauthenticated();
  }
})();

// ============================================
// Auth Handlers (M2)
// ============================================
function setupAuthEvents() {
  // Toggle between Login and Register
  btnShowRegister.addEventListener('click', () => {
    formLogin.style.display = 'none';
    loginDivider.style.display = 'none';
    btnShowRegister.style.display = 'none';
    formRegister.style.display = 'block';
    hideErrors();
  });

  btnBackLogin.addEventListener('click', () => {
    formRegister.style.display = 'none';
    formLogin.style.display = 'block';
    loginDivider.style.display = 'block';
    btnShowRegister.style.display = 'block';
    hideErrors();
  });

  // Handle Login submission
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrors();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    if (!email || !password) return;

    setLoginLoading(true);

    try {
      const data = await signIn(email, password);
      if (data && data.user) {
        showToast('¡Sesión iniciada correctamente!');
        await handleAuthenticated(data.user);
      }
    } catch (err) {
      console.error('Login error:', err);
      loginError.textContent = formatAuthError(err.message);
      loginError.style.display = 'block';
    } finally {
      setLoginLoading(false);
    }
  });

  // Handle Register submission
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrors();

    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirmPassword = registerPasswordConfirm.value;

    if (password !== confirmPassword) {
      registerError.textContent = 'Las contraseñas no coinciden.';
      registerError.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      registerError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      registerError.style.display = 'block';
      return;
    }

    setRegisterLoading(true);

    try {
      const data = await signUp(email, password);
      showToast('¡Cuenta creada con éxito!');

      if (data && data.session && data.session.user) {
        await handleAuthenticated(data.session.user);
      } else {
        // Requires email verification or manual login
        showToast('Registro exitoso. Ya puedes iniciar sesión.', 'success');
        formRegister.reset();
        formRegister.style.display = 'none';
        formLogin.style.display = 'block';
        loginDivider.style.display = 'block';
        btnShowRegister.style.display = 'block';
        loginEmail.value = email;
      }
    } catch (err) {
      console.error('Register error:', err);
      registerError.textContent = formatAuthError(err.message);
      registerError.style.display = 'block';
    } finally {
      setRegisterLoading(false);
    }
  });

  // Handle Logout
  btnLogout.addEventListener('click', async () => {
    try {
      await signOut();
      showToast('Sesión cerrada');
      handleUnauthenticated();
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Error al cerrar sesión', 'error');
    }
  });
}

function hideErrors() {
  loginError.style.display = 'none';
  registerError.style.display = 'none';
}

function setLoginLoading(loading) {
  btnLogin.disabled = loading;
  btnLoginText.style.display = loading ? 'none' : 'inline';
  btnLoginSpinner.style.display = loading ? 'inline-block' : 'none';
}

function setRegisterLoading(loading) {
  btnRegister.disabled = loading;
  btnRegisterText.style.display = loading ? 'none' : 'inline';
  btnRegisterSpinner.style.display = loading ? 'inline-block' : 'none';
}

function formatAuthError(msg) {
  if (!msg) return 'Ocurrió un error. Intenta nuevamente.';
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('User already registered')) return 'Este correo ya se encuentra registrado.';
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener mínimo 6 caracteres.';
  if (msg.includes('Email not confirmed')) return 'Por favor confirma tu correo electrónico antes de entrar.';
  return msg;
}

async function handleAuthenticated(user) {
  currentUser = user;

  // Retrieve user profile
  try {
    currentProfile = await getProfile(user.id);
  } catch (e) {
    console.warn('No se pudo cargar el perfil específico:', e);
    currentProfile = { rol: 'usuario', email: user.email };
  }

  // Update session bar UI
  sessionEmail.textContent = user.email;
  const rol = (currentProfile && currentProfile.rol) ? currentProfile.rol : 'usuario';
  sessionRoleBadge.textContent = rol === 'admin' ? '👑 Admin' : rol === 'agente' ? '🛠️ Agente' : '👤 Usuario';
  sessionRoleBadge.className = `session-role-badge role-${rol}`;

  // Role permissions
  const isAdmin = rol === 'admin';
  $$('.admin-only').forEach((el) => {
    el.style.display = isAdmin ? '' : 'none';
  });

  // Switch screens
  loginScreen.style.display = 'none';
  appContainer.style.display = 'block';

  // Load fresh application data
  await Promise.all([loadAreas(), loadUsuarios(), loadTickets()]);

  if (isAdmin) {
    await loadPerfiles();
  }
}

function handleUnauthenticated() {
  currentUser = null;
  currentProfile = null;
  loginScreen.style.display = 'flex';
  appContainer.style.display = 'none';
  formLogin.reset();
  formRegister.reset();
  hideErrors();
}

// ============================================
// Tab Navigation
// ============================================
function setupTabs() {
  tabNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    const tab = btn.dataset.tab;
    activateTab(tab);

    if (tab === 'admin' && currentProfile && currentProfile.rol === 'admin') {
      loadPerfiles();
    }
  });
}

function activateTab(tabName) {
  tabBtns.forEach((b) => b.classList.remove('active'));
  tabPanels.forEach((p) => p.classList.remove('active'));

  const btn = $(`[data-tab="${tabName}"]`);
  const panel = $(`#panel-${tabName}`);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> <span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
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
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function formatDateFull(dateStr) {
  if (!dateStr) return '—';
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
    areasLoading.style.display = 'flex';
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

  if (adminEditArea) {
    adminEditArea.innerHTML = '<option value="">Sin área (acceso general)</option>' + options;
  }
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
    usuariosLoading.style.display = 'flex';
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
// TICKETS CRUD (M1)
// ============================================
async function loadTickets() {
  try {
    ticketsLoading.style.display = 'flex';
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
    const statusMap = {
      abierto: 'Abierto',
      asignado: 'Asignado',
      en_progreso: 'En progreso',
      en_espera: 'En espera',
      resuelto: 'Resuelto',
      cerrado: 'Cerrado'
    };

    return `
      <tr>
        <td>${formatDateShort(t.fecha)}</td>
        <td>${escapeHtml(userName)}</td>
        <td>${escapeHtml(areaName)}</td>
        <td class="td-description" title="${escapeHtml(t.problema)}">${escapeHtml(t.problema)}</td>
        <td><span class="status-badge status-${t.status}">${statusMap[t.status] || t.status}</span></td>
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
    if (t.status === 'abierto' || t.status === 'asignado' || t.status === 'en_progreso' || t.status === 'en_espera') openCount++;
    if (t.status === 'cerrado' || t.status === 'resuelto') closedCount++;
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
  const statusMap = {
    abierto: 'Abierto',
    asignado: 'Asignado',
    en_progreso: 'En progreso',
    en_espera: 'En espera',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado'
  };

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
        <span class="status-badge status-${t.status}">${statusMap[t.status] || t.status}</span>
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
// ADMIN PANEL (M2)
// ============================================
async function loadPerfiles() {
  if (!currentUser || (currentProfile && currentProfile.rol !== 'admin')) return;

  try {
    adminLoading.style.display = 'flex';
    perfiles = await fetchPerfiles();
    renderPerfiles();
  } catch (err) {
    console.error('Error loading perfiles:', err);
    showToast('Error al cargar cuentas de acceso', 'error');
  } finally {
    adminLoading.style.display = 'none';
  }
}

function renderPerfiles() {
  if (perfiles.length === 0) {
    adminTableWrapper.style.display = 'none';
    adminEmpty.style.display = 'block';
    return;
  }

  adminEmpty.style.display = 'none';
  adminTableWrapper.style.display = 'block';

  adminTbody.innerHTML = perfiles.map((p) => {
    const areaName = p.areas ? p.areas.nombre : 'Acceso general';
    const rolMap = { admin: 'Administrador', agente: 'Agente IT', usuario: 'Usuario' };
    const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : '—';

    return `
      <tr>
        <td>${escapeHtml(p.email)}</td>
        <td><span class="session-role-badge role-${p.rol}">${rolMap[p.rol] || p.rol}</span></td>
        <td>${escapeHtml(areaName)}</td>
        <td>${dateStr}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editPerfil('${p.id}')">Editar</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.editPerfil = function (id) {
  const p = perfiles.find((item) => item.id === id);
  if (!p) return;

  adminEditId.value = p.id;
  adminEditEmail.value = p.email;
  adminEditRol.value = p.rol;
  adminEditArea.value = p.area_id || '';

  modalAdminEdit.classList.add('active');
};

function setupAdminModal() {
  modalCloseAdmin.addEventListener('click', () => modalAdminEdit.classList.remove('active'));
  btnAdminEditCancel.addEventListener('click', () => modalAdminEdit.classList.remove('active'));

  modalAdminEdit.addEventListener('click', (e) => {
    if (e.target === modalAdminEdit) modalAdminEdit.classList.remove('active');
  });

  formAdminEdit.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = adminEditId.value;
    const rol = adminEditRol.value;
    const area_id = adminEditArea.value || null;

    try {
      await updatePerfil(id, { rol, area_id });
      showToast('Cuenta actualizada con éxito');
      modalAdminEdit.classList.remove('active');
      await loadPerfiles();
    } catch (err) {
      console.error('Error updating perfil:', err);
      showToast('Error al actualizar cuenta', 'error');
    }
  });
}

// ============================================
// Modals & PDF
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

function setupPdf() {
  btnPdf.addEventListener('click', generateWeeklyPdf);
}

function generateWeeklyPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('Biblioteca PDF no cargada', 'error');
    return;
  }

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
      const statusMap = {
        abierto: 'Abierto',
        asignado: 'Asignado',
        en_progreso: 'En progreso',
        en_espera: 'En espera',
        resuelto: 'Resuelto',
        cerrado: 'Cerrado'
      };
      return [
        t.fecha,
        userName,
        areaName,
        t.problema,
        t.dx || '—',
        t.solucion || '—',
        statusMap[t.status] || t.status,
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
// Utilities & Theme
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setupForms() {
  setupAreaForm();
  setupUsuarioForm();
  setupTicketForm();
  setupPdf();
}

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