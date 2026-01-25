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
                { data: dbGlobalConfig, error: errGlobal }, // [NEW]
                { data: dbDailyCodes, error: errCodes } // [NEW] Fetch daily codes
            ] = await Promise.all([
                supabase.from('game_upgrades').select('*').order('base_price', { ascending: true }),
                supabase.from('game_missions').select('*'),
                supabase.from('game_shop_items').select('*'),
                supabase.from('game_cards').select('*'),
                supabase.from('game_config').select('*'), // [NEW] Fetch all global config items
                supabase.from('daily_codes').select('*').eq('is_active', true).order('active_date', { ascending: false }) // [NEW]
            ]);

            if (errUpgrades) console.error("❌ Error fetching upgrades:", errUpgrades);
            if (errMissions) console.error("❌ Error fetching missions:", errMissions);
            if (errGlobal) console.error("❌ Error fetching global config:", errGlobal);
            if (errCodes) console.error("❌ Error fetching daily codes:", errCodes);

            if (errUpgrades || errMissions || errShopItems || errCards || errCodes) {
                console.warn("⚠️ Supabase config fetch failed partial or total. Using Fallback for missing parts.");
                // Ensure we don't block everything if just one table fails, but keeping 'usingFallback' logic simple for now
                // setUsingFallback(true); 
            }

            // 1. Process Global Config & Virtual Missions
            const virtualMissions = [];
            let dailyYoutubeUrl = null;

            if (dbGlobalConfig && dbGlobalConfig.length > 0) {
                // Fair Launch
                const flConfig = dbGlobalConfig.find(c => c.key === 'fair_launch')?.value;
                if (flConfig) {
                    setFairLaunch({
                        start_date: flConfig.start_date,
                        end_date: flConfig.end_date,
                        is_active: flConfig.is_active
                    });
                }

                // Daily YouTube
                const ytConfig = dbGlobalConfig.find(c => c.key === 'daily_youtube_link')?.value;
                if (ytConfig?.url) {
                    dailyYoutubeUrl = ytConfig.url;

                    // 🆕 GENERAR ID BASADO EN URL (para que se resetee al cambiar el link)
                    // Usamos btoa simple pero seguro para URLs
                    let urlHash = 'default';
                    try {
                        urlHash = btoa(ytConfig.url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
                    } catch (e) {
                        // Fallback por si la URL tiene caracteres raros
                        urlHash = Date.now().toString();
                    }
                    const dynamicId = `daily_youtube_${urlHash}`;

                    // Inject Virtual Mission for Daily YouTube
                    virtualMissions.push({
                        id: dynamicId,
                        name: '📺 Misión Diaria YouTube',
                        description: 'Suscríbete y comenta en nuestro video diario.',

                        // [FIX] Add requirement to pass MissionsView validation
                        requirement: {
                            type: 'video_watch',
                            value: 1,
                            url: ytConfig.url,
                            actionText: 'Ver Video'
                        },

                        reward: { coins: 1000, xp: 50 },
                        icon: LucideIcons.Youtube,
                        category: 'daily', // Changed to daily to prioritize sorting
                        validation_type: 'youtube_actions',
                        youtube_url: ytConfig.url,
                        video_actions: { subscribe: true, like: true, comment: true },
                        is_active: true,
                        is_virtual: true // Flag to identify
                    });
                }
                console.log("✅ Global Config Loaded.");
            }

            // 2. Process Daily Codes as Virtual Missions
            // [FIX] Only show the LATEST active code to prevent duplicates if admin created multiple
            if (dbDailyCodes && dbDailyCodes.length > 0) {
                const latestCode = dbDailyCodes[0]; // Already ordered by active_date desc

                virtualMissions.push({
                    id: `daily_code_${latestCode.id}`,
                    name: '🗝️ Código Secreto Diario',
                    description: latestCode.description || 'Encuentra el código secreto en el video de hoy.',

                    // [FIX] Add requirement to pass MissionsView validation
                    requirement: {
                        type: 'code',
                        value: 1
                    },

                    reward: {
                        coins: latestCode.reward_coins || 0,
                        croc: latestCode.reward_croc || 0
                    },
                    icon: LucideIcons.Key,
                    category: 'daily',
                    validation_type: 'daily_code',
                    secret_code: latestCode.code,
                    is_active: true,
                    is_virtual: true
                });
            }

            // 3. Process Upgrades
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

            // 4. Process Missions (Merge DB + Virtual)
            let finalMissions = [];

            if (dbMissions?.length > 0) {
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
                        croc: Number(m.reward_croc)
                    },
                    icon: resolveIcon(m.icon_name),
                    category: m.category,
                    validation_type: m.validation_type,
                    youtube_url: m.youtube_url,
                    video_actions: m.video_actions,
                    secret_code: m.secret_code,
                    is_active: m.is_active !== false
                })).filter(m => m.is_active);

                finalMissions = [...virtualMissions, ...mappedMissions];
            } else {
                finalMissions = [...virtualMissions, ...FALLBACK_MISSIONS]; // Keep virtuals even if using fallback
            }

            // Remove duplicates if any ID clashes (unlikely but safe)
            const uniqueMissions = Array.from(new Map(finalMissions.map(m => [m.id, m])).values());
            setMissions(uniqueMissions);

            if (dbMissions?.length > 0) {
                console.log(`✅ Loaded ${uniqueMissions.length} total missions (${virtualMissions.length} virtual).`);
            } else {
                console.log("ℹ️ No dynamic missions found, using fallback + virtuals.");
            }

            // 5. Shop & Cards (Keep existing logic)
            if (dbShopItems?.length > 0) {
                const mappedItems = dbShopItems.map(i => {
                    // [FIX] Force usage of local image path if ID matches, to fix broken/stale DB paths
                    const localFallback = FALLBACK_SHOP_ITEMS.find(f => f.id === i.id);
                    const imagePath = localFallback ? localFallback.image : i.image_url;

                    return {
                        id: i.id,
                        name: i.name,
                        type: i.type,
                        price: Number(i.price_coins),
                        priceCroc: Number(i.price_croc),
                        currency: i.currency,
                        image: imagePath, // Use local path if available
                        rarity: i.rarity,
                        requiredLevel: i.required_level,
                        description: i.description,
                        effect: i.effect_data || {}
                    };
                });
                // Merge fallback items that might be missing in DB
                const missingItems = FALLBACK_SHOP_ITEMS.filter(f => !dbShopItems.some(db => db.id === f.id));
                setShopItems([...mappedItems, ...missingItems]);
            } else {
                setShopItems(FALLBACK_SHOP_ITEMS); // [FIX] Use fallback if DB empty
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
