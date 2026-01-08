import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Shield, Users, Save, Database, DollarSign, Activity, AlertTriangle, RefreshCw } from "lucide-react";
import * as LucideIcons from 'lucide-react';

import {
    UPGRADES,
    MISSIONS,
    SHOP_ITEMS,
    CARDS_DATA
} from '@/config/gameConfig';

export function AdminView({ user, toast }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    // Config Management
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState(null);

    // Economy Control
    const [newPrice, setNewPrice] = useState("0.05");
    const [newLiquidity, setNewLiquidity] = useState("50000");

    useEffect(() => {
        checkAdmin();
    }, [user]);

    const checkAdmin = async () => {
        if (!user) return;
        const adminEmails = ['admin@cocodrilo.com', user.email];
        if (adminEmails.includes(user.email)) {
            setIsAdmin(true);
        }
        setLoading(false);
    };

    // Helper to find icon name from component
    const findIconName = (IconComponent) => {
        if (!IconComponent) return 'HelpCircle';
        // Try to find in Lucide exports
        for (const [key, val] of Object.entries(LucideIcons)) {
            if (val === IconComponent) return key;
        }
        return 'HelpCircle';
    };

    const handleInitializeDatabase = async () => {
        if (!confirm("¿Estás seguro? Esto intentará insertar la configuración por defecto en la base de datos. Si ya existen datos, podría duplicarlos o fallar si no se manejan conflictos.")) return;

        setIsSeeding(true);
        setSeedResult(null);

        try {
            console.log("🌱 Iniciando siembra de base de datos...");
            let log = [];

            // 1. Upgrades
            const upgradesPayload = UPGRADES.map(u => ({
                id: u.id,
                name: u.name,
                description: u.description,
                base_price: u.basePrice,
                base_power: u.basePower,
                type: u.type,
                icon_name: findIconName(u.icon),
                color: u.color,
                image_url: u.image
            }));

            const { error: errUpgrades } = await supabase.from('game_upgrades').upsert(upgradesPayload, { onConflict: 'id' });
            if (errUpgrades) throw new Error(`Error Upgrades: ${errUpgrades.message}`);
            log.push(`✅ ${upgradesPayload.length} Mejoras insertadas/actualizadas.`);

            // 2. Missions
            const missionsPayload = MISSIONS.map(m => ({
                id: m.id,
                name: m.name,
                description: m.description,
                requirement_type: m.requirement.type,
                requirement_value: m.requirement.value,
                requirement_metadata: {
                    url: m.requirement.url,
                    actionText: m.requirement.actionText,
                    upgradeId: m.requirement.upgradeId
                },
                reward_coins: m.reward.coins || 0,
                reward_xp: m.reward.xp || 0,
                reward_card_id: m.reward.cardId,
                icon_name: findIconName(m.icon),
                category: m.category
            }));

            const { error: errMissions } = await supabase.from('game_missions').upsert(missionsPayload, { onConflict: 'id' });
            if (errMissions) throw new Error(`Error Misiones: ${errMissions.message}`);
            log.push(`✅ ${missionsPayload.length} Misiones insertadas/actualizadas.`);

            // 3. Shop Items
            const itemsPayload = SHOP_ITEMS.map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                description: i.description,
                price_coins: i.price || 0,
                price_croc: i.priceCroc || 0,
                currency: i.currency,
                image_url: i.image,
                rarity: i.rarity,
                required_level: i.requiredLevel || 1,
                effect_data: i.effect
            }));

            const { error: errItems } = await supabase.from('game_shop_items').upsert(itemsPayload, { onConflict: 'id' });
            if (errItems) throw new Error(`Error Items: ${errItems.message}`);
            log.push(`✅ ${itemsPayload.length} Items insertados/actualizados.`);

            // 4. Cards
            const cardsPayload = CARDS_DATA.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description,
                rarity: c.rarity,
                icon_name: findIconName(c.icon),
                color: c.color,
                effect_type: c.effect?.type,
                effect_value: c.effect?.value
            }));

            const { error: errCards } = await supabase.from('game_cards').upsert(cardsPayload, { onConflict: 'id' });
            if (errCards) throw new Error(`Error Cartas: ${errCards.message}`);
            log.push(`✅ ${cardsPayload.length} Cartas insertadas/actualizadas.`);

            setSeedResult({ success: true, message: log.join('\n') });
            toast({ title: "Base de Datos Inicializada", description: "Configuración cargada exitosamente." });

        } catch (e) {
            console.error(e);
            setSeedResult({ success: false, message: e.message });
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsSeeding(false);
        }
    };

    const handleUpdatePrice = async () => {
        // ... existing logic ...
        try {
            const price = parseFloat(newPrice);
            const liq = parseInt(newLiquidity);

            if (isNaN(price) || isNaN(liq)) throw new Error("Valores inválidos");

            const { error } = await supabase
                .from('token_prices')
                .upsert({
                    token_symbol: 'CROC',
                    price: price,
                    liquidity: liq,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'token_symbol' });

            if (error) throw error;

            toast({
                title: "✅ Precio Actualizado",
                description: `Nuevo precio: $${price}`,
            });
        } catch (e) {
            toast({
                title: "❌ Error",
                description: e.message,
                variant: "destructive"
            });
        }
    };

    if (loading) return <div>Verificando permisos...</div>;

    if (!isAdmin) {
        return (
            <div className="p-8 text-center">
                <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold">Acceso Denegado</h2>
                <p className="text-muted-foreground">Esta área es restringida.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
                <Shield className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold gradient-text">Panel de Administración</h1>
            </div>

            <Tabs defaultValue="config">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                    <TabsTrigger value="dashboard"><Activity className="mr-2 h-4 w-4" /> Dashboard</TabsTrigger>
                    <TabsTrigger value="economy"><DollarSign className="mr-2 h-4 w-4" /> Economía</TabsTrigger>
                    <TabsTrigger value="content"><LucideIcons.FileEdit className="mr-2 h-4 w-4" /> Contenido</TabsTrigger>
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Usuarios</TabsTrigger>
                    <TabsTrigger value="config"><Database className="mr-2 h-4 w-4" /> Config</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                        Dashboard en construcción
                    </div>
                </TabsContent>

                <TabsContent value="economy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Control de Token CROC</CardTitle>
                            <CardDescription>
                                Ajusta el precio manualmente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Precio ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Liquidez ($)</Label>
                                    <Input
                                        type="number"
                                        value={newLiquidity}
                                        onChange={e => setNewLiquidity(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleUpdatePrice} className="w-full">
                                <Save className="mr-2 h-4 w-4" /> Guardar Precio
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="content">
                    <MissionsEditor toast={toast} />
                </TabsContent>

                {/* NEW CONFIG TAB */}
                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inicialización de Base de Datos</CardTitle>
                            <CardDescription>
                                Carga la configuración inicial (Misiones, Upgrades, Items) desde el archivo de configuración hacia Supabase.
                                Útil para la primera vez o para resetear valores globales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-md mb-4 text-sm text-blue-200">
                                <p>⚠️ Esto convertirá la configuración estática (gameConfig.js) en datos dinámicos en las tablas <code>game_upgrades</code>, <code>game_missions</code>, etc.</p>
                            </div>

                            {seedResult && (
                                <div className={`p-4 rounded-md mb-4 text-sm whitespace-pre-wrap ${seedResult.success ? 'bg-green-900/20 border-green-800 text-green-200' : 'bg-red-900/20 border-red-800 text-red-200'}`}>
                                    {seedResult.message}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleInitializeDatabase}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                disabled={isSeeding}
                            >
                                {isSeeding ? (
                                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                                ) : (
                                    <><Database className="mr-2 h-4 w-4" /> Inicializar / Sincronizar DB</>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <div className="text-center py-10 opacity-50">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                        <p>Gestión de usuarios próximamente</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MissionsEditor({ toast }) {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('game_missions')
            .select('*')
            .order('id');

        if (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar las misiones", variant: "destructive" });
        } else {
            setMissions(data);
        }
        setLoading(false);
    };

    const handleEdit = (mission) => {
        setEditingId(mission.id);
        setEditForm({ ...mission });
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('game_missions')
                .update({
                    name: editForm.name,
                    description: editForm.description,
                    reward_coins: parseInt(editForm.reward_coins)
                })
                .eq('id', editingId);

            if (error) throw error;

            setMissions(missions.map(m => m.id === editingId ? { ...m, ...editForm } : m));
            setEditingId(null);
            toast({ title: "Guardado", description: "Misión actualizada correctamente." });
        } catch (e) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    if (loading) return <div>Cargando contenido...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Gestor de Misiones</h3>
                <Button variant="outline" size="sm" onClick={fetchMissions}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4">
                {missions.map(mission => (
                    <Card key={mission.id}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{mission.name}</CardTitle>
                                    <CardDescription className="text-xs">{mission.id}</CardDescription>
                                </div>
                                {editingId === mission.id ? (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleSave}><Save className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(mission)}>Editar</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                            {editingId === mission.id ? (
                                <div className="space-y-3">
                                    <div>
                                        <Label>Nombre</Label>
                                        <Input
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Descripción</Label>
                                        <Input
                                            value={editForm.description}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Recompensa (Monedas)</Label>
                                        <Input
                                            type="number"
                                            value={editForm.reward_coins}
                                            onChange={e => setEditForm({ ...editForm, reward_coins: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm">
                                    <p className="text-muted-foreground mb-2">{mission.description}</p>
                                    <div className="flex gap-2">
                                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-mono">
                                            Reward: {mission.reward_coins} 💰
                                        </span>
                                        <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs font-mono">
                                            Type: {mission.requirement_type}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
