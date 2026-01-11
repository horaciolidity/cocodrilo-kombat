#!/usr/bin/env node

/**
 * Script simple para aplicar la migración de YouTube a Supabase
 * Este script inserta directamente la misión sin necesitar service role key
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   🐊 Cocodrilo Kombat - Aplicar Misión de YouTube        ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Este script te ayudará a aplicar la migración de YouTube.');
console.log('');
console.log('📋 OPCIONES:');
console.log('');
console.log('1️⃣  OPCIÓN RECOMENDADA - Supabase Dashboard:');
console.log('   • Abre: https://supabase.com/dashboard');
console.log('   • Ve a: SQL Editor');
console.log('   • Copia y pega el contenido de:');
console.log('     supabase/migrations/20240111_add_youtube_mission.sql');
console.log('   • Click en "Run"');
console.log('');
console.log('2️⃣  OPCIÓN ALTERNATIVA - Desde el Admin Panel:');
console.log('   • Abre la app en: https://cocodrilo-kombat.vercel.app');
console.log('   • Inicia sesión como admin');
console.log('   • Ve a: Admin Panel → Content → Missions Editor');
console.log('   • Edita cualquier misión y configúrala así:');
console.log('');
console.log('     Nombre: Suscríbete al Canal');
console.log('     Descripción: Suscríbete al canal de YouTube...');
console.log('     Recompensa: 5000 monedas');
console.log('     Tipo: YouTube (Suscribir/Like/Comentar)');
console.log('     URL: https://youtube.com/@cocodrilokombat');
console.log('     ✓ Marcar: Suscribirse');
console.log('');
console.log('3️⃣  VERIFICAR SI YA EXISTE:');
console.log('   • Abre la app');
console.log('   • Ve a: Misiones');
console.log('   • Busca: "Suscríbete al Canal"');
console.log('');

rl.question('¿Deseas ver el SQL completo? (s/n): ', (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('SQL A EJECUTAR EN SUPABASE:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log(`INSERT INTO public.game_missions (
  id,
  name,
  description,
  requirement_type,
  requirement_value,
  requirement_metadata,
  reward_coins,
  reward_xp,
  icon_name,
  category,
  validation_type,
  youtube_url,
  video_actions
) VALUES (
  'youtube_subscribe_main',
  'Suscríbete al Canal',
  'Suscríbete al canal de YouTube de Cocodrilo Kombat para ganar recompensas',
  'social_follow',
  1,
  '{"url": "https://youtube.com/@cocodrilokombat", "actionText": "Ir a YouTube"}'::jsonb,
  5000,
  100,
  'Youtube',
  'Social',
  'youtube_actions',
  'https://youtube.com/@cocodrilokombat',
  '{"subscribe": true, "like": false, "comment": false, "follow": false}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirement_metadata = EXCLUDED.requirement_metadata,
  reward_coins = EXCLUDED.reward_coins,
  reward_xp = EXCLUDED.reward_xp,
  validation_type = EXCLUDED.validation_type,
  youtube_url = EXCLUDED.youtube_url,
  video_actions = EXCLUDED.video_actions,
  updated_at = NOW();`);
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
    }

    console.log('');
    console.log('✅ Copia el SQL de arriba y ejecútalo en Supabase SQL Editor');
    console.log('');
    rl.close();
});
