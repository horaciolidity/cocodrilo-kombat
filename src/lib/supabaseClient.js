// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación robusta de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = "❌ Variables de entorno de Supabase no encontradas. Verifica tu archivo .env";
  console.error(errorMsg);
  console.log("VITE_SUPABASE_URL:", supabaseUrl ? "✅ Configurada" : "❌ Faltante");
  console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Configurada" : "❌ Faltante");
  throw new Error(errorMsg);
}

// Configuración optimizada del cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'cocodrilo-kombat-game'
    }
  }
});

// Verificación de conexión al inicializar
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log("✅ Supabase conectado - Sesión activa:", session.user.email);
  } else {
    console.log("✅ Supabase conectado - Sin sesión activa");
  }
}).catch(error => {
  console.error("❌ Error conectando con Supabase:", error);
});

console.log("🎯 Cliente Supabase inicializado correctamente");

export default supabase;