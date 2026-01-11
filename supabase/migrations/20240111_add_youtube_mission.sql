-- Migration: Add YouTube Subscription Mission
-- Date: 2026-01-11
-- Description: Add a mission for users to subscribe to the Cocodrilo Kombat YouTube channel

-- Insert YouTube subscription mission
INSERT INTO public.game_missions (
  id,
  name,
  description,
  requirement_type,
  requirement_value,
  requirement_metadata,
  reward_coins,
  reward_xp,
  reward_card_id,
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
  jsonb_build_object(
    'url', 'https://youtube.com/@cocodrilokombat',
    'actionText', 'Ir a YouTube'
  ),
  5000,
  100,
  NULL,
  'Youtube',
  'Social',
  'youtube_actions',
  'https://youtube.com/@cocodrilokombat',
  jsonb_build_object(
    'subscribe', true,
    'like', false,
    'comment', false,
    'follow', false
  )
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirement_metadata = EXCLUDED.requirement_metadata,
  reward_coins = EXCLUDED.reward_coins,
  reward_xp = EXCLUDED.reward_xp,
  validation_type = EXCLUDED.validation_type,
  youtube_url = EXCLUDED.youtube_url,
  video_actions = EXCLUDED.video_actions,
  updated_at = NOW();
