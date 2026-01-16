// src/components/RankingView.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import {
  Award,
  Crown,
  Users2,
  Calendar,
  Globe2,
  Sparkles,
  RefreshCw,
  Trophy,
  TrendingUp,
  Coins,
  Zap,
  Target,
  Medal,
  Flame,
  Star,
  Shield,
  Clock,
  Activity,
  BarChart3,
  Eye,
  ChevronRight,
  Filter,
  Search,
  ArrowUpDown,
  UserCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function RankingView({
  user,
  player,
  tokenPrice = 0.05,
  refreshInterval = 120000,
  loadRanking,
  refreshRanking,
  gameDataState
}) {
  const { toast } = useToast();

  const [ranking, setRanking] = useState([]);
  const [activeTab, setActiveTab] = useState("global");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("coins");
  const [sortDirection, setSortDirection] = useState("desc");
  const [stats, setStats] = useState({
    totalPlayers: 0,
    averageCoins: 0,
    topPlayer: null,
    recentActivity: 0
  });

  const rankingRef = useRef([]);
  const statsRef = useRef({ totalPlayers: 0, averageCoins: 0, topPlayer: null, recentActivity: 0 });
  const isInitialLoadRef = useRef(true);
  const updateInProgressRef = useRef(false);
  const topThreeCacheRef = useRef([]); // Cache para el top 3

  const userGameData = useMemo(() => gameDataState || {
    coins: 0,
    level: 1,
    nativeTokenBalance: 0,
    totalCoins: 0,
    clicks: 0,
    lastActive: null
  }, [gameDataState]);

  const formatDate = (dateString) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }

    if (rankingRef.current.length > 0) {
      const sortedData = [...rankingRef.current].sort((a, b) => {
        let valueA = a[column] || 0;
        let valueB = b[column] || 0;

        if (sortDirection === "desc") {
          return valueB - valueA;
        } else {
          return valueA - valueB;
        }
      });

      setRanking(sortedData);
    }
  };

  const getCurrentUserRank = useCallback(() => {
    if (!user || !player) return null;

    const userRank = ranking.findIndex(p =>
      p.user_id === user.id ||
      p.name.toLowerCase().includes(player.username?.toLowerCase() || "")
    );

    return userRank >= 0 ? userRank + 1 : null;
  }, [ranking, user, player]);

  const calculateStats = useCallback((data) => {
    if (!data || data.length === 0) {
      const newStats = {
        totalPlayers: 0,
        averageCoins: 0,
        topPlayer: null,
        recentActivity: 0
      };

      if (JSON.stringify(newStats) !== JSON.stringify(statsRef.current)) {
        statsRef.current = newStats;
        setStats(newStats);
      }
      return;
    }

    const totalCoins = data.reduce((sum, player) => sum + (player.coins || 0), 0);
    const recentPlayers = data.filter(p => {
      if (!p.lastActive) return false;
      const lastActive = new Date(p.lastActive);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActive > weekAgo;
    }).length;

    const newStats = {
      totalPlayers: data.length,
      averageCoins: Math.floor(totalCoins / data.length),
      topPlayer: data[0] || null,
      recentActivity: Math.floor((recentPlayers / data.length) * 100)
    };

    if (JSON.stringify(newStats) !== JSON.stringify(statsRef.current)) {
      statsRef.current = newStats;
      setStats(newStats);
    }
  }, []);

  const updateBackgroundData = useCallback((rankingData) => {
    if (!rankingData || rankingData.length === 0) {
      rankingRef.current = [];
      return;
    }

    const sortedData = [...rankingData].sort((a, b) => {
      let valueA = a[sortBy] || 0;
      let valueB = b[sortBy] || 0;

      if (sortDirection === "desc") {
        return valueB - valueA;
      } else {
        return valueA - valueB;
      }
    });

    rankingRef.current = sortedData;
    calculateStats(sortedData);
  }, [sortBy, sortDirection, calculateStats]);

  const syncDataToUI = useCallback(() => {
    if (rankingRef.current.length === 0) return;

    setTimeout(() => {
      setRanking([...rankingRef.current]);
      setLastUpdated(new Date().toISOString());
    }, 50);
  }, []);

  const fetchRanking = useCallback(async (scope = "global", showLoading = false) => {
    if (updateInProgressRef.current) return;

    try {
      updateInProgressRef.current = true;

      if (showLoading && isInitialLoadRef.current) {
        setLoading(true);
      }

      setError(null);

      if (!loadRanking) {
        throw new Error("Función loadRanking no disponible");
      }

      const rankingData = await loadRanking(scope);

      if (rankingData && rankingData.length > 0) {
        updateBackgroundData(rankingData);
        syncDataToUI();
      } else {
        rankingRef.current = [];
        setRanking([]);
      }

      isInitialLoadRef.current = false;

    } catch (err) {
      console.error("❌ Error al cargar ranking:", err);
      setError("Error al cargar el ranking. Intenta nuevamente.");

      if (isInitialLoadRef.current) {
        toast({
          title: "❌ Error de conexión",
          description: "No se pudo cargar el ranking. Verifica tu conexión.",
          duration: 3000,
        });
      }
    } finally {
      if (showLoading && isInitialLoadRef.current) {
        setLoading(false);
      }
      updateInProgressRef.current = false;
    }
  }, [loadRanking, updateBackgroundData, syncDataToUI, toast]);

  const refreshRankingData = useCallback(async () => {
    if (!refreshRanking || updateInProgressRef.current) return;

    console.log("🔄 Refrescando ranking...");

    try {
      updateInProgressRef.current = true;

      const rankingData = await refreshRanking(activeTab);

      if (rankingData && rankingData.length > 0) {
        updateBackgroundData(rankingData);
        syncDataToUI();

        toast({
          title: "✅ Ranking actualizado",
          description: "Los datos han sido actualizados.",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error("❌ Error al refrescar ranking:", err);
      toast({
        title: "⚠️ Error al actualizar",
        description: "No se pudo actualizar el ranking. Usando datos en caché.",
        duration: 3000,
      });
    } finally {
      updateInProgressRef.current = false;
    }
  }, [refreshRanking, activeTab, updateBackgroundData, syncDataToUI, toast]);

  useEffect(() => {
    fetchRanking(activeTab, true);
  }, [activeTab, fetchRanking]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !updateInProgressRef.current) {
        (async () => {
          try {
            if (!loadRanking) return;

            const rankingData = await loadRanking(activeTab);

            if (rankingData && rankingData.length > 0) {
              updateBackgroundData(rankingData);
            }
          } catch (err) {
            console.error("🔄 Error en actualización automática (fondo):", err);
          }
        })();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [activeTab, refreshInterval, loadRanking, updateBackgroundData]);

  // 🐊 Deterministic Avatar Selection
  const getCrocAvatar = useCallback((playerId) => {
    if (!playerId) return "/avatars/1.png";
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % 4) + 1; // 1 to 4
    return `/avatars/${index}.png`;
  }, []);

  // 🥇 Top 3 Players - Versión optimizada y estable
  const TopThreePlayers = memo(() => {
    // ... (keep topThree memo logic) ...
    const topThree = useMemo(() => {
      if (ranking.length >= 3) {
        const newTopThree = [ranking[1], ranking[0], ranking[2]];

        // Comparar con caché anterior
        const hasChanged = topThreeCacheRef.current.length === 0 ||
          topThreeCacheRef.current[0]?.id !== newTopThree[0]?.id ||
          topThreeCacheRef.current[1]?.id !== newTopThree[1]?.id ||
          topThreeCacheRef.current[2]?.id !== newTopThree[2]?.id ||
          topThreeCacheRef.current[0]?.coins !== newTopThree[0]?.coins ||
          topThreeCacheRef.current[1]?.coins !== newTopThree[1]?.coins ||
          topThreeCacheRef.current[2]?.coins !== newTopThree[2]?.coins;

        if (hasChanged) {
          console.log("🏆 Top 3 actualizado");
          topThreeCacheRef.current = newTopThree;
          return newTopThree;
        }
        return topThreeCacheRef.current;
      }
      return [];
    }, [ranking]);

    if (topThree.length < 3) {
      // ... (keep loading state) ...
      return (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            Podium del Ranking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((pos) => (
              <div key={pos} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30 h-64 animate-pulse"></div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          Podium del Ranking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((player, idx) => {
            const position = [2, 1, 3][idx];
            const isTop = position === 1;

            return (
              <div
                key={`${player.id}-${position}`}
                className={`relative rounded-xl p-4 border-2 ${isTop
                  ? 'md:col-span-1 md:row-span-2 bg-gradient-to-b from-yellow-900/20 to-yellow-800/10 border-yellow-600/30 shadow-xl'
                  : 'bg-gradient-to-b from-gray-900/20 to-gray-800/10 border-gray-700/30'
                  }`}
              >
                <div className="absolute top-4 right-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${position === 1 ? 'bg-yellow-500' : position === 2 ? 'bg-gray-400' : 'bg-amber-600'
                    }`}>
                    <span className="text-2xl">
                      {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className={`h-20 w-20 mb-3 border-4 ${isTop ? 'border-yellow-500' : 'border-gray-600'
                    } rounded-full overflow-hidden bg-black/40`}>
                    <img
                      src={getCrocAvatar(player.id)}
                      alt={player.name}
                      className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/avatars/1.png";
                      }}
                    />
                  </div>

                  <h4 className={`font-bold ${isTop ? 'text-xl text-yellow-300' : 'text-lg text-white'
                    }`}>
                    {player.name}
                  </h4>
                  {/* ... stats ... */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Coins className="w-3 h-3 text-yellow-400" />
                      <span className="font-semibold">{player.coins.toLocaleString()} 💰</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Trophy className="w-3 h-3" />
                      <span>Nv. {player.level}</span>
                    </div>
                  </div>
                </div>

                {isTop && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-yellow-400/50">
                    🏆 REY DEL PANTANO
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  // 👤 Info del usuario actual
  const CurrentUserCard = () => {
    // ...
    if (!user || !player) {
      // ... (Guest View)
      return (
        <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-amber-800/30 rounded-xl border border-yellow-700/30 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-300">Modo Invitado</h3>
                <p className="text-sm text-yellow-200/70">Inicia sesión para aparecer en el ranking</p>
              </div>
            </div>
            <Shield className="w-5 h-5 text-yellow-500/50" />
          </div>
        </div>
      );
    }

    const currentRank = getCurrentUserRank();
    const userData = ranking.find(p => p.isCurrentUser) || {
      name: player.username,
      coins: userGameData.coins || 0,
      level: userGameData.level || 1,
      tokens: userGameData.nativeTokenBalance || 0,
      lastActive: userGameData.lastActive || new Date().toISOString()
    };

    return (
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-primary/15 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Tu Posición
              </h3>
              <div className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                {currentRank ? `#${currentRank}` : "No clasificado"}
              </div>
            </div>

            <Avatar className="h-14 w-14 border-2 border-primary/50">
              <AvatarImage
                src={getCrocAvatar(user.id)}
                alt={player.username}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatars/1.png";
                }}
              />
              <AvatarFallback className="bg-primary/20 text-primary">
                {player.username?.substring(0, 2).toUpperCase() || "TU"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h4 className="font-bold text-lg">{player.username}</h4>
              <div className="flex flex-wrap gap-2 mt-1 text-sm">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Coins className="w-3 h-3" />
                  {userData.coins.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Trophy className="w-3 h-3" />
                  Nv. {userData.level}
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <Zap className="w-3 h-3" />
                  {userData.tokens.toLocaleString()} CROC
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-xl border border-gray-700/30">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Rendimiento
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Monedas/h</div>
              <div className="text-lg font-bold text-yellow-400">
                {Math.floor(userData.coins / 100).toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Valor CROC</div>
              <div className="text-lg font-bold text-green-400">
                ${(userData.tokens * tokenPrice).toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Actividad</div>
              <div className="text-lg font-bold text-blue-400">
                {formatDate(userData.lastActive)}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div >
    );
};

// 📋 Renderizar lista de ranking
const renderRankingList = () => {
  if (loading && ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Cargando ranking global...</p>
        <p className="text-xs text-muted-foreground">Obteniendo datos en tiempo real</p>
      </div>
    );
  }

  if (error && ranking.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-900/30 rounded-full flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">Error de conexión</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          No se pudo cargar el ranking. Verifica tu conexión a internet.
        </p>
        <Button
          onClick={() => fetchRanking(activeTab, true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-800/30 rounded-full flex items-center justify-center">
          <Users2 className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-400 mb-2">¡Sé el primero!</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Aún no hay jugadores en el ranking. ¡Sé el primero en aparecer aquí!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="default" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Comenzar a Jugar
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Ver Tutorial
          </Button>
        </div>
      </div>
    );
  }

  const filteredRanking = ranking.filter(player =>
    player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredRanking.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">No se encontraron jugadores con "{searchQuery}"</p>
      </div>
    );
  }

  const rankingToShow = filteredRanking.slice(3);

  return (
    <div className="space-y-3">
      {rankingToShow.map((player, index) => {
        const rank = index + 4;
        const isCurrentUser = player.isCurrentUser;

        return (
          <div
            key={player.id}
            className={`group relative flex items-center p-4 rounded-xl transition-all duration-500 ${isCurrentUser
              ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-lg'
              : 'bg-gradient-to-r from-gray-800/30 to-gray-900/30 border border-gray-700/30 hover:border-gray-600/50'
              }`}
          >
            <div className="flex items-center justify-center w-10 mr-3">
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${rank <= 10
                ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20'
                : 'bg-gray-800/50'
                }`}>
                <span className={`font-bold text-sm ${rank <= 10 ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                  {rank}
                </span>
              </div>
            </div>

            <Avatar className="h-12 w-12 mr-3 border-2 border-gray-700 shadow-lg">
              <AvatarImage
                src={getCrocAvatar(player.id)}
                alt={player.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/avatars/1.png";
                }}
              />
              <AvatarFallback className="bg-gray-800 text-gray-300">
                {player.name?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-white'
                      }`}
                    title={player.name}
                  >
                    {player.name || "Jugador"} {isCurrentUser && "⭐"}
                  </p>

                  {rank <= 3 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                      TOP {rank}
                    </span>
                  )}

                  {(player.level || 0) >= 50 && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                      MAESTRO
                    </span>
                  )}
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {(player.coins || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${((player.coins || 0) * 0.001).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1 text-gray-400">
                  <Trophy className="w-3 h-3" />
                  <span>Nv. {player.level || 1}</span>
                </div>

                <div className="flex items-center gap-1 text-green-400">
                  <Zap className="w-3 h-3" />
                  <span>{(player.tokens || 0).toLocaleString()} CROC</span>
                </div>

                <div className="flex items-center gap-1 text-blue-400">
                  <Target className="w-3 h-3" />
                  <span>{(player.clicks || 0).toLocaleString()} clics</span>
                </div>

                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(player.lastActive)}</span>
                </div>
              </div>
            </div>

            <div className="md:hidden ml-3">
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-400">
                  {(player.coins || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">monedas</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

return (
  <div className="min-h-screen game-bg p-4 mobile-padding">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 blur-3xl" />
            <Award className="w-16 h-16 relative z-10 text-yellow-400 mx-auto" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Ranking Global
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compite con jugadores de todo el mundo y demuestra tu dominio del pantano
          </p>
        </div>
      </div>

      <CurrentUserCard />

      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stats-card rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users2 className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{stats.totalPlayers}</span>
            </div>
            <div className="text-xs text-gray-400">Jugadores Totales</div>
          </div>

          <div className="stats-card rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">
                {Math.floor(stats.averageCoins / 1000)}k
              </span>
            </div>
            <div className="text-xs text-gray-400">Promedio de Monedas</div>
          </div>

          <div className="stats-card rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-green-400">{stats.recentActivity}%</span>
            </div>
            <div className="text-xs text-gray-400">Actividad (7 días)</div>
          </div>

          <div className="stats-card rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">
                {stats.topPlayer ? (stats.topPlayer.coins / 1000).toFixed(0) + 'k' : '0'}
              </span>
            </div>
            <div className="text-xs text-gray-400">Récord Actual</div>
          </div>
        </div>
      </div>

      <TopThreePlayers />

      <div className="mb-6">
        <div className="stats-card rounded-xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar jugador..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 bg-gray-800/50 border-gray-700"
                />
              </div>
            </div>

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
                variant={activeTab === "monthly" ? "default" : "outline"}
                onClick={() => setActiveTab("monthly")}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4" /> Mensual
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSort("coins")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden sm:inline">Ordenar</span>
              </Button>

              <Button
                onClick={refreshRankingData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Ranking {activeTab === "global" ? "Global" : activeTab === "weekly" ? "Semanal" : "Mensual"}
              </h3>
              <p className="text-sm text-gray-400">
                {sortDirection === "desc" ? "Mayor a menor" : "Menor a mayor"} por {sortBy === "coins" ? "monedas" : sortBy}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Última actualización</div>
                <div className="text-sm font-semibold">
                  {lastUpdated ? formatDate(lastUpdated) : "Cargando..."}
                </div>
              </div>
              <div className="hidden md:block text-xs text-gray-500 px-2 py-1 bg-gray-800/50 rounded">
                🎯 Datos centralizados
              </div>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-12 gap-4 mb-3 px-4 text-sm text-gray-500">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">JUGADOR</div>
            <div className="col-span-2 text-center">NIVEL</div>
            <div className="col-span-2 text-center">MONEDAS</div>
            <div className="col-span-2 text-center">ACTIVIDAD</div>
          </div>

          <div className="max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
            {renderRankingList()}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/30">
            <div className="text-sm text-gray-400">
              Mostrando {Math.min(ranking.length, 20)} de {stats.totalPlayers} jugadores
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-700/30">
          <h4 className="font-bold mb-3 flex items-center gap-2 text-blue-300">
            <Sparkles className="w-4 h-4" />
            Cómo subir en el ranking
          </h4>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Compra mejoras para aumentar tus ganancias</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Completa misiones diarias y logros</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Haz staking de tus tokens CROC</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Invita amigos para obtener bonificaciones</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 rounded-xl border border-yellow-700/30">
          <h4 className="font-bold mb-3 flex items-center gap-2 text-yellow-300">
            <Trophy className="w-4 h-4" />
            Premios y Recompensas
          </h4>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-yellow-500" />
              <span><strong>🥇 Oro:</strong> Insignia exclusiva + 1000 CROC</span>
            </li>
            <li className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-gray-400" />
              <span><strong>🥈 Plata:</strong> 500 CROC + skin especial</span>
            </li>
            <li className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-amber-600" />
              <span><strong>🥉 Bronce:</strong> 250 CROC + boost temporal</span>
            </li>
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span><strong>Top 10:</strong> Recompensas semanales</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-800/20 rounded-xl border border-green-700/30">
          <h4 className="font-bold mb-3 flex items-center gap-2 text-green-300">
            <RefreshCw className="w-4 h-4" />
            Sistema de Ranking
          </h4>
          <div className="text-sm text-gray-400 space-y-2">
            <p>El ranking se actualiza automáticamente cada 2 minutos.</p>
            <p>Los puntos se calculan en base a:</p>
            <ul className="space-y-1 ml-4">
              <li>• Monedas totales (50%)</li>
              <li>• Nivel del jugador (30%)</li>
              <li>• Tokens CROC (20%)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}