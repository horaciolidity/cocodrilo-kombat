import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  Crown,
  UserCircle2,
  Users2,
  Calendar,
  Globe2,
  Sparkles,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function RankingView({ user, player, gameState, stats }) {
  const [ranking, setRanking] = useState([]);
  const [activeTab, setActiveTab] = useState("global");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const generateAvatarUrl = useCallback((seed) =>
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed || "anon"}&backgroundColor=transparent`
  , []);

  // 📌 Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 📌 Consulta MEJORADA con arquitectura centralizada
  const fetchRanking = useCallback(async (scope = "global") => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Cargando ranking para tab:", scope);
      
      let query = supabase
        .from("player_stats")
        .select(`
          player_id,
          coins,
          level,
          clicks,
          native_token_balance,
          total_coins,
          updated_at,
          players (
            id,
            username,
            avatar_url,
            user_id
          )
        `)
        .order("coins", { ascending: false })
        .limit(50);

      if (scope === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("updated_at", weekAgo.toISOString());
      }

      const { data, error: queryError } = await query;
      
      if (queryError) {
        console.error("❌ Error en consulta ranking:", queryError);
        setError("Error al cargar el ranking");
        setRanking([]);
        return;
      }

      console.log("📊 Datos obtenidos:", data?.length, "registros");

      if (!data || data.length === 0) {
        console.warn("⚠️ No se encontraron datos de ranking");
        setRanking([]);
        setLastUpdated(new Date().toISOString());
        return;
      }

      // 🎯 PROCESAMIENTO MEJORADO
      const processedRanking = processPlayerData(data, user?.id);
      
      console.log("🏆 Ranking procesado:", processedRanking.length, "jugadores");
      
      setRanking(processedRanking);
      setLastUpdated(new Date().toISOString());

    } catch (err) {
      console.error("❌ Error al cargar ranking:", err);
      setError("Error inesperado al cargar el ranking");
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 🧹 Función para procesar datos de jugadores
  const processPlayerData = (rawData, currentUserId) => {
    const playerMap = new Map();

    rawData.forEach(row => {
      if (!row.players || !row.player_id) {
        console.warn("⚠️ Fila sin datos completos:", row);
        return;
      }

      const playerId = row.player_id;
      const playerInfo = row.players;
      
      // Validar datos básicos
      if (!playerInfo.username || playerInfo.username.trim() === '') {
        console.warn('⚠️ Jugador sin username:', playerId);
        return;
      }

      const coinsValue = Number(row.coins) || 0;
      const levelValue = Number(row.level) || 1;
      const tokensValue = Number(row.native_token_balance) || 0;
      const totalCoinsValue = Number(row.total_coins) || 0;
      const clicksValue = Number(row.clicks) || 0;

      // ✅ Identificar si es el usuario actual
      const isCurrentUser = playerInfo.user_id === currentUserId;
      
      // Si ya tenemos este jugador, mantener el mejor puntaje
      const existingPlayer = playerMap.get(playerId);
      
      if (!existingPlayer || coinsValue > existingPlayer.coins) {
        playerMap.set(playerId, {
          id: playerId,
          name: playerInfo.username.trim(),
          avatar: playerInfo.avatar_url || generateAvatarUrl(playerInfo.username),
          coins: coinsValue,
          level: levelValue,
          tokens: tokensValue,
          totalCoins: totalCoinsValue,
          clicks: clicksValue,
          isCurrentUser: isCurrentUser,
          lastActive: row.updated_at,
          user_id: playerInfo.user_id
        });

        if (isCurrentUser) {
          console.log("🎯 JUGADOR ACTUAL EN RANKING:", {
            name: playerInfo.username,
            coins: coinsValue,
            tokens: tokensValue,
            level: levelValue
          });
        }
      }
    });

    // Ordenar por monedas (descendente) y limitar
    const sortedPlayers = Array.from(playerMap.values())
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 20);

    return sortedPlayers;
  };

  // 🔁 Cargar ranking cuando cambia la pestaña
  useEffect(() => {
    fetchRanking(activeTab);
  }, [activeTab, fetchRanking]);

  // 🔄 Suscripción realtime (opcional - solo si necesitas actualización en tiempo real)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-ranking-${activeTab}`)
      .on(
        "postgres_changes",
        { 
          event: "UPDATE",
          schema: "public", 
          table: "player_stats"
        },
        (payload) => {
          console.log("🔄 Cambio en tiempo real en player_stats:", payload);
          // Recargar ranking suavemente
          setTimeout(() => fetchRanking(activeTab), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, user, fetchRanking]);

  // ⭐ Medallas animadas
  const Medal = ({ type }) => {
    const colors = {
      gold: "from-yellow-400 to-yellow-200",
      silver: "from-gray-300 to-gray-100",
      bronze: "from-amber-700 to-amber-500",
    };
    
    const medalText = {
      gold: "🥇",
      silver: "🥈",
      bronze: "🥉"
    };
    
    return (
      <motion.div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[type]} flex items-center justify-center shadow-lg ring-2 ring-white/30`}
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <span className="text-lg font-bold">{medalText[type]}</span>
      </motion.div>
    );
  };

  // 🎨 Información de usuario actual
  const CurrentUserInfo = () => {
    if (!user) {
      return (
        <div className="p-4 bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg border border-blue-700/30 mb-4">
          <p className="text-center text-sm">
            <span className="text-yellow-400">⚠️</span> Inicia sesión para aparecer en el ranking
          </p>
        </div>
      );
    }

    const currentPlayerInRanking = ranking.find(p => p.isCurrentUser);
    const currentRank = currentPlayerInRanking 
      ? ranking.findIndex(p => p.id === currentPlayerInRanking.id) + 1
      : null;

    return (
      <motion.div 
        className="p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-3 md:mb-0">
            <Avatar className="h-12 w-12 mr-3 border-2 border-primary">
              <AvatarImage src={player?.avatar_url} alt={player?.username} />
              <AvatarFallback>
                {player?.username?.substring(0, 2).toUpperCase() || "TU"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg flex items-center">
                {player?.username || "Tú"} 
                {currentPlayerInRanking && <Sparkles className="w-4 h-4 ml-2 text-yellow-400" />}
              </h3>
              <p className="text-sm text-muted-foreground">
                Nivel {gameState?.level || 1} • {gameState?.coins?.toLocaleString() || 0} 💰
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {currentRank ? `#${currentRank}` : "No clasificado"}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentRank ? "Tu posición" : "Juega más para aparecer"}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // 🎨 Render del ranking
  const renderRanking = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-muted-foreground">Cargando ranking...</p>
          <p className="text-xs text-muted-foreground">Sincronizando con la nube</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-900/30 rounded-full flex items-center justify-center">
            <UserCircle2 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 mb-2">Error al cargar el ranking</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button 
            onClick={() => fetchRanking(activeTab)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
        </div>
      );
    }

    if (!ranking.length) {
      return (
        <div className="text-center py-12">
          <Trophy className="w-20 h-20 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground text-lg mb-2">¡El ranking está vacío!</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Sé el primero en aparecer aquí. Juega más para acumular monedas y subir en el ranking.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {ranking.map((player, index) => {
          const medal = index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null;
          const isCurrentUser = player.isCurrentUser;

          return (
            <motion.div
              key={`${player.id}-${index}`}
              className={`relative flex items-center p-4 rounded-xl transition-all duration-300 ${
                isCurrentUser
                  ? "bg-gradient-to-r from-primary/25 to-primary/10 border-2 border-primary shadow-xl"
                  : "glass-effect border border-border/50 hover:border-border/80"
              }`}
              whileHover={{ scale: 1.01, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {/* Posición */}
              <div className="flex items-center justify-center w-10 mr-3">
                {medal ? (
                  <Medal type={medal} />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCurrentUser ? "bg-primary/20" : "bg-gray-800/50"
                  }`}>
                    <span className={`font-bold ${
                      isCurrentUser ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-12 w-12 mr-3 border-2 border-border shadow-lg">
                <AvatarImage src={player.avatar} alt={player.name} />
                <AvatarFallback>
                  {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Información */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center">
                  <p
                    className={`font-semibold truncate ${
                      isCurrentUser ? "text-primary font-bold" : "text-white"
                    }`}
                    title={player.name}
                  >
                    {player.name} {isCurrentUser && <span className="ml-1">⭐</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                  <span>Nv. {player.level}</span>
                  <span>•</span>
                  <span className="text-yellow-400">{player.coins.toLocaleString()} 💰</span>
                  {player.tokens > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">{player.tokens.toLocaleString()} CROC</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actividad */}
              <div className="hidden md:block text-right ml-3">
                <p className="text-xs text-muted-foreground">
                  {formatDate(player.lastActive)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Award className="w-8 h-8 mr-3 text-yellow-400" /> 
            Ranking Global
          </motion.h1>
          <p className="text-muted-foreground">
            Compite con jugadores de todo el mundo y sube en el ranking
          </p>
        </div>

        {/* Información del usuario actual */}
        <CurrentUserInfo />

        {/* Controles */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Button
              variant={activeTab === "global" ? "default" : "outline"}
              onClick={() => setActiveTab("global")}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Globe2 className="w-4 h-4" /> Global
            </Button>

            <Button
              variant={activeTab === "weekly" ? "default" : "outline"}
              onClick={() => setActiveTab("weekly")}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" /> Semanal
            </Button>

            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Users2 className="w-4 h-4" /> Amigos (próximamente)
            </Button>
          </div>

          {/* Botón de actualización */}
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Actualizado: {formatDate(lastUpdated)}
              </p>
            )}
            <Button
              onClick={() => fetchRanking(activeTab)}
              variant="outline"
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Info del ranking */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-border/50">
          <div className="flex flex-wrap justify-center gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Tipo de ranking</p>
              <p className="font-semibold">
                {activeTab === "global" ? "Global (todos los tiempos)" : "Semanal (últimos 7 días)"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jugadores activos</p>
              <p className="font-semibold">{ranking.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monedas mínimas para top 10</p>
              <p className="font-semibold text-yellow-400">
                {ranking.length >= 10 ? ranking[9]?.coins?.toLocaleString() || "0" : "0"} 💰
              </p>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <motion.div 
          className="stats-card rounded-xl p-4 md:p-6 backdrop-blur-lg overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-400" />
              Top {ranking.length} Jugadores
            </h3>
            <div className="text-xs text-muted-foreground">
              Ordenado por monedas totales
            </div>
          </div>

          {renderRanking()}
        </motion.div>

        {/* Leyenda y consejos */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <h4 className="font-bold mb-2 text-sm flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
              Cómo subir en el ranking
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Haz clic para ganar monedas</li>
              <li>• Compra mejoras para aumentar tus ganancias</li>
              <li>• Completa misiones e hitos</li>
              <li>• Invita amigos para ganar bonos</li>
            </ul>
          </div>

          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <h4 className="font-bold mb-2 text-sm flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
              Premios del ranking
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 🥇 Oro: Reconocimiento especial</li>
              <li>• 🥈 Plata: Prestigio en la comunidad</li>
              <li>• 🥉 Bronze: Mención honorífica</li>
              <li>• Top 10: Visibilidad destacada</li>
            </ul>
          </div>

          <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <h4 className="font-bold mb-2 text-sm flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 text-blue-400" />
              Actualización
            </h4>
            <p className="text-xs text-muted-foreground">
              El ranking se actualiza automáticamente cada 30 segundos y cuando los jugadores realizan acciones importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}