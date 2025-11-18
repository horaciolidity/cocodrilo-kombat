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

  const MOCK_NAMES = [
    "Lucas (AR)", "Yuna (JP)", "Max (US)", "Nico (ES)", "Ravi (IN)",
    "Lena (DE)", "Kai (BR)", "Hiro (JP)", "Maya (MX)", "Leo (CL)",
    "Zara (UK)", "Tarek (EG)", "Sofia (IT)", "Andre (PT)", "Noah (CA)",
    "Aria (AU)", "Liam (UY)", "Nina (PE)", "Omar (MA)", "Ivan (RU)",
  ];

  // 📌 Consulta real desde Supabase
  const fetchRanking = async (scope = "global") => {
    try {
      setLoading(true);

      let query = supabase
        .from("player_stats")
        .select(
          `
            id,
            player_id,
            coins,
            level,
            updated_at,
            players:player_id (
              id,
              username,
              avatar_url
            )
          `
        )
        .order("coins", { ascending: false })
        .limit(20);

      if (scope === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("updated_at", weekAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const realPlayers = (data || []).map((row) => ({
        id: row.players?.id,
        name: row.players?.username || "Jugador Anónimo",
        avatar: row.players?.avatar_url || generateAvatarUrl(row.players?.username),
        coins: Number(row.coins) || 0,
        level: row.level || 1,
        isCurrentUser: row.players?.id === user?.id,
      }));

      // Si hay menos de 20 → llenar con mocks
      const missing = 20 - realPlayers.length;
      const mockPlayers = Array.from({ length: missing }, (_, i) => ({
        id: `mock-${i}`,
        name: MOCK_NAMES[i],
        avatar: generateAvatarUrl(MOCK_NAMES[i]),
        coins: Math.floor(Math.random() * 8000) + 100,
        level: Math.floor(Math.random() * 25) + 1,
        isCurrentUser: false,
      }));

      const combined = [...realPlayers, ...mockPlayers]
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 20);

      setRanking(combined);
    } catch (err) {
      console.error("❌ Error al cargar ranking:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Suscripción realtime
  useEffect(() => {
    fetchRanking(activeTab);

    const channel = supabase
      .channel("realtime-player-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_stats" },
        () => fetchRanking(activeTab)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeTab]);

  // ⭐ Medallas animadas
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

  // 🎨 Render del ranking
  const renderRanking = () => {
    if (loading)
      return <p className="text-center text-muted-foreground">Cargando...</p>;

    if (!ranking.length)
      return <p className="text-center text-muted-foreground">Sin jugadores aún 🐊</p>;

    return (
      <div className="space-y-3">
        {ranking.map((p, index) => {
          const medal =
            index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null;

          return (
            <motion.div
              key={p.id}
              className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                p.isCurrentUser
                  ? "bg-primary/25 border border-primary shadow-md"
                  : "glass-effect border border-border"
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-center w-8 mr-3">
                {medal ? <Medal type={medal} /> : <span className="text-sm">{index + 1}</span>}
              </div>

              <Avatar className="h-10 w-10 mr-3 border-2 border-border shadow">
                <AvatarImage src={p.avatar} alt={p.name} />
                <AvatarFallback>{p.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-grow">
                <p
                  className={`font-semibold ${
                    p.isCurrentUser ? "text-primary" : "text-white"
                  }`}
                >
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nivel {p.level} • {p.coins.toLocaleString()} 💰
                </p>
              </div>

              {medal && (
                <motion.div
                  className="ml-auto"
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
          <Award className="w-8 h-8 mr-3 text-yellow-400" /> Ranking de Jugadores
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
          >
            <Users2 className="w-4 h-4" /> Amigos
          </Button>
        </div>

        <div className="stats-card rounded-xl p-4 md:p-6 backdrop-blur-lg overflow-hidden">
          {renderRanking()}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          🕹️ El ranking se actualiza en tiempo real. ¡Subí tus monedas y entrá al top 3!
        </p>
      </div>
    </div>
  );
}
