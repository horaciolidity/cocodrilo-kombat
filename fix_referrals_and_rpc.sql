-- =============================================
-- 🛠️ FIX REFERRAL SYSTEM (RPC & RETROACTIVE)
-- =============================================

-- 1. DROP OLD RPC TO RECREATE CLEANLY
DROP FUNCTION IF EXISTS process_new_referral(text);

-- 2. CREATE CORRECT RPC FOR REFERRALS
CREATE OR REPLACE FUNCTION process_new_referral(referral_code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
    new_player_id uuid;
    referrer_record RECORD;
    bonus_coins_guest int := 1000;
    bonus_croc_guest int := 10;
    bonus_coins_referrer int := 25000;
    bonus_croc_referrer int := 10;
BEGIN
    -- Get current user (the new guest)
    new_user_id := auth.uid();
    
    -- Get player ID for current user
    SELECT id INTO new_player_id FROM players WHERE user_id = new_user_id;

    IF new_player_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Player profile not found');
    END IF;

    -- Check if already referred (prevent double dipping)
    IF EXISTS (SELECT 1 FROM players WHERE id = new_player_id AND referred_by IS NOT NULL) THEN
        RETURN json_build_object('success', false, 'error', 'Already referred');
    END IF;

    -- Validate Referral Code (Self-referral check)
    IF EXISTS (SELECT 1 FROM players WHERE referral_code = referral_code_input AND id = new_player_id) THEN
        RETURN json_build_object('success', false, 'error', 'Cannot refer yourself');
    END IF;

    -- Find Referrer
    SELECT * INTO referrer_record FROM players WHERE referral_code = referral_code_input;

    IF referrer_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid referral code');
    END IF;

    -- UPDATE NEW USER (GUEST) - Link to referrer
    UPDATE players 
    SET referred_by = referrer_record.id,
        updated_at = NOW()
    WHERE id = new_player_id;

    -- UPDATE NEW USER STATS (GUEST REWARD)
    -- Upsert to ensure row exists
    INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
    VALUES (new_player_id, 0, 0, 0)
    ON CONFLICT (player_id) DO NOTHING;

    UPDATE player_stats
    SET 
        coins = COALESCE(coins, 0) + bonus_coins_guest,
        total_coins = COALESCE(total_coins, 0) + bonus_coins_guest,
        native_token_balance = COALESCE(native_token_balance, 0) + bonus_croc_guest,
        updated_at = NOW()
    WHERE player_id = new_player_id;

    -- UPDATE REFERRER STATS (HOST REWARD)
    -- Upsert to ensure row exists
    INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance, referrals_count)
    VALUES (referrer_record.id, 0, 0, 0, 0)
    ON CONFLICT (player_id) DO NOTHING;

    UPDATE player_stats
    SET 
        coins = COALESCE(coins, 0) + bonus_coins_referrer,
        total_coins = COALESCE(total_coins, 0) + bonus_coins_referrer,
        native_token_balance = COALESCE(native_token_balance, 0) + bonus_croc_referrer,
        referrals_count = COALESCE(referrals_count, 0) + 1,
        coins_from_refs = COALESCE(coins_from_refs, 0) + bonus_coins_referrer,
        croc_from_refs = COALESCE(croc_from_refs, 0) + bonus_croc_referrer,
        updated_at = NOW()
    WHERE player_id = referrer_record.id;

    RETURN json_build_object(
        'success', true,
        'referrer', referrer_record.username,
        'bonus_coins', bonus_coins_guest,
        'bonus_croc', bonus_croc_guest
    );
END;
$$;


-- 3. RETROACTIVE PAYOUT SCRIPT (REFERRERS)
-- Pays referrers who didn't get their reward
DO $$
DECLARE
    r RECORD;
    current_coins_refs BIGINT;
    current_croc_refs NUMERIC;
    expected_coins BIGINT;
    expected_croc NUMERIC;
    diff_coins BIGINT;
    diff_croc NUMERIC;
    total_repaired INT := 0;
    
    -- CONFIGURATION
    RATE_COINS_REFERRER INT := 25000;
    RATE_CROC_REFERRER INT := 10;
BEGIN
    RAISE NOTICE '🚀 Starting Retroactive Referral Payouts...';

    -- Loop through all referrers
    FOR r IN 
        SELECT referred_by, COUNT(*) as actual_count 
        FROM players 
        WHERE referred_by IS NOT NULL 
        GROUP BY referred_by
    LOOP
        -- Ensure stats row exists
        INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
        VALUES (r.referred_by, 0, 0, 0)
        ON CONFLICT (player_id) DO NOTHING;

        -- Calculate Expected
        expected_coins := r.actual_count * RATE_COINS_REFERRER;
        expected_croc := r.actual_count * RATE_CROC_REFERRER;

        -- Get Current
        SELECT 
            COALESCE(coins_from_refs, 0), 
            COALESCE(croc_from_refs, 0)
        INTO current_coins_refs, current_croc_refs
        FROM player_stats
        WHERE player_id = r.referred_by;

        -- Calculate Diff
        diff_coins := GREATEST(0, expected_coins - current_coins_refs);
        diff_croc := GREATEST(0, expected_croc - current_croc_refs);

        -- Pay Diff
        IF diff_coins > 0 OR diff_croc > 0 THEN
            UPDATE player_stats
            SET 
                coins = COALESCE(coins, 0) + diff_coins,
                total_coins = COALESCE(total_coins, 0) + diff_coins,
                native_token_balance = COALESCE(native_token_balance, 0) + diff_croc,
                referrals_count = r.actual_count,
                coins_from_refs = expected_coins,
                croc_from_refs = expected_croc,
                updated_at = NOW()
            WHERE player_id = r.referred_by;
            
            total_repaired := total_repaired + 1;
            RAISE NOTICE '✅ Paid Referrer %: +% Coins, +% Croc', r.referred_by, diff_coins, diff_croc;
        ELSE
             -- Just sync count
            UPDATE player_stats
            SET referrals_count = r.actual_count
            WHERE player_id = r.referred_by AND (referrals_count IS NULL OR referrals_count != r.actual_count);
        END IF;

    END LOOP;
    
    RAISE NOTICE '✨ Finished Referrer Repair. % users paid.', total_repaired;
END $$;


-- 4. RETROACTIVE PAYOUT SCRIPT (GUESTS - REFERRED USERS)
-- Fixes guests who have a referrer but have 0 coins/tokens (missed initial payout)
DO $$
DECLARE
    g RECORD;
    repaired_guests INT := 0;
    BONUS_COINS_GUEST INT := 1000;
    BONUS_CROC_GUEST INT := 10;
BEGIN
    RAISE NOTICE '🚀 Starting Retroactive Guest Payouts...';
    
    FOR g IN
        SELECT p.id as player_id
        FROM players p
        JOIN player_stats ps ON p.id = ps.player_id
        WHERE p.referred_by IS NOT NULL
        AND ps.total_coins < 1000 -- Heuristic: If they have less than the bonus, they probably didn't get it
    LOOP
        UPDATE player_stats
        SET
            coins = coins + BONUS_COINS_GUEST,
            total_coins = total_coins + BONUS_COINS_GUEST,
            native_token_balance = native_token_balance + BONUS_CROC_GUEST,
            updated_at = NOW()
        WHERE player_id = g.player_id;
        
        repaired_guests := repaired_guests + 1;
    END LOOP;

    RAISE NOTICE '✨ Finished Guest Repair. % guests paid.', repaired_guests;
END $$;
