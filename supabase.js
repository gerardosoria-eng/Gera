// ============================================
// Supabase Client (SDK v2)
// Placeholders are replaced at build time for production
// ============================================

let SUPABASE_URL = '__SUPABASE_URL__';
let SUPABASE_KEY = '__SUPABASE_KEY__';

// Fallback para desarrollo local si no se ha ejecutado el build script
if (!SUPABASE_URL || SUPABASE_URL.startsWith('__')) {
  SUPABASE_URL = 'https://mdrqiajschjdxntltdmt.supabase.co';
}
if (!SUPABASE_KEY || SUPABASE_KEY.startsWith('__')) {
  SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcnFpYWpzY2hqZHhudGx0ZG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTQxMDQsImV4cCI6MjEwMTY5MDEwNH0.0tmJdaX68yvZdNLSHEzWqFcepwzEbm3K2wOfFw8-0yY';
}

// Inicializar cliente de Supabase
let supabaseClient = null;
try {
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.error('Error inicializando Supabase Client:', e);
}

// ============================================
// Authentication (M2)
// ============================================

async function signIn(email, password) {
  const client = supabaseClient || (window.supabase && window.supabase.auth ? window.supabase : null);
  if (!client) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email, password) {
  const client = supabaseClient || (window.supabase && window.supabase.auth ? window.supabase : null);
  if (!client) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const client = supabaseClient || (window.supabase && window.supabase.auth ? window.supabase : null);
  if (!client) throw new Error('Cliente Supabase no inicializado');
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  const client = supabaseClient || (window.supabase && window.supabase.auth ? window.supabase : null);
  if (!client) return null;
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  return session;
}

async function getProfile(userId) {
  const client = supabaseClient;
  if (!client) return null;
  const { data, error } = await client
    .from('perfiles')
    .select('*, areas(nombre)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function onAuthStateChange(callback) {
  const client = supabaseClient || (window.supabase && window.supabase.auth ? window.supabase : null);
  if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================
// Perfiles & Técnicos (Admin & Agentes)
// ============================================

async function fetchPerfiles() {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('perfiles')
    .select('*, areas(nombre)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function fetchTecnicos() {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('perfiles')
    .select('id, email, nombre_completo, rol')
    .in('rol', ['admin', 'tecnico', 'agente'])
    .order('email', { ascending: true });
  if (error) {
    console.warn('Error al obtener técnicos:', error.message);
    return [];
  }
  return data || [];
}

async function updatePerfil(id, updates) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('perfiles')
    .update(updates)
    .eq('id', id)
    .select('*, areas(nombre)')
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// ÁREAS CRUD (Centralizada en Sistemas)
// ============================================

async function fetchAreas() {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('areas')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createArea(nombre, descripcion = null) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('areas')
    .insert({ nombre, descripcion })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateArea(id, nombre, descripcion = null) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const body = { nombre };
  if (descripcion !== null) body.descripcion = descripcion;
  const { data, error } = await supabaseClient
    .from('areas')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteArea(id) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { error } = await supabaseClient
    .from('areas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// USUARIOS CRUD (Solicitantes y Departamentos)
// ============================================

async function fetchUsuarios() {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('*, areas(nombre)')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createUsuario(nombre, area_id = null, email = null, telefono = null, departamento = null) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const body = { nombre };
  if (area_id) body.area_id = area_id;
  if (email) body.email = email;
  if (telefono) body.telefono = telefono;
  if (departamento) body.departamento = departamento;

  const { data, error } = await supabaseClient
    .from('usuarios')
    .insert(body)
    .select('*, areas(nombre)')
    .single();
  if (error) throw error;
  return data;
}

async function updateUsuario(id, nombre, area_id = null, email = null, telefono = null, departamento = null) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const body = { nombre };
  if (area_id !== undefined) body.area_id = area_id;
  if (email !== null) body.email = email;
  if (telefono !== null) body.telefono = telefono;
  if (departamento !== null) body.departamento = departamento;

  const { data, error } = await supabaseClient
    .from('usuarios')
    .update(body)
    .eq('id', id)
    .select('*, areas(nombre)')
    .single();
  if (error) throw error;
  return data;
}

async function deleteUsuario(id) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { error } = await supabaseClient
    .from('usuarios')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// TICKETS CRUD & ASIGNACIÓN
// ============================================

async function fetchTickets() {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('tickets')
    .select(`
      *,
      usuarios (
        id,
        nombre,
        email,
        telefono,
        departamento,
        areas (id, nombre)
      ),
      asignado:perfiles!tickets_asignado_a_fkey (
        id,
        email,
        nombre_completo,
        rol
      )
    `)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    // Si falla el join específico con asignado, reintentar con consulta base
    console.warn('Consulta con join extendido falló, reintentando consulta estándar:', error.message);
    const fallback = await supabaseClient
      .from('tickets')
      .select('*, usuarios(*, areas(*))')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });
    if (fallback.error) throw fallback.error;
    return fallback.data || [];
  }
  return data || [];
}

async function createTicket({ usuario_id, problema, dx, solucion, fecha, status, prioridad = 'media', asignado_a = null, solicitante_perfil_id = null }) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const body = {
    usuario_id,
    problema,
    fecha: fecha || new Date().toISOString().split('T')[0],
    prioridad: prioridad || 'media',
    status: status || 'abierto'
  };
  if (dx) body.dx = dx;
  if (solucion) body.solucion = solucion;
  if (asignado_a) body.asignado_a = asignado_a;
  if (solicitante_perfil_id) body.solicitante_perfil_id = solicitante_perfil_id;

  const { data, error } = await supabaseClient
    .from('tickets')
    .insert(body)
    .select(`
      *,
      usuarios (
        id,
        nombre,
        email,
        telefono,
        departamento,
        areas (id, nombre)
      )
    `)
    .single();
  if (error) throw error;
  return data;
}

