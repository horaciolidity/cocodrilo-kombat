// src/components/WhitepaperView.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Map,
  Users,
  Shield,
  BarChart,
  Lightbulb,
  BookOpen,
  Download,
  ExternalLink,
  Globe,
  Target,
  Rocket,
  TrendingUp,
  Lock,
  Award,
  Code,
  Zap,
  PieChart,
  Calendar,
  Eye,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Building2,
  Heart,
  Wallet,
  Smartphone,
  Gamepad2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WhitepaperView() {
  const [expandedSection, setExpandedSection] = useState('introduction');
  const [downloading, setDownloading] = useState(false);

  const sections = [
    {
      id: 'executive-summary',
      title: '🏁 Resumen Ejecutivo',
      icon: Rocket,
      content: [
        {
          title: "Visión del Ecosistema",
          text: "Cocodrilo Kombat emerge como la evolución definitiva en el sector Play-to-Earn (P2E), fusionando la accesibilidad de las mecánicas 'Tap-to-Earn' con una economía circular robusta y sostenible. Nuestra visión trasciende el juego casual; construimos una puerta de entrada masiva hacia la adopción de Web3 en la red Optimism."
        },
        {
          title: "El Problema en GameFi Actual",
          text: "El mercado actual sufre de modelos inflacionarios insostenibles y experiencias de usuario (UX) complejas que alienan a los jugadores tradicionales. Gran parte de los proyectos carecen de liquidez profunda y accesibilidad en exchanges centralizados (CEX) de primer nivel, limitando su crecimiento."
        },
        {
          title: "Nuestra Solución Estratégica",
          text: "Implementamos un modelo de 'Sostenibilidad Primero': una economía deflacionaria respaldada por ingresos externos al juego (publicidad, partnerships) y listings estratégicos en exchanges Tier-1 (Binance, Bitget, Decrypto) para garantizar liquidez y volumen global."
        }
      ],
      stats: [
        { label: "Proyección CEX", value: "Binance/Bitget", icon: Building2 },
        { label: "Suministro Total", value: "1B CROC", icon: PieChart },
        { label: "Red", value: "Optimism", icon: Zap }
      ]
    },
    {
      id: 'strategic-roadmap',
      title: '🗺️ Hoja de Ruta y Listings',
      icon: Map,
      content: [
        {
          title: "Fase 1: Génesis y Fundación (Q4 2024)",
          text: "Lanzamiento del Fairlaunch en Pinksale. Auditoría de contratos inteligentes. Listing inicial en DEX (Uniswap V3, Velodrome) para establecer precio base. Campaña de marketing masivo en LATAM y Asia."
        },
        {
          title: "Fase 2: Expansión y CEX Tier-2 (Q1-Q2 2025)",
          text: "Consolidación en el mercado. Listing confirmado en **Decrypto** para facilitar on-ramp fiat en LATAM. Entrada en **Bitget** y **Gate.io** para capturar volumen de trading asiático. Lanzamiento de la colección NFT Génesis con utilidad in-game."
        },
        {
          title: "Fase 3: Dominio Global y CEX Tier-1 (Q3 2025)",
          text: "Objetivo principal: Listing en **Binance** y **OKX**. Implementación de puente cross-chain. Lanzamiento de la DAO de gobernanza para descentralizar decisiones clave. Torneos globales de eSports patrocinados por partners cripto."
        },
        {
          title: "Fase 4: Ecosistema Extendido (2026+)",
          text: "Desarrollo de 'Swamp Chain' (L3 propia). Incubadora para nuevos juegos dentro del ecosistema CROC. Integración con Metaverso."
        }
      ],
      timeline: [
        { quarter: "Q4 2024", milestone: "Fairlaunch & Uniswap" },
        { quarter: "Q1 2025", milestone: "Listing Decrypto/Bitget" },
        { quarter: "Q3 2025", milestone: "Listing Binance" },
        { quarter: "2026", milestone: "Swamp Chain L3" }
      ]
    },
    {
      id: 'tokenomics',
      title: '💰 Tokenómica Avanzada',
      icon: BarChart,
      content: [
        {
          title: "Utilidad del Token CROC",
          text: "CROC no es solo un token de recompensa; es el combustible del ecosistema. Se utiliza para: Gobernanza (DAO), Staking con rendimientos reales (Real Yield), compra de activos NFT exclusivos, y participación en Launchpads de proyectos asociados."
        },
        {
          title: "Estrategia de Liquidez CEX",
          text: "Hemos reservado un 15% del suministro total exclusivamente para proveer liquidez en exchanges centralizados (CEX Listings). Esto asegura libros de órdenes profundos en plataformas como Binance y Bitget, minimizando la volatilidad y el slippage."
        },
        {
          title: "Mecanismo de Quema Deflacionaria",
          text: "El 20% de los ingresos generados por la tienda in-game y fees de mercado se utilizan para recomprar y quemar CROC del mercado abierto, reduciendo el suministro circulante constantemente y aumentando la escasez."
        }
      ],
      chartData: [
        { name: "Fair Launch (Comunidad)", value: 40, color: "#10B981" },
        { name: "Eco/Incentivos P2E", value: 30, color: "#3B82F6" },
        { name: "CEX Listings & MM", value: 15, color: "#8B5CF6" },
        { name: "Equipo (Vesting 24m)", value: 10, color: "#F59E0B" },
        { name: "Marketing & Ops", value: 5, color: "#EF4444" }
      ]
    },
    {
      id: 'gameplay',
      title: '🎮 Mecánicas Lúdicas',
      icon: Gamepad2,
      content: [
        {
          title: "Sistema Tap-to-Earn Evolucionado",
          text: "Más allá de simples clics. Introduce combos, gestión de energía estratégica y el uso de cartas potenciadoras (Boost Cards) que actúan como multiplicadores de rendimiento, creando una capa de estrategia profunda."
        },
        {
          title: "Economía Dual Dinámica",
          text: "El juego opera con 'Monedas de Pantano' (off-chain, ilimitadas) para progresión rápida y 'CROC' (on-chain, limitado) para valor real. Mecanismos de conversión estrictos previenen la hiperinflación."
        },
        {
          title: "Social-Fi Integrado",
          text: "Los 'Clanes' permiten a comunidades enteras competir por pozos de premios semanales. El sistema de referidos recompensa viralidad, pagando comisiones directas en CROC por usuarios activos traídos al ecosistema."
        }
      ],
      features: [
        { icon: Target, text: "Estrategia RPG" },
        { icon: Award, text: "PvP Competitivo" },
        { icon: Users, text: "Guerra de Clanes" },
        { icon: Wallet, text: "Staking Activo" }
      ]
    },
    {
      id: 'technology',
      title: '⚙️ Infraestructura y Seguridad',
      icon: Code,
      content: [
        {
          title: "Arquitectura Escalable",
          text: "Construido sobre Optimism (Layer 2 de Ethereum) para garantizar transacciones rápidas y costos de gas insignificantes, crucial para un juego de alta frecuencia. Backend serverless distribuido para soportar millones de usuarios concurrentes."
        },
        {
          title: "Seguridad de Grado Institucional",
          text: "Contratos OpenZeppelin estándar auditados por CertiK y Hacken. Treasury gestionada mediante Gnosis Safe Multisig (5/7 firmas requeridas). Implementación de Time-Locks de 48 horas para cualquier migración de liquidez."
        }
      ],
      techStack: [
        "Optimism L2", "Solidity 0.8.x", "React/Next.js", "Supabase",
        "IPFS (NFTs)", "Gnosis Safe", "Chainlink VRF"
      ]
    },
    {
      id: 'partners',
      title: '🤝 Alianzas Estratégicas',
      icon: Globe,
      content: [
        {
          title: "Exchanges Partners",
          text: "Estamos en conversaciones avanzadas y acuerdos preliminares con **Decrypto**, **Bitget**, **Bybit** y **KuCoin** para asegurar listings escalonados post-lanzamiento."
        },
        {
          title: "Plataformas de Lanzamiento",
          text: "Colaboración con Pinksale para un Fair Launch transparente y seguro, con liquidez bloqueada automáticamente."
        }
      ],
      securityFeatures: [
        "Listing Confirmado", "KYC Equipo", "Auditoría Smart Contracts",
        "Liquidez Bloqueada 1 año"
      ]
    }
  ];

  const handleDownloadWhitepaper = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("📄 Whitepaper descargado (simulación)\n\nEn producción, esto descargaría un PDF detallado con toda la información del proyecto.");
    }, 1500);
  };

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const currentSection = sections.find(s => s.id === expandedSection) || sections[0];

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* 🏁 Encabezado */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-4">
              <FileText className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-blue-300 to-purple-300 bg-clip-text text-transparent">
              Whitepaper Oficial
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Documento técnico completo del ecosistema Cocodrilo Kombat
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Button
              onClick={handleDownloadWhitepaper}
              size="lg"
              disabled={downloading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              {downloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Descargar PDF Completo
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open('https://github.com/cocodrilokombat', '_blank')}
              className="border-gray-700 hover:bg-gray-800/50"
            >
              <Code className="w-5 h-5 mr-2" />
              Código Abierto
            </Button>
          </div>

          {/* Estadísticas clave */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">1B</div>
              <div className="text-sm text-muted-foreground">Suministro Total</div>
            </div>
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">25% APY</div>
              <div className="text-sm text-muted-foreground">Staking Rewards</div>
            </div>
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">Q4 2024</div>
              <div className="text-sm text-muted-foreground">Lanzamiento</div>
            </div>
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">Cronos</div>
              <div className="text-sm text-muted-foreground">Blockchain</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 📚 Sidebar - Navegación */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stats-card rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
                Contenido
              </h3>

              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setExpandedSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 ${expandedSection === section.id
                          ? 'bg-primary/20 text-primary border-l-4 border-primary'
                          : 'text-muted-foreground hover:bg-gray-800/50'
                        }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{section.title}</span>
                      {expandedSection === section.id && (
                        <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Información adicional */}
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                <h4 className="text-sm font-semibold mb-3 text-gray-400">Información Técnica</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    <span>Blockchain: <strong>Cronos Network</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-400" />
                    <span>Estándar: <strong>ERC-20 & ERC-721</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Plataformas: <strong>Web + Mobile</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 📄 Contenido Principal */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stats-card rounded-xl p-6 md:p-8">
              {/* Header de la sección */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                    <currentSection.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{currentSection.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Documentación oficial - Versión 1.0
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSection(currentSection.id)}
                  className="text-gray-400 hover:text-white"
                >
                  {expandedSection === currentSection.id ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Contraer
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Expandir
                    </>
                  )}
                </Button>
              </div>

              {/* Contenido principal */}
              <div className="space-y-6">
                {currentSection.content.map((item, index) => (
                  <div key={index} className="pb-6 border-b border-gray-700/50 last:border-0">
                    <h3 className="text-lg font-semibold mb-2 text-blue-300 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      {item.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}

                {/* Elementos especiales por sección */}
                {currentSection.stats && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-white">📊 Métricas Clave</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {currentSection.stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                          <div key={index} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-gray-400">{stat.label}</span>
                            </div>
                            <div className="text-xl font-bold text-white">{stat.value}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentSection.chartData && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-white">📈 Distribución del Token</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {currentSection.chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-gray-300 flex-1">{item.name}</span>
                          <span className="text-sm font-bold">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSection.features && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-white">✨ Características Principales</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentSection.features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                            <Icon className="w-5 h-5 text-green-400" />
                            <span className="text-gray-300">{feature.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentSection.timeline && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-white">📅 Cronograma</h4>
                    <div className="space-y-4">
                      {currentSection.timeline.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-bold text-blue-400">{item.quarter}</div>
                          <div className="flex-1 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                            <div className="text-gray-300">{item.milestone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSection.techStack && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-white">⚙️ Stack Tecnológico</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentSection.techStack.map((tech, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gray-800/50 text-gray-300 rounded-lg text-sm border border-gray-700/50"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentSection.team && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-white">👥 Equipo Principal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentSection.team.map((member, index) => (
                        <div key={index} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                          <div className="font-bold text-white mb-1">{member.name}</div>
                          <div className="text-sm text-blue-400 mb-2">{member.role}</div>
                          <div className="text-xs text-gray-400">{member.experience}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSection.securityFeatures && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4 text-white">🛡️ Medidas de Seguridad</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {currentSection.securityFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-800/30 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer de la sección */}
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-400">
                    Última actualización: {new Date().toLocaleDateString('es-ES')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const index = sections.findIndex(s => s.id === expandedSection);
                        const prevIndex = index > 0 ? index - 1 : sections.length - 1;
                        setExpandedSection(sections[prevIndex].id);
                      }}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const index = sections.findIndex(s => s.id === expandedSection);
                        const nextIndex = index < sections.length - 1 ? index + 1 : 0;
                        setExpandedSection(sections[nextIndex].id);
                      }}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 Call to Action */}
            <motion.div
              className="mt-6 stats-card rounded-xl p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3 text-white">🚀 ¿Listo para unirte a la revolución?</h3>
                <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
                  Cocodrilo Kombat está construyendo el futuro del gaming descentralizado.
                  Sé parte de la comunidad desde el día 1.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={() => window.open('https://discord.gg/cocodrilokombat', '_blank')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Unirse a Discord
                  </Button>
                  <Button
                    onClick={() => window.open('https://twitter.com/cocodrilokombat', '_blank')}
                    variant="outline"
                    className="border-blue-700 text-blue-400 hover:bg-blue-900/30"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Seguir en Twitter
                  </Button>
                  <Button
                    onClick={() => window.open('https://t.me/cocodrilokombat', '_blank')}
                    variant="outline"
                    className="border-green-700 text-green-400 hover:bg-green-900/30"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Telegram
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}