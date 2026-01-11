// Script to apply YouTube mission migration to Supabase
// Run with: node apply-youtube-mission.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
// O configúralas como variables de entorno
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'TU_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'TU_SERVICE_ROLE_KEY';

if (SUPABASE_URL === 'TU_SUPABASE_URL' || SUPABASE_SERVICE_KEY === 'TU_SERVICE_ROLE_KEY') {
    console.error('❌ Error: Debes configurar las credenciales de Supabase');
    console.log('');
    console.log('Opción 1: Edita este archivo y reemplaza los valores');
    console.log('Opción 2: Ejecuta con variables de entorno:');
    console.log('  VITE_SUPABASE_URL=tu_url SUPABASE_SERVICE_KEY=tu_key node apply-youtube-mission.js');
    console.log('');
    console.log('Opción 3: Copia y pega el SQL directamente en Supabase SQL Editor:');
    console.log('  supabase/migrations/20240111_add_youtube_mission.sql');
    process.exit(1);
}

// Crear cliente con service role key para ejecutar migraciones
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    try {
        console.log('🚀 Aplicando migración de YouTube...');

        // Leer el archivo SQL
        const sqlPath = join(__dirname, 'supabase', 'migrations', '20240111_add_youtube_mission.sql');
        const sql = readFileSync(sqlPath, 'utf-8');

        console.log('📄 SQL a ejecutar:');
        console.log(sql);
        console.log('');

        // Ejecutar la migración
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // Si no existe la función exec_sql, intentar insertar directamente
            console.log('⚠️  Función exec_sql no disponible, insertando directamente...');

            const { data: insertData, error: insertError } = await supabase
                .from('game_missions')
                .upsert({
                    id: 'youtube_subscribe_main',
                    name: 'Suscríbete al Canal',
                    description: 'Suscríbete al canal de YouTube de Cocodrilo Kombat para ganar recompensas',
                    requirement_type: 'social_follow',
                    requirement_value: 1,
                    requirement_metadata: {
                        url: 'https://youtube.com/@cocodrilokombat',
                        actionText: 'Ir a YouTube'
                    },
                    reward_coins: 5000,
                    reward_xp: 100,
                    reward_card_id: null,
                    icon_name: 'Youtube',
                    category: 'Social',
                    validation_type: 'youtube_actions',
                    youtube_url: 'https://youtube.com/@cocodrilokombat',
                    video_actions: {
                        subscribe: true,
                        like: false,
                        comment: false,
                        follow: false
                    }
                }, {
                    onConflict: 'id'
                });

            if (insertError) {
                throw insertError;
            }

            console.log('✅ Misión de YouTube insertada exitosamente!');
            console.log('📊 Datos:', insertData);
        } else {
            console.log('✅ Migración aplicada exitosamente!');
            console.log('📊 Resultado:', data);
        }

        // Verificar que la misión existe
        const { data: mission, error: checkError } = await supabase
            .from('game_missions')
            .select('*')
            .eq('id', 'youtube_subscribe_main')
            .single();

        if (checkError) {
            throw checkError;
        }

        console.log('');
        console.log('✅ Verificación exitosa - Misión encontrada:');
        console.log('   ID:', mission.id);
        console.log('   Nombre:', mission.name);
        console.log('   Recompensa:', mission.reward_coins, 'monedas +', mission.reward_xp, 'XP');
        console.log('   URL:', mission.youtube_url);
        console.log('');
        console.log('🎉 ¡Listo! La misión ya está disponible en la app.');

    } catch (error) {
        console.error('❌ Error aplicando migración:', error);
        console.log('');
        console.log('💡 Solución alternativa:');
        console.log('   1. Abre Supabase Dashboard → SQL Editor');
        console.log('   2. Copia el contenido de: supabase/migrations/20240111_add_youtube_mission.sql');
        console.log('   3. Pégalo y ejecuta en el SQL Editor');
        process.exit(1);
    }
}

applyMigration();
