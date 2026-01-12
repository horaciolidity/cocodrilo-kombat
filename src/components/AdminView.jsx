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

        // Normalización de email para evitar problemas de mayúsculas/espacios
        const userEmail = user.email?.toLowerCase().trim();
        const allowedAdmins = [
            'admin@cocodrilo.com',
            'horaciowalterortiz@gmail.com'
        ];

        if (allowedAdmins.includes(userEmail)) {
            setIsAdmin(true);
        } else {
            console.log("Acceso denegado a:", userEmail);
            setIsAdmin(false);
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
                    <div className="space-y-6">
                        <MissionsEditor toast={toast} />
                        <DailyCodesManager toast={toast} />
                    </div>
                </TabsContent>

                <TabsContent value="config">
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Configuración Global</CardTitle>
                            <CardDescription>Ajustes generales del juego (Fair Launch, etc.)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GlobalConfigEditor toast={toast} />
                        </CardContent>
                    </Card>

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
                    <UsersList toast={toast} />
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
        setEditForm({
            ...mission,
            url: mission.requirement_metadata?.url || '',
            actionText: mission.requirement_metadata?.actionText || ''
        });
    };

    const handleSave = async () => {
        try {
            const updateData = {
                name: editForm.name,
                description: editForm.description,
                reward_coins: parseInt(editForm.reward_coins) || 0,
                validation_type: editForm.validation_type || 'click',
                requirement_metadata: {
                    url: editForm.url || null,
                    actionText: editForm.actionText || null
                }
            };

            // Add secret_code if validation_type is 'code'
            if (editForm.validation_type === 'code' && editForm.secret_code) {
                updateData.secret_code = editForm.secret_code;
            }

            // Add YouTube-specific fields
            if (editForm.validation_type === 'video_watch' || editForm.validation_type === 'youtube_actions') {
                updateData.youtube_url = editForm.youtube_url || editForm.url || null;
                updateData.video_actions = editForm.video_actions || {
                    subscribe: false,
                    like: false,
                    comment: false,
                    follow: false
                };
            }

            console.log('💾 Guardando misión:', updateData);

            const { error } = await supabase
                .from('game_missions')
                .update(updateData)
                .eq('id', editingId);

            if (error) throw error;

            await fetchMissions(); // Reload to get fresh data
            setEditingId(null);
            toast({ title: "✅ Guardado", description: "Misión actualizada correctamente." });
        } catch (e) {
            console.error('❌ Error guardando misión:', e);
            toast({ title: "❌ Error", description: e.message, variant: "destructive" });
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
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label>Recompensa (Coins)</Label>
                                            <Input
                                                type="number"
                                                value={editForm.reward_coins}
                                                onChange={e => setEditForm({ ...editForm, reward_coins: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Tipo Validación</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={editForm.validation_type || 'click'}
                                                onChange={e => setEditForm({ ...editForm, validation_type: e.target.value })}
                                            >
                                                <option value="click">Click / Verificación</option>
                                                <option value="code">Código Secreto</option>
                                                <option value="video_watch">Ver Video (YouTube)</option>
                                                <option value="youtube_actions">YouTube (Suscribir/Like/Comentar)</option>
                                                <option value="social_share">Compartir Social</option>
                                                <option value="daily_code">Código Diario (Recurrente)</option>
                                            </select>
                                        </div>
                                    </div>
                                    {editForm.validation_type === 'code' && (
                                        <div>
                                            <Label className="text-pink-400">Código Secreto</Label>
                                            <Input
                                                value={editForm.secret_code || ''}
                                                onChange={e => setEditForm({ ...editForm, secret_code: e.target.value })}
                                                placeholder="Ej: CROC2024"
                                            />
                                        </div>
                                    )}

                                    {(editForm.validation_type === 'video_watch' || editForm.validation_type === 'social_share') && (
                                        <div className="space-y-2 mt-2 border-t pt-2">
                                            <div>
                                                <Label>URL del Video / Enlace</Label>
                                                <Input
                                                    value={editForm.url || ''}
                                                    onChange={e => setEditForm({ ...editForm, url: e.target.value })}
                                                    placeholder="https://youtube.com/..."
                                                />
                                            </div>
                                            <div>
                                                <Label>Texto del Botón</Label>
                                                <Input
                                                    value={editForm.actionText || ''}
                                                    onChange={e => setEditForm({ ...editForm, actionText: e.target.value })}
                                                    placeholder="Ej: Ver Video"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {editForm.validation_type === 'youtube_actions' && (
                                        <div className="space-y-3 mt-2 border-t pt-2">
                                            <div>
                                                <Label>URL del Video de YouTube</Label>
                                                <Input
                                                    value={editForm.youtube_url || editForm.url || ''}
                                                    onChange={e => setEditForm({ ...editForm, youtube_url: e.target.value, url: e.target.value })}
                                                    placeholder="https://youtube.com/watch?v=..."
                                                />
                                            </div>
                                            <div>
                                                <Label className="block mb-2">Acciones Requeridas</Label>
                                                <div className="space-y-2 pl-2">
                                                    {['subscribe', 'like', 'comment', 'follow'].map(action => (
                                                        <label key={action} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={editForm.video_actions?.[action] || false}
                                                                onChange={e => setEditForm({
                                                                    ...editForm,
                                                                    video_actions: {
                                                                        ...(editForm.video_actions || {}),
                                                                        [action]: e.target.checked
                                                                    }
                                                                })}
                                                                className="w-4 h-4 rounded border-input"
                                                            />
                                                            <span className="text-sm capitalize">{action === 'subscribe' ? 'Suscribirse' : action === 'like' ? 'Dar Like' : action === 'comment' ? 'Comentar' : 'Seguir'}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm">
                                    <p className="text-muted-foreground mb-2">{mission.description}</p>
                                    <div className="flex gap-2">
                                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-mono">
                                            Reward: {mission.reward_coins} 💰
                                        </span>
                                        <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs font-mono">
                                            Type: {mission.validation_type || mission.requirement_type}
                                        </span>
                                        {mission.secret_code && (
                                            <span className="bg-pink-500/20 text-pink-500 px-2 py-1 rounded text-xs font-mono">
                                                Code: {mission.secret_code}
                                            </span>
                                        )}
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

function GlobalConfigEditor({ toast }) {
    const [configData, setConfigData] = useState({});
    const [loading, setLoading] = useState(true);
    const [endDate, setEndDate] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('game_config').select('*');
            if (error) throw error;

            const configObj = {};
            data.forEach(item => {
                configObj[item.key] = item.value;
            });

            setConfigData(configObj);

            if (configObj.fair_launch?.end_date) {
                const date = new Date(configObj.fair_launch.end_date);
                setEndDate(date.toISOString().slice(0, 16));
            }

            if (configObj.daily_youtube_link?.url) {
                setYoutubeUrl(configObj.daily_youtube_link.url);
            }
        } catch (e) {
            console.error("Error fetching config:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLaunch = async () => {
        try {
            const isoDate = new Date(endDate).toISOString();
            const { error } = await supabase
                .from('game_config')
                .upsert({
                    key: 'fair_launch',
                    value: { end_date: isoDate },
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast({ title: "Guardado", description: "Fecha de Fair Launch actualizada." });
            fetchConfig();
        } catch (e) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleSaveYoutube = async () => {
        try {
            const { error } = await supabase
                .from('game_config')
                .upsert({
                    key: 'daily_youtube_link',
                    value: { url: youtubeUrl },
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast({ title: "Enlace Guardado", description: "El enlace diario de YouTube ha sido actualizado." });
            fetchConfig();
        } catch (e) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    if (loading) return <div>Cargando config...</div>;

    return (
        <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <Label className="text-primary font-bold mb-2 block">🚀 Fair Launch Countdown</Label>
                <div className="flex gap-2">
                    <Input
                        type="datetime-local"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                    <Button onClick={handleSaveLaunch} className="bg-indigo-600">
                        <Save className="w-4 h-4 mr-2" /> Guardar
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Esta fecha controla el contador global en la vista de Fairlaunch.
                </p>
            </div>

            <div className="p-4 bg-red-900/10 rounded-lg border border-red-900/30">
                <Label className="text-red-400 font-bold mb-2 block flex items-center gap-2">
                    <LucideIcons.Youtube className="w-5 h-5" /> Enlace Diario YouTube (Suscripción)
                </Label>
                <div className="flex gap-2">
                    <Input
                        type="url"
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/..."
                    />
                    <Button onClick={handleSaveYoutube} variant="destructive">
                        <Save className="w-4 h-4 mr-2" /> Guardar Link
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Este link se usará globalmente para las misiones de suscripción diaria.
                </p>
            </div>
        </div>
    );
}

function DailyCodesManager({ toast }) {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCode, setNewCode] = useState({
        code: '',
        reward_coins: 5000,
        reward_croc: 0,
        description: '',
        active_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('daily_codes')
            .select('*')
            .order('active_date', { ascending: false })
            .limit(20);

        if (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudieron cargar los códigos", variant: "destructive" });
        } else {
            setCodes(data || []);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!newCode.code || newCode.code.length < 4) {
            toast({ title: "Error", description: "El código debe tener al menos 4 caracteres", variant: "destructive" });
            return;
        }

        try {
            const { error } = await supabase
                .from('daily_codes')
                .insert([{
                    code: newCode.code.toUpperCase(),
                    reward_coins: parseInt(newCode.reward_coins),
                    reward_croc: parseFloat(newCode.reward_croc),
                    description: newCode.description,
                    active_date: newCode.active_date,
                    is_active: true
                }]);

            if (error) throw error;

            toast({ title: "Código Creado", description: `Código ${newCode.code} creado exitosamente` });
            setNewCode({
                code: '',
                reward_coins: 5000,
                reward_croc: 0,
                description: '',
                active_date: new Date().toISOString().split('T')[0]
            });
            fetchCodes();
        } catch (e) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('daily_codes')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchCodes();
            toast({ title: "Actualizado", description: "Estado del código actualizado" });
        } catch (e) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    if (loading) return <div>Cargando códigos...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestor de Códigos Diarios</CardTitle>
                <CardDescription>
                    Crea códigos secretos que los usuarios pueden canjear por recompensas. Comparte estos códigos en tus videos de YouTube.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Create New Code Form */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <h4 className="font-semibold">Crear Nuevo Código</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Código (mayúsculas)</Label>
                            <Input
                                value={newCode.code}
                                onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                                placeholder="CROC2024"
                                maxLength={20}
                            />
                        </div>
                        <div>
                            <Label>Fecha Activa</Label>
                            <Input
                                type="date"
                                value={newCode.active_date}
                                onChange={e => setNewCode({ ...newCode, active_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Recompensa (Monedas)</Label>
                            <Input
                                type="number"
                                value={newCode.reward_coins}
                                onChange={e => setNewCode({ ...newCode, reward_coins: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Recompensa (CROC)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={newCode.reward_croc}
                                onChange={e => setNewCode({ ...newCode, reward_croc: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <Label>Descripción (opcional)</Label>
                            <Input
                                value={newCode.description}
                                onChange={e => setNewCode({ ...newCode, description: e.target.value })}
                                placeholder="Código de bienvenida"
                            />
                        </div>
                    </div>
                    <Button onClick={handleCreate} className="w-full">
                        <Save className="mr-2 h-4 w-4" /> Crear Código
                    </Button>
                </div>

                {/* Codes List */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Códigos Recientes</h4>
                        <Button onClick={fetchCodes} size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="p-2 text-left">Código</th>
                                    <th className="p-2 text-left">Fecha</th>
                                    <th className="p-2 text-right">Recompensa</th>
                                    <th className="p-2 text-center">Estado</th>
                                    <th className="p-2 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {codes.map(code => (
                                    <tr key={code.id} className="border-t border-border/50">
                                        <td className="p-2">
                                            <div className="font-mono font-bold">{code.code}</div>
                                            {code.description && (
                                                <div className="text-xs text-muted-foreground">{code.description}</div>
                                            )}
                                        </td>
                                        <td className="p-2">{new Date(code.active_date).toLocaleDateString()}</td>
                                        <td className="p-2 text-right">
                                            <div>{code.reward_coins.toLocaleString()} 💰</div>
                                            {code.reward_croc > 0 && (
                                                <div className="text-xs text-green-500">{code.reward_croc} CROC</div>
                                            )}
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className={`px-2 py-1 rounded text-xs ${code.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                                {code.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleToggleActive(code.id, code.is_active)}
                                            >
                                                {code.is_active ? 'Desactivar' : 'Activar'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function UsersList({ toast }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('player_stats')
                .select(`
                    *,
                    players (username, referral_code)
                `)
                .order('total_coins', { ascending: false })
                .limit(50);

            if (error) throw error;
            setUsers(data || []);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "No se pudieron cargar usuarios.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando usuarios...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Listado de Usuarios (Top 50)</h3>
                <Button onClick={fetchUsers} size="sm" variant="outline"><RefreshCw className="w-4 h-4" /></Button>
            </div>

            <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="p-2 text-left">Usuario</th>
                            <th className="p-2 text-right">Coins</th>
                            <th className="p-2 text-right">CROC</th>
                            <th className="p-2 text-right">Refs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((stat) => (
                            <tr key={stat.player_id} className="border-t border-border/50">
                                <td className="p-2">
                                    <div className="font-bold">{stat.players?.username || 'Anon'}</div>
                                    <div className="text-xs text-muted-foreground">{stat.players?.referral_code}</div>
                                </td>
                                <td className="p-2 text-right">{stat.total_coins?.toLocaleString()}</td>
                                <td className="p-2 text-right">{Number(stat.native_token_balance)?.toFixed(2)}</td>
                                <td className="p-2 text-right">{stat.referrals_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
