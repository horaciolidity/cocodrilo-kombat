import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    UPGRADES as FALLBACK_UPGRADES,
    MISSIONS as FALLBACK_MISSIONS,
    SHOP_ITEMS as FALLBACK_SHOP_ITEMS,
    CARDS_DATA as FALLBACK_CARDS
} from '@/config/gameConfig';
import * as LucideIcons from 'lucide-react';

export const useGameConfig = () => {
    const [upgrades, setUpgrades] = useState(FALLBACK_UPGRADES);
    const [missions, setMissions] = useState(FALLBACK_MISSIONS);
    const [shopItems, setShopItems] = useState(FALLBACK_SHOP_ITEMS);
    const [cards, setCards] = useState(FALLBACK_CARDS);

    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(true);
    const [error, setError] = useState(null);

    // Helper to resolve icon string to component
    const resolveIcon = (iconName) => {
        if (!iconName) return LucideIcons.HelpCircle;
        return LucideIcons[iconName] || LucideIcons.HelpCircle;
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const [fairLaunch, setFairLaunch] = useState(null); // [NEW]

    const fetchConfig = async () => {
        try {
            setLoading(true);
            console.log("🔄 Fetching Game Config from Supabase...");

            const [
                { data: dbUpgrades, error: errUpgrades },
                { data: dbMissions, error: errMissions },
                { data: dbShopItems, error: errShopItems },
                { data: dbCards, error: errCards },
                { data: dbGlobalConfig, error: errGlobal } // [NEW]
            ] = await Promise.all([
                supabase.from('game_upgrades').select('*').order('base_price', { ascending: true }),
                supabase.from('game_missions').select('*'),
                supabase.from('game_shop_items').select('*'),
                supabase.from('game_cards').select('*'),
                supabase.from('game_config').select('*').limit(1) // [NEW] Fetch global config
            ]);

            if (errUpgrades) console.error("❌ Error fetching upgrades:", errUpgrades);
            if (errMissions) console.error("❌ Error fetching missions:", errMissions);
            if (errGlobal) console.error("❌ Error fetching global config:", errGlobal);

            if (errUpgrades || errMissions || errShopItems || errCards) {
                console.warn("⚠️ Supabase config fetch failed partial or total. Using Fallback for missing parts.");
                // Ensure we don't block everything if just one table fails, but keeping 'usingFallback' logic simple for now
                // setUsingFallback(true); 
            }

            // 1. Process Global Config (Fair Launch, Youtube, etc)
            if (dbGlobalConfig && dbGlobalConfig.length > 0) {
                const cfg = dbGlobalConfig[0];
                console.log("✅ Global Config Loaded:", cfg);
                setFairLaunch({
                    start_date: cfg.fairlaunch_start,
                    end_date: cfg.fairlaunch_end,
                    is_active: cfg.fairlaunch_active
                });
                // Note: You might want to store other global vars like daily_youtube_link here
            }

            // 2. Process Upgrades
            if (dbUpgrades?.length > 0) {
                const mappedUpgrades = dbUpgrades.map(u => ({
                    id: u.id,
                    name: u.name,
                    description: u.description,
                    basePrice: Number(u.base_price),
                    basePower: Number(u.base_power),
                    type: u.type,
                    icon: resolveIcon(u.icon_name),
                    color: u.color,
                    image: u.image_url
                }));
                setUpgrades(mappedUpgrades);
            }

            // 3. Process Missions
            if (dbMissions?.length > 0) {
                console.log(`✅ Loaded ${dbMissions.length} dynamic missions.`);
                const mappedMissions = dbMissions.map(m => ({
                    id: m.id,
                    name: m.name,
                    description: m.description,
                    requirement: {
                        type: m.requirement_type,
                        value: Number(m.requirement_value),
                        ...((m.requirement_metadata) || {})
                    },
                    reward: {
                        coins: Number(m.reward_coins),
                        xp: Number(m.reward_xp),
                        cardId: m.reward_card_id,
                        croc: Number(m.reward_croc) // [FIX] Added croc reward mapping
                    },
                    icon: resolveIcon(m.icon_name),
                    category: m.category,
                    validation_type: m.validation_type,
                    youtube_url: m.youtube_url,
                    video_actions: m.video_actions,
                    secret_code: m.secret_code, // [FIX] Ensure secret code is mapped if needed for local validation (though usually server-side)
                    is_active: m.is_active !== false
                })).filter(m => m.is_active); // Only show active missions

                setMissions(mappedMissions);
            } else {
                console.log("ℹ️ No dynamic missions found, using fallback.");
            }

            // 4. Shop & Cards (Keep existing logic)
            if (dbShopItems?.length > 0) {
                const mappedItems = dbShopItems.map(i => ({
                    id: i.id,
                    name: i.name,
                    type: i.type,
                    price: Number(i.price_coins),
                    priceCroc: Number(i.price_croc),
                    currency: i.currency,
                    image: i.image_url,
                    rarity: i.rarity,
                    requiredLevel: i.required_level,
                    description: i.description,
                    effect: i.effect_data || {}
                }));
                setShopItems(mappedItems);
            }

            if (dbCards?.length > 0) {
                const mappedCards = dbCards.map(c => ({
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    rarity: c.rarity,
                    icon: resolveIcon(c.icon_name),
                    color: c.color,
                    effect: {
                        type: c.effect_type,
                        value: Number(c.effect_value)
                    }
                }));
                setCards(mappedCards);
            }

            setUsingFallback(false);

        } catch (e) {
            console.error("Config fetch FATAL error:", e);
            setError(e.message);
            setUsingFallback(true);
        } finally {
            setLoading(false);
        }
    };

    return useMemo(() => ({
        upgrades,
        missions,
        shopItems,
        cards,
        fair_launch: fairLaunch, // [NEW] Expose global config
        loading,
        usingFallback,
        error,
        refreshConfig: fetchConfig
    }), [upgrades, missions, shopItems, cards, fairLaunch, loading, usingFallback, error]);
};