async function updateTicket(id, updates) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabaseClient
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      usuarios (
        id,
        nombre,
        email,
        telefono,
        departamento,
        areas (id, nombre)
      )
    `)
    .single();
  if (error) throw error;
  return data;
}

async function assignTicket(ticketId, tecnicoId) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const updates = {
    asignado_a: tecnicoId || null,
    status: tecnicoId ? 'asignado' : 'abierto'
  };
  return await updateTicket(ticketId, updates);
}

async function deleteTicket(id) {
  if (!supabaseClient) throw new Error('Cliente Supabase no inicializado');
  const { error } = await supabaseClient
    .from('tickets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// CATEGORIAS (M1 - M5)
// ============================================

async function fetchCategorias() {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('categorias')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Categorías no disponibles:', err.message);
    return [];
  }
}

// ============================================
// Exportar explícitamente a window
// ============================================
if (typeof window !== 'undefined') {
  window.supabaseClient = supabaseClient;
  window.signIn = signIn;
  window.signUp = signUp;
  window.signOut = signOut;
  window.getSession = getSession;
  window.getProfile = getProfile;
  window.onAuthStateChange = onAuthStateChange;
  window.fetchPerfiles = fetchPerfiles;
  window.fetchTecnicos = fetchTecnicos;
  window.updatePerfil = updatePerfil;
  window.fetchAreas = fetchAreas;
  window.createArea = createArea;
  window.updateArea = updateArea;
  window.deleteArea = deleteArea;
  window.fetchUsuarios = fetchUsuarios;
  window.createUsuario = createUsuario;
  window.updateUsuario = updateUsuario;
  window.deleteUsuario = deleteUsuario;
  window.fetchTickets = fetchTickets;
  window.createTicket = createTicket;
  window.updateTicket = updateTicket;
  window.assignTicket = assignTicket;
  window.deleteTicket = deleteTicket;
  window.fetchCategorias = fetchCategorias;
}
