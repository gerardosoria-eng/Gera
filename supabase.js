// ============================================
// Supabase Client (SDK v2)
// Placeholders are replaced at build time
// ============================================

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_KEY = '__SUPABASE_KEY__';

// Initialize the Supabase client (SDK loaded via CDN in index.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// Authentication
// ============================================

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*, areas(nombre)')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================
// Perfiles (Admin only — RLS enforces this)
// ============================================

async function fetchPerfiles() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*, areas(nombre)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function updatePerfil(id, updates) {
  const { data, error } = await supabase
    .from('perfiles')
    .update(updates)
    .eq('id', id)
    .select('*, areas(nombre)')
    .single();
  if (error) throw error;
  return data;
}

// ---- AREAS ----

async function fetchAreas() {
  const { data, error } = await supabase
    .from('areas')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

async function createArea(nombre) {
  const { data, error } = await supabase
    .from('areas')
    .insert({ nombre })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateArea(id, nombre) {
  const { data, error } = await supabase
    .from('areas')
    .update({ nombre })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteArea(id) {
  const { error } = await supabase
    .from('areas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---- USUARIOS ----

async function fetchUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, areas(nombre)')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

async function createUsuario(nombre, area_id) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({ nombre, area_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateUsuario(id, nombre, area_id) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ nombre, area_id })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteUsuario(id) {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---- TICKETS ----

async function fetchTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, usuarios(nombre, areas(nombre))')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function createTicket({ usuario_id, problema, dx, solucion, fecha, status }) {
  const body = { usuario_id, problema, fecha: fecha || new Date().toISOString().split('T')[0] };
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
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
