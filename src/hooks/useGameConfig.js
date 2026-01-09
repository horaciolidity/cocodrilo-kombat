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

    const fetchConfig = async () => {
        try {
            setLoading(true);

            const [
                { data: dbUpgrades, error: errUpgrades },
                { data: dbMissions, error: errMissions },
                { data: dbShopItems, error: errShopItems },
                { data: dbCards, error: errCards }
            ] = await Promise.all([
                supabase.from('game_upgrades').select('*').order('base_price', { ascending: true }),
                supabase.from('game_missions').select('*'),
                supabase.from('game_shop_items').select('*'),
                supabase.from('game_cards').select('*')
            ]);

            if (errUpgrades || errMissions || errShopItems || errCards) {
                // If error (e.g. table doesn't exist yet), verify it's a "relation does not exist" or empty
                // console.warn("Supabase config fetch failed, using fallback:", errUpgrades || errMissions);
                setUsingFallback(true);
                // We keep the initial state which is the fallback
            } else {
                // Check if tables are empty
                if (dbUpgrades?.length === 0 && dbMissions?.length === 0) {
                    setUsingFallback(true);
                } else {
                    // Transform DB data to App format (resolve icons, parse JSONs)

                    if (dbUpgrades?.length > 0) {
                        const mappedUpgrades = dbUpgrades.map(u => ({
                            id: u.id,
                            name: u.name,
                            description: u.description,
                            basePrice: Number(u.base_price),
                            basePower: Number(u.base_price), // Wait, check column name. base_power
                            basePower: Number(u.base_power),
                            type: u.type,
                            icon: resolveIcon(u.icon_name),
                            color: u.color,
                            image: u.image_url
                        }));
                        setUpgrades(mappedUpgrades);
                    }

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
                                cardId: m.reward_card_id
                            },
                            icon: resolveIcon(m.icon_name),
                            category: m.category
                        }));
                        setMissions(mappedMissions);
                    }

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
                }
            }

        } catch (e) {
            console.error("Config fetch error:", e);
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
        loading,
        usingFallback,
        error,
        refreshConfig: fetchConfig
    }), [upgrades, missions, shopItems, cards, loading, usingFallback, error]);
};
