// ============================================
// Supabase Client (SDK v2)
// Placeholders are replaced at build time for production
// ============================================

let SUPABASE_URL = '__SUPABASE_URL__';
let SUPABASE_KEY = '__SUPABASE_KEY__';

// Fallback para desarrollo local si no se ha ejecutado el build script
if (SUPABASE_URL.startsWith('__') || !SUPABASE_URL) {
  SUPABASE_URL = 'https://mdrqiajschjdxntltdmt.supabase.co';
}
if (SUPABASE_KEY.startsWith('__') || !SUPABASE_KEY) {
  SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcnFpYWpzY2hqZHhudGx0ZG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMTQxMDQsImV4cCI6MjEwMTY5MDEwNH0.0tmJdaX68yvZdNLSHEzWqFcepwzEbm3K2wOfFw8-0yY';
}

// Initialize the Supabase client (SDK loaded via CDN in index.html)
const supabase = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// ============================================
// Authentication (M2)
// ============================================

async function signIn(email, password) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email, password) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

async function getProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('perfiles')
    .select('*, areas(nombre)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================
// Perfiles (Admin only — RLS enforces this)
// ============================================

async function fetchPerfiles() {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase
    .from('perfiles')
    .select('*, areas(nombre)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function updatePerfil(id, updates) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase
    .from('perfiles')
    .update(updates)
    .eq('id', id)
    .select('*, areas(nombre)')
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// ÁREAS CRUD
// ============================================

async function fetchAreas() {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createArea(nombre, descripcion = null) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase
    .from('areas')
    .insert({ nombre, descripcion })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateArea(id, nombre, descripcion = null) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const body = { nombre };
  if (descripcion !== null) body.descripcion = descripcion;
  const { data, error } = await supabase
    .from('areas')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteArea(id) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { error } = await supabase
    .from('areas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// USUARIOS CRUD
// ============================================

async function fetchUsuarios() {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, areas(nombre)')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createUsuario(nombre, area_id, email = null, telefono = null) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const body = { nombre, area_id };
  if (email) body.email = email;
  if (telefono) body.telefono = telefono;

  const { data, error } = await supabase
    .from('usuarios')
    .insert(body)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateUsuario(id, nombre, area_id, email = null, telefono = null) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const body = { nombre, area_id };
  if (email !== null) body.email = email;
  if (telefono !== null) body.telefono = telefono;

  const { data, error } = await supabase
    .from('usuarios')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteUsuario(id) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// TICKETS CRUD
// ============================================

async function fetchTickets() {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase
    .from('tickets')
    .select('*, usuarios(nombre, areas(nombre))')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function createTicket({ usuario_id, problema, dx, solucion, fecha, status, prioridad = 'media' }) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const body = {
    usuario_id,
    problema,
    fecha: fecha || new Date().toISOString().split('T')[0],
    prioridad
  };
  if (dx) body.dx = dx;
  if (solucion) body.solucion = solucion;
  if (status) body.status = status;

  const { data, error } = await supabase
    .from('tickets')
    .insert(body)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateTicket(id, updates) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteTicket(id) {
  if (!supabase) throw new Error('Cliente Supabase no inicializado');
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// CATEGORIAS (M1 - M5)
// ============================================

async function fetchCategorias() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });
  if (error) {
    console.warn('Categorías no disponibles:', error.message);
    return [];
  }
  return data || [];
}
