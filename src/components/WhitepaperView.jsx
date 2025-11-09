import React from 'react';
import { FileText, Map, Users, ShieldCheck, BarChartHorizontalBig, Lightbulb, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WhitepaperView() {
  const sections = [
    { 
      id: 'introduction', 
      title: 'Introducción al Ecosistema Cocodrilo Kombat', 
      icon: BookOpen,
      content: [
        "Cocodrilo Kombat es más que un simple juego de clics. Es una experiencia inmersiva diseñada para fusionar la diversión adictiva con las posibilidades de la Web3 (aunque esta versión es frontend-only).",
        "Nuestra misión es crear una comunidad vibrante y un ecosistema sostenible donde los jugadores puedan jugar, competir y, eventualmente, ganar recompensas significativas.",
        "Este documento describe nuestra visión, la mecánica del juego, la tokenómica (simulada) y nuestra hoja de ruta para el futuro."
      ],
      image: "Cocodrilo leyendo un libro grande sobre estrategia de juego"
    },
    { 
      id: 'gameplay', 
      title: 'Mecánica del Juego y Características', 
      icon: Lightbulb,
      content: [
        "**Clics y Puntos:** La mecánica central gira en torno a hacer clic en el cocodrilo para acumular monedas del juego.",
        "**Mejoras:** Los jugadores pueden usar monedas para comprar mejoras que aumentan el poder de clic o generan ingresos pasivos.",
        "**Misiones y Cartas:** Completa misiones para ganar recompensas, incluyendo cartas especiales que otorgan bonificaciones únicas.",
        "**Skins e Ítems:** Personaliza tu cocodrilo con skins y equípalo con ítems para mejorar el farmeo.",
        "**Ranking y Competición:** Compite con otros jugadores por el primer puesto en el ranking global."
      ],
      image: "Diagrama de flujo de la mecánica del juego Cocodrilo Kombat"
    },
    { 
      id: 'tokenomics', 
      title: 'Token CROC y Utilidad (Simulado)', 
      icon: BarChartHorizontalBig,
      content: [
        "**Suministro Total:** 1,000,000,000 CROC.",
        "**Distribución (Ejemplo):** Fairlaunch (40%), Recompensas del Juego (30%), Liquidez (15%), Marketing (10%), Equipo (5% - con vesting).",
        "**Utilidad del Token:** Comprar ítems exclusivos en la tienda, participar en eventos especiales, staking para obtener recompensas, gobernanza (futuro).",
        "**Mecanismos de Quema:** Un porcentaje de las transacciones en la tienda y otras actividades se quemarán para reducir el suministro."
      ],
      image: "Gráfico circular mostrando la distribución del token CROC"
    },
    { 
      id: 'roadmap', 
      title: 'Hoja de Ruta del Proyecto', 
      icon: Map,
      content: [
        "**Fase 1 (Actual):** Lanzamiento del juego base, sistema de mejoras, misiones, ranking, tienda de skins/ítems, fairlaunch del token CROC.",
        "**Fase 2:** Integración completa con wallet Web3, staking de tokens CROC, eventos especiales en el juego, sistema de referidos.",
        "**Fase 3:** Introducción de NFTs (skins, cartas especiales), mercado P2P, torneos con premios en CROC.",
        "**Fase 4:** Desarrollo de mecánicas de gobernanza, expansión del ecosistema con mini-juegos, colaboraciones estratégicas."
      ],
      image: "Hoja de ruta visual con hitos del proyecto Cocodrilo Kombat"
    },
    { 
      id: 'team', 
      title: 'Nuestro Equipo (Ejemplo)', 
      icon: Users,
      content: [
        "**Coco Dev:** Desarrollador principal con pasión por los juegos y la Web3.",
        "**Gator Artist:** Artista talentoso detrás del diseño visual de Cocodrilo Kombat.",
        "**Swamp Marketer:** Estratega de marketing encargado de hacer crecer la comunidad.",
        "Creemos en la transparencia y estamos comprometidos a construir un proyecto a largo plazo con nuestra comunidad."
      ],
      image: "Equipo de desarrollo de Cocodrilo Kombat trabajando juntos"
    },
     { 
      id: 'security', 
      title: 'Seguridad y Transparencia', 
      icon: ShieldCheck,
      content: [
        "La seguridad de nuestros jugadores y sus activos (futuros) es nuestra máxima prioridad.",
        "Aunque esta versión es frontend y usa localStorage, planeamos auditorías de contratos inteligentes para futuras integraciones Web3.",
        "Comunicación abierta y constante con la comunidad a través de nuestros canales oficiales.",
        "Publicación regular de actualizaciones de progreso y finanzas del proyecto (simulado)."
      ],
      image: "Escudo protegiendo los activos digitales del juego Cocodrilo Kombat"
    }
  ];

  const handleDownloadWhitepaper = () => {
    alert("🚧 La descarga del Whitepaper (PDF) aún no está implementada. ¡Pero puedes leerlo aquí! 🚀");
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center gradient-text flex items-center justify-center">
          <FileText className="w-8 h-8 md:w-10 md:h-10 mr-3 text-blue-400" /> Whitepaper y Roadmap
        </h1>
        <div className="text-center mb-8">
            <Button onClick={handleDownloadWhitepaper} className="bg-primary hover:bg-primary/80 text-primary-foreground mobile-button">
                <FileText className="w-4 h-4 mr-2"/> Descargar Whitepaper (Simulado)
            </Button>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} className="stats-card rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-primary">
                <section.icon className="w-7 h-7 mr-3" /> {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-3 space-y-3 text-muted-foreground text-sm">
                    {section.content.map((paragraph, index) => (
                    <p key={index}>{paragraph.startsWith('**') ? <strong>{paragraph.substring(2, paragraph.indexOf(':', 2)+1)}</strong> : ''}{paragraph.substring(paragraph.startsWith('**') ? paragraph.indexOf(':', 2)+1 : 0)}</p>
                    ))}
                </div>
                <div className="md:col-span-2 flex items-center justify-center">
                    <img  alt={section.title} class="rounded-lg shadow-md w-full h-auto max-h-60 object-contain" src="https://images.unsplash.com/photo-1572157923338-da124589dec1" />
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}