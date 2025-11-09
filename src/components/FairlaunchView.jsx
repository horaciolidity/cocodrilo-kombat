import React from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Zap, Users, Shield, ExternalLink, CalendarDays, Clock } from 'lucide-react';

export function FairlaunchView({ toast }) {
  const handleParticipate = () => {
    toast({
      title: "🚀 ¡Participa en el Fairlaunch!",
      description: "Esta función te redirigirá a la plataforma de Fairlaunch. ¡Prepárate para el despegue de CROC!",
      duration: 5000,
    });
  };

  const fairlaunchDetails = {
    startDate: "2025-07-01 14:00 UTC",
    endDate: "2025-07-07 14:00 UTC",
    totalTokens: "100,000,000 CROC",
    maxContribution: "10 ETH / 50 BNB (Ejemplo)",
    minContribution: "0.1 ETH / 0.5 BNB (Ejemplo)",
    platformLink: "#", 
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <Rocket className="w-8 h-8 md:w-10 md:h-10 mr-3 text-purple-400" /> Fairlaunch del Token CROC
        </h1>

        <div className="stats-card rounded-xl p-6 md:p-8 space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              ¡Únete al lanzamiento justo de nuestro token CROC y sé parte de la comunidad Cocodrilo Kombat desde el inicio!
            </p>
            <img  alt="Cocodrilo astronauta listo para el despegue" class="mx-auto my-6 rounded-lg shadow-xl w-full max-w-sm h-auto" src="https://images.unsplash.com/photo-1575287907212-660f19f54a9a" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard icon={CalendarDays} title="Fecha de Inicio" value={fairlaunchDetails.startDate} />
            <InfoCard icon={Clock} title="Fecha de Fin" value={fairlaunchDetails.endDate} />
            <InfoCard icon={Zap} title="Tokens Totales" value={fairlaunchDetails.totalTokens} />
            <InfoCard icon={Users} title="Plataforma" value="Pinksale / GemPad (Ejemplo)" />
          </div>
          
          <div className="border-t border-border pt-6 space-y-3">
            <h3 className="text-xl font-semibold text-primary">¿Por qué un Fairlaunch?</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
              <li>Distribución equitativa de tokens para la comunidad.</li>
              <li>Sin preventas privadas ni asignaciones grandes a equipos.</li>
              <li>Transparencia total en el proceso de lanzamiento.</li>
              <li>Oportunidad para todos de adquirir CROC al mismo precio inicial.</li>
            </ul>
          </div>

          <div className="border-t border-border pt-6">
             <h3 className="text-xl font-semibold text-primary mb-3">Detalles de Contribución (Ejemplo)</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <DetailItem label="Contribución Máxima:" value={fairlaunchDetails.maxContribution} />
                <DetailItem label="Contribución Mínima:" value={fairlaunchDetails.minContribution} />
             </div>
          </div>


          <Button 
            onClick={handleParticipate} 
            size="lg" 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white mobile-button sparkle-effect"
          >
            <ExternalLink className="w-5 h-5 mr-2" /> ¡Participar Ahora!
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Nota: Los detalles del Fairlaunch son ilustrativos. Consulta los canales oficiales para información actualizada.
        </p>
      </div>
    </div>
  );
}

const InfoCard = ({ icon: Icon, title, value }) => (
  <div className="glass-effect p-4 rounded-lg">
    <div className="flex items-center mb-2">
      <Icon className="w-5 h-5 mr-2 text-primary" />
      <h4 className="font-semibold text-md">{title}</h4>
    </div>
    <p className="text-sm text-muted-foreground">{value}</p>
  </div>
);

const DetailItem = ({ label, value }) => (
    <div className="glass-effect p-3 rounded-md">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-primary">{value}</p>
    </div>
);