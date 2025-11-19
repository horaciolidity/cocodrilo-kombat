import React, { useState, useEffect } from "react";
import {
  Award,
  Crown,
  UserCircle2,
  Users2,
  Calendar,
  Globe2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/customSupabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function RankingView({ user }) {
  const [ranking, setRanking] = useState([]);
  const [activeTab, setActiveTab] = useState("global");
  const [loading, setLoading] = useState(true);

  const generateAvatarUrl = (seed) =>
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed || "anon"}&backgroundColor=transparent`;

  // 📌 Consulta OPTIMIZADA desde Supabase - SOLO jugadores reales
  const fetchRanking = async (scope = "global") => {
    try {
      setLoading(true);

      let query = supabase
        .from("player_stats")
        .select(
          `
            player_id,
            coins,
            level,
            updated_at,
            players!inner(
              id,
              username,
              avatar_url,
              created_at
            )
          `
        )
        .not('player_id', 'is', null) // Solo jugadores con ID válido
        .order("coins", { ascending: false })
        .limit(50);

      // 🔍 Filtros por scope
      if (scope === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("updated_at", weekAgo.toISOString());
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("❌ Error en consulta ranking:", error);
        setRanking([]);
        return;
      }

      // 🎯 PROCESAMIENTO AVANZADO - Eliminar duplicados y validar datos
      const uniquePlayers = processPlayerData(data || [], user?.id);
      setRanking(uniquePlayers);

    } catch (err) {
      console.error("❌ Error al cargar ranking:", err.message);
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };

  // 🧹 Función para procesar y limpiar datos de jugadores
  const processPlayerData = (rawData, currentUserId) => {
    const playerMap = new Map();

    rawData.forEach(row => {
      if (!row.players || !row.player_id) return;

      const playerId = row.player_id;
      
      // 🚨 Validación exhaustiva de datos
      if (!row.players.username || row.players.username.trim() === '') {
        console.warn('⚠️ Jugador sin username:', playerId);
        return;
      }

      // 🔄 Mantener solo el registro con más monedas si hay duplicados
      const existingPlayer = playerMap.get(playerId);
      if (!existingPlayer || row.coins > existingPlayer.coins) {
        playerMap.set(playerId, {
          id: playerId,
          name: row.players.username.trim(),
          avatar: row.players.avatar_url || generateAvatarUrl(row.players.username),
          coins: Number(row.coins) || 0,
          level: row.level || 1,
          isCurrentUser: playerId === currentUserId,
          lastActive: row.updated_at,
          createdAt: row.players.created_at
        });
      }
    });

    // 📊 Ordenar por monedas (descendente) y limitar a 20
    return Array.from(playerMap.values())
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 20);
  };

  // 🔁 Suscripción realtime MEJORADA
  useEffect(() => {
    fetchRanking(activeTab);

    const channel = supabase
      .channel("realtime-ranking-updates")
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "player_stats",
          filter: `coins=gt.0` // Solo escuchar cambios con monedas > 0
        },
        (payload) => {
          console.log("🔄 Actualización en tiempo real recibida:", payload);
          fetchRanking(activeTab);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('🎯 Suscrito a cambios del ranking');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  // ⭐ Medallas animadas (sin cambios)
  const Medal = ({ type }) => {
    const colors = {
      gold: "from-yellow-400 to-yellow-200",
      silver: "from-gray-300 to-gray-100",
      bronze: "from-amber-700 to-amber-500",
    };
    return (
      <motion.div
        className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors[type]} flex items-center justify-center shadow-lg ring-2 ring-white/30`}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <Sparkles className="w-3.5 h-3.5 text-white drop-shadow" />
      </motion.div>
    );
  };

  // 🎨 Render del ranking MEJORADO
  const renderRanking = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Cargando ranking...</span>
        </div>
      );
    }

    if (!ranking.length) {
      return (
        <div className="text-center py-8">
          <UserCircle2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay jugadores en el ranking aún</p>
          <p className="text-sm text-muted-foreground mt-2">
            ¡Sé el primero en aparecer aquí!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {ranking.map((player, index) => {
          const medal =
            index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null;

          return (
            <motion.div
              key={player.id}
              className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                player.isCurrentUser
                  ? "bg-primary/25 border border-primary shadow-md"
                  : "glass-effect border border-border"
              }`}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-center w-8 mr-3">
                {medal ? (
                  <Medal type={medal} />
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>

              <Avatar className="h-10 w-10 mr-3 border-2 border-border shadow">
                <AvatarImage src={player.avatar} alt={player.name} />
                <AvatarFallback>
                  {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-grow min-w-0">
                <p
                  className={`font-semibold truncate ${
                    player.isCurrentUser ? "text-primary" : "text-white"
                  }`}
                  title={player.name}
                >
                  {player.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nivel {player.level} • {player.coins.toLocaleString()} 💰
                </p>
              </div>

              {medal && (
                <motion.div
                  className="ml-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Crown
                    className={`w-6 h-6 ${
                      medal === "gold"
                        ? "text-yellow-400"
                        : medal === "silver"
                        ? "text-gray-300"
                        : "text-amber-700"
                    }`}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding fade-in">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <Award className="w-8 h-8 mr-3 text-yellow-400" /> 
          Ranking de Jugadores
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={activeTab === "global" ? "default" : "outline"}
            onClick={() => setActiveTab("global")}
            className="flex items-center gap-2"
          >
            <Globe2 className="w-4 h-4" /> Global
          </Button>

          <Button
            variant={activeTab === "weekly" ? "default" : "outline"}
            onClick={() => setActiveTab("weekly")}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Semanal
          </Button>

          <Button
            variant={activeTab === "friends" ? "default" : "outline"}
            onClick={() => setActiveTab("friends")}
            className="flex items-center gap-2"
            disabled
          >
            <Users2 className="w-4 h-4" /> Amigos
          </Button>
        </div>

        {/* Info del ranking actual */}
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            {activeTab === "global" 
              ? "Ranking global de todos los jugadores" 
              : activeTab === "weekly" 
              ? "Ranking semanal - últimos 7 días"
              : "Próximamente - Sistema de amigos"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Mostrando {ranking.length} jugador{ranking.length !== 1 ? 'es' : ''} real{ranking.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <div className="stats-card rounded-xl p-4 md:p-6 backdrop-blur-lg overflow-hidden">
          {renderRanking()}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          🕹️ El ranking se actualiza en tiempo real. ¡Subí tus monedas y entrá al top!
        </p>
      </div>
    </div>
  );
}