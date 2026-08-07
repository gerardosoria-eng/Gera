// ============================================
// Supabase REST API Client
// Placeholders are replaced at build time
// ============================================

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_KEY = '__SUPABASE_KEY__';

/**
 * Generic Supabase REST helper
 * @param {string} table - Table name
 * @param {object} options - { method, body, query }
 */
async function supabaseRequest(table, { method = 'GET', body = null, query = '', headers = {} } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;

  const defaultHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' ? 'return=representation' : 'return=representation',
  };

  const response = await fetch(url, {
    method,
    headers: { ...defaultHeaders, ...headers },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error (${response.status}): ${error}`);
  }

  // DELETE and some PATCHes may return empty body
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ---- AREAS ----

async function fetchAreas() {
  return supabaseRequest('areas', { query: '?select=*&order=nombre.asc' });
}

async function createArea(nombre) {
  const result = await supabaseRequest('areas', {
    method: 'POST',
    body: { nombre },
  });
  return result[0];
}

async function updateArea(id, nombre) {
  const result = await supabaseRequest('areas', {
    method: 'PATCH',
    body: { nombre },
    query: `?id=eq.${id}`,
  });
  return result[0];
}

async function deleteArea(id) {
  return supabaseRequest('areas', {
    method: 'DELETE',
    query: `?id=eq.${id}`,
  });
}

// ---- USUARIOS ----

async function fetchUsuarios() {
  return supabaseRequest('usuarios', {
    query: '?select=*,areas(nombre)&order=nombre.asc',
  });
}

async function createUsuario(nombre, area_id) {
  const result = await supabaseRequest('usuarios', {
    method: 'POST',
    body: { nombre, area_id },
  });
  return result[0];
}

async function updateUsuario(id, nombre, area_id) {
  const result = await supabaseRequest('usuarios', {
    method: 'PATCH',
    body: { nombre, area_id },
    query: `?id=eq.${id}`,
  });
  return result[0];
}

async function deleteUsuario(id) {
  return supabaseRequest('usuarios', {
    method: 'DELETE',
    query: `?id=eq.${id}`,
  });
}

// ---- TICKETS ----

async function fetchTickets() {
  return supabaseRequest('tickets', {
    query: '?select=*,usuarios(nombre,areas(nombre))&order=fecha.desc,created_at.desc',
  });
}

async function createTicket({ usuario_id, problema, dx, solucion, fecha, status }) {
  const body = { usuario_id, problema, fecha: fecha || new Date().toISOString().split('T')[0] };
  if (dx) body.dx = dx;
  if (solucion) body.solucion = solucion;
  if (status) body.status = status;

  const result = await supabaseRequest('tickets', {
    method: 'POST',
    body,
  });
  return result[0];
}

async function updateTicket(id, data) {
  const result = await supabaseRequest('tickets', {
    method: 'PATCH',
    body: data,
    query: `?id=eq.${id}`,
  });
  return result[0];
}

async function deleteTicket(id) {
  return supabaseRequest('tickets', {
    method: 'DELETE',
    query: `?id=eq.${id}`,
  });
}
