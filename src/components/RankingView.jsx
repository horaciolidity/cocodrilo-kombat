import React from 'react';
import { Award, UserCircle2 } from 'lucide-react';
import { RANKING_DATA } from '@/config/gameConfig';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RankingView({ user, gameState }) {

  const generateAvatarUrl = (seed) => `https://api.dicebear.com/7.x/pixel-art/jsx?seed=${seed}&backgroundColor=transparent&backgroundType=gradientLinear&accessoriesProbability=0`;
  
  const currentUserScore = Math.floor(gameState.totalCoins);
  const updatedRankingData = RANKING_DATA.map(player => 
    player.isCurrentUser ? { ...player, score: currentUserScore, name: user ? user.email.split('@')[0] : 'Tú' } : player
  ).sort((a, b) => b.score - a.score);


  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <Award className="w-8 h-8 mr-3 text-yellow-400" /> Ranking de Jugadores
        </h1>

        <div className="stats-card rounded-xl p-4 md:p-6 space-y-4">
          {updatedRankingData.map((player, index) => (
            <div 
              key={player.id} 
              className={`flex items-center p-3 rounded-lg transition-all duration-300 hover-lift ${
                player.isCurrentUser ? 'bg-primary/20 border-2 border-primary' : 'glass-effect'
              }`}
            >
              <span className={`text-xl font-bold mr-3 w-8 text-center ${
                index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-yellow-600' : 'text-muted-foreground'
              }`}>
                {index + 1}
              </span>
              <Avatar className="h-10 w-10 mr-3 border-2 border-border">
                <AvatarImage src={generateAvatarUrl(player.avatarSeed)} alt={player.name} />
                <AvatarFallback>
                  {player.name ? player.name.substring(0, 2).toUpperCase() : <UserCircle2 />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className={`font-semibold ${player.isCurrentUser ? 'text-primary' : ''}`}>{player.name}</p>
                <p className="text-xs text-muted-foreground">Puntuación: {player.score.toLocaleString()}</p>
              </div>
              {index === 0 && <Award className="w-6 h-6 text-yellow-400 ml-auto" />}
              {index === 1 && <Award className="w-6 h-6 text-gray-300 ml-auto" />}
              {index === 2 && <Award className="w-6 h-6 text-yellow-600 ml-auto" />}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">El ranking se actualiza según tu puntuación total. Los otros jugadores son simulados.</p>
      </div>
    </div>
  );
}