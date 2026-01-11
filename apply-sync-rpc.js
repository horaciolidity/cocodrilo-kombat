// apply-sync-rpc.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesaria para SECURITY DEFINER y crear funciones

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas en el .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🚀 Iniciando aplicación de la migración: sync_game_state');

    try {
        const migrationPath = path.resolve('supabase/migrations/20240111_sync_game_state_rpc.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📜 Ejecutando SQL...');

        // El cliente de Supabase no tiene un método directo .sql() en JS para migraciones complejas,
        // pero podemos usar rpc si tenemos una función que ejecute sql, o usar la API rest si está habilitada.
        // OJO: La mejor forma es usar el CLI de Supabase, pero este script intenta ayudar via API.

        // Intentar vía Postgres Query (si está habilitado el acceso remoto)
        // Sin embargo, por seguridad, la mayoría de los clientes no permiten ejecutar SQL arbitrario.

        console.log('\n⚠️ ADVERTENCIA: Este script requiere que ejecutes el SQL manualmente en el Dashboard de Supabase');
        console.log('para asegurar que los permisos de SECURITY DEFINER se apliquen correctamente.\n');
        console.log('Copia y pega el contenido del archivo:');
        console.log(`📍 ${migrationPath}\n`);
        console.log('En la sección de "SQL Editor" de tu proyecto Supabase.');

        // Abrir el archivo automágicamente si estamos en Windows
        if (process.platform === 'win32') {
            // Omitiendo ejecución de comandos por seguridad, solo informamos.
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

applyMigration();
