-- Migration: Final Polish (Daily Rewards, Config, Codes)

-- 1. Create Game Config Table
CREATE TABLE IF NOT EXISTS public.game_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read game_config" ON public.game_config
    FOR SELECT USING (true);

CREATE POLICY "Allow service_role write game_config" ON public.game_config
    FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
    
-- Insert default fair launch config
INSERT INTO public.game_config (key, value)
VALUES ('fair_launch', '{"end_date": "2024-02-01T00:00:00Z"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Enhance Missions Table
ALTER TABLE public.game_missions 
ADD COLUMN IF NOT EXISTS secret_code TEXT,
ADD COLUMN IF NOT EXISTS validation_type TEXT DEFAULT 'click'; -- 'click', 'code', 'social'

-- 3. RPC: Claim Daily Reward
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_timezone_offset INT DEFAULT 0)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_player_id UUID;
    v_stats RECORD;
    v_last_claim TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW(); -- Server time
    v_streak INT := 0;
    v_reward_coins INT := 0;
    v_can_claim BOOLEAN := FALSE;
    v_daily_rewards JSONB;
BEGIN
    -- Get Current User
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Get Player
    SELECT id INTO v_player_id FROM public.players WHERE user_id = v_user_id;

    -- Get Stats
    SELECT * INTO v_stats FROM public.player_stats WHERE player_id = v_player_id;
    
    v_daily_rewards := COALESCE(v_stats.daily_rewards, '{"streak": 0, "lastClaim": null}'::jsonb);
    v_streak := COALESCE((v_daily_rewards->>'streak')::int, 0);
    
    -- Parse last claim date
    IF (v_daily_rewards->>'lastClaim') IS NOT NULL THEN
        v_last_claim := (v_daily_rewards->>'lastClaim')::TIMESTAMPTZ;
    END IF;

    -- Check Validation Logic
    IF v_last_claim IS NULL THEN
        -- First time ever
        v_streak := 1;
        v_can_claim := TRUE;
    ELSE
        -- Check time diff
        -- Simple check: if last claim was "yesterday" relative to server time?
        -- Or just simple 24h check?
        -- Let's use a 24h window logic for robustness
        -- If < 20 hours since last claim, too early.
        IF v_now - v_last_claim < INTERVAL '20 hours' THEN
             RETURN jsonb_build_object('success', false, 'error', 'Cooldown active', 'next_claim', v_last_claim + INTERVAL '24 hours');
        END IF;

        -- If > 48 hours, reset streak
        IF v_now - v_last_claim > INTERVAL '48 hours' THEN
            v_streak := 1;
        ELSE
            v_streak := v_streak + 1;
        END IF;
        
        v_can_claim := TRUE;
    END IF;

    IF v_can_claim THEN
        -- Calculate Reward (Base 1000 * streak, max 7 days multiplier)
        -- Cap streak multiplier at 10 to avoid infinity
        v_reward_coins := 5000 + (LEAST(v_streak, 10) * 1000);
        
        -- Update Stats
        UPDATE public.player_stats
        SET 
            coins = coins + v_reward_coins,
            total_coins = total_coins + v_reward_coins,
            daily_rewards = jsonb_build_object(
                'streak', v_streak,
                'lastClaim', v_now
            ),
            updated_at = v_now
        WHERE player_id = v_player_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'new_streak', v_streak,
            'reward_coins', v_reward_coins,
            'total_coins', v_stats.total_coins + v_reward_coins
        );
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'Unknown error');
END;
$$;

-- 4. RPC: Verify Mission Code
CREATE OR REPLACE FUNCTION public.verify_mission_code(p_mission_id TEXT, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_player_id UUID;
    v_mission RECORD;
    v_stats RECORD;
    v_current_missions JSONB;
    v_reward_coins INT;
BEGIN
    -- Auth Check
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    SELECT id INTO v_player_id FROM public.players WHERE user_id = v_user_id;
    
    -- Mission Check
    SELECT * INTO v_mission FROM public.game_missions WHERE id = p_mission_id;
    
    IF v_mission IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mission not found');
    END IF;
    
    -- Code Check (Simple Case Insensitive)
    IF UPPER(TRIM(v_mission.secret_code)) != UPPER(TRIM(p_code)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
    END IF;
    
    -- Check if already completed
    SELECT * INTO v_stats FROM public.player_stats WHERE player_id = v_player_id;
    v_current_missions := COALESCE(v_stats.missions, '{}'::jsonb);
    
    IF (v_current_missions->p_mission_id->>'completed')::boolean IS TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already completed');
    END IF;
    
    -- Award Reward
    v_reward_coins := COALESCE(v_mission.reward_coins, 0);
    
    -- Prepare new mission state
    v_current_missions := jsonb_set(
        v_current_missions, 
        ARRAY[p_mission_id], 
        jsonb_build_object('completed', true, 'claimed', true, 'progress', 1, 'completedAt', NOW())
    );
    
    UPDATE public.player_stats
    SET 
        missions = v_current_missions,
        coins = coins + v_reward_coins,
        total_coins = total_coins + v_reward_coins,
        updated_at = NOW()
    WHERE player_id = v_player_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'reward_coins', v_reward_coins,
        'message', 'Code redeemed!'
    );
END;
$$;
