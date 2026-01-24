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
          text: "Cocodrilo Kombat emerge como la vanguardia en la evolución del sector Play-to-Earn (P2E), trascendiendo las limitaciones de los modelos 'ponzionomics' de primera generación. Nuestra plataforma fusiona la accesibilidad viral de las mecánicas 'Tap-to-Earn' con una infraestructura financiera descentralizada (DeFi) robusta y sostenible. Nuestra visión es construir no solo un juego, sino una puerta de entrada masiva hacia la adopción Web3, aprovechando la escalabilidad y los bajos costos de la red Optimism (Layer 2 de Ethereum) para democratizar el acceso a activos digitales."
        },
        {
          title: "El Problema en el GameFi Actual",
          text: "El panorama actual de GameFi se encuentra fracturado. Por un lado, existen barreras de entrada técnicas insuperables para el usuario promedio (gestión compleja de wallets, altos costos de gas en L1). Por otro lado, la mayoría de los proyectos sufren de modelos económicos inflacionarios que colapsan inevitablemente bajo la presión de venta, careciendo de flujos de ingresos externos o utilidad real del token. Además, la falta de liquidez profunda en exchanges centralizados (CEX) de primer nivel limita la exposición y el crecimiento del ecosistema."
        },
        {
          title: "Nuestra Solución Estratégica: Modelo 'Sostenibilidad Primero'",
          text: "Cocodrilo Kombat implementa una economía circular diseñada meticulosamente. Integramos flujos de ingresos externos (publicidad programática, partnerships estratégicos, venta de activos in-game) que se inyectan directamente en la liquidez del token. Técnicamente, eliminamos la fricción utilizando Optimism para transacciones casi instantáneas y gas-less para el usuario final mediante Account Abstraction. Estratégicamente, aseguramos la viabilidad a largo plazo mediante listings escalonados en CEX Tier-1 (Binance, Bitget, Decrypto), garantizando profundidad de mercado y arbitraje eficiente."
        }
      ],
      stats: [
        { label: "Red Principal", value: "Optimism (OP Mainnet)", icon: Zap },
        { label: "Suministro Total", value: "1,000,000,000 CROC", icon: PieChart },
        { label: "Proyección CEX", value: "Binance / Bitget / Decrypto", icon: Building2 }
      ]
    },
    {
      id: 'tokenomics',
      title: '💰 Ingeniería Económica y Tokenómica',
      icon: BarChart,
      content: [
        {
          title: "Utilidad Polifacética del Token CROC",
          text: "El token CROC (ERC-20 en Optimism) actúa como el eje central de valor. Su utilidad se extiende a: 1) Gobernanza DAO, permitiendo a los holders votar sobre parámetros del protocolo y asignación de tesorería. 2) Staking de Rendimiento Real (Real Yield), donde los stakers reciben una parte de los ingresos del protocolo en ETH/USDC, no solo tokens inflacionarios. 3) Moneda de cambio exclusiva para activos NFT de edición limitada y pases de batalla premium. 4) Acceso prioritario a Launchpads de proyectos incubados en el 'Swamp Ecosystem'."
        },
        {
          title: "Estrategia de Liquidez Institucional (MM & CEX)",
          text: "Para mitigar la volatilidad y asegurar un trading fluido, hemos reservado un 15% del suministro total (150M CROC) estrictamente para provisión de liquidez en exchanges centralizados (Market Making). Estos fondos se despliegan algorítmicamente para mantener libros de órdenes profundos en pares clave (CROC/USDT) en plataformas como Binance, Bitget y Decrypto, minimizando el slippage para grandes inversores y estabilizando la acción del precio."
        },
        {
          title: "Mecanismo de Quema Deflacionaria Algorítmica",
          text: "Implementamos un protocolo de 'Buyback & Burn' automatizado. El 20% de todos los ingresos generados por el Marketplace NFT y las tasas de transacción in-game se dirigen a un contrato inteligente que compra CROC del mercado abierto y lo envía a una dirección nula (0x0...dead). Esto crea una presión deflacionaria constante, reduciendo el suministro circulante a lo largo del tiempo y aumentando teóricamente el valor por token restante, alineando los incentivos entre el protocolo y los holders a largo plazo."
        }
      ],
      chartData: [
        { name: "Fair Launch (Comunidad)", value: 40, color: "#10B981" },
        { icon: Target, text: "Estrategia RPG" },
        { icon: Award, text: "PvP Competitivo" },
        { icon: Users, text: "Guerra de Clanes" },
        { icon: Wallet, text: "Staking Activo" }
      ]
    },
    {
      id: 'strategic-roadmap',
      title: '🗺️ Hoja de Ruta Técnica y Listings',
      icon: Map,
      content: [
        {
          title: "Fase 1: Génesis, Auditoría y TGE (Q4 2024)",
          text: "Despliegue de contratos inteligentes en Optimism Sepolia para pruebas de estrés. Auditoría de seguridad completa con firmas líderes (CertiK/Hacken). Evento de Generación de Token (TGE) y Fair Launch público en Pinksale. Establecimiento de Liquidez Inicial en Uniswap V3 (Optimism) y Velodrome Finance para garantizar un precio base descentralizado. Lanzamiento de la campaña de marketing global enfocada en LATAM y el sudeste asiático."
        },
        {
          title: "Fase 2: Expansión CEX y Utilidad Alpha (Q1-Q2 2025)",
          text: "Listings confirmados en exchanges Tier-2 y regionales estratégicos: Decrypto (foco LATAM/Fiat On-ramp) y Bitget (foco Asia/Trading Volume). Integración de API de oráculos Chainlink para feeds de precios seguros. Lanzamiento de la Beta Pública del juego completo con mecánicas 'Play-to-Airdrop'. Activación del módulo de Staking V1 con recompensas compuestas."
        },
        {
          title: "Fase 3: Dominio Global y Adopción Masiva (Q3 2025)",
          text: "Objetivo primario: Listing en exchanges Tier-1 globales: Binance y OKX. Esto habilitará una entrada masiva de capital institucional y retail. Implementación de puentes cross-chain (LayerZero) para permitir la interoperabilidad con Arbitrum y Base. Lanzamiento de la Gobernanza DAO on-chain, transfiriendo el control de parámetros clave a la comunidad. Torneos de eSports globales con premios en stablecoins."
        },
        {
          title: "Fase 4: Consolidación del Metaverso (2026+)",
          text: "Desarrollo de la 'Swamp Chain', una Layer 3 (Appchain) dedicada sobre Optimism para microtransacciones de costo cero. Lanzamiento del SDK para desarrolladores externos que quieran construir minijuegos dentro del ecosistema Cocodrilo. Integración plena con identidades digitales descentralizadas (DID)."
        }
      ],
      timeline: [
        { quarter: "Q4 2024", milestone: "Fairlaunch & Uniswap V3" },
        { quarter: "Q1 2025", milestone: "Listing Decrypto & Bitget" },
        { quarter: "Q3 2025", milestone: "Listing Binance & OKX" },
        { quarter: "2026", milestone: "Swamp Chain Layer 3" }
      ]
    },
    {
      id: 'technology',
      title: '⚙️ Arquitectura Técnica y Seguridad',
      icon: Code,
      content: [
        {
          title: "Infraestructura sobre Optimism (OP Stack)",
          text: "Cocodrilo Kombat está construido nativamente sobre la red Optimism para aprovechar la tecnología de Optimistic Rollups. Esto nos permite heredar la seguridad de la Layer 1 de Ethereum mientras reducimos los costos de gas en un 99% y aumentamos el throughput a más de 2000 TPS. Esta escalabilidad es crítica para procesar millones de interacciones de juego diarias sin congestionar la red ni incurrir en costos prohibitivos para el usuario."
        },
        {
          title: "Contratos Inteligentes y Estándares",
          text: "Utilizamos una arquitectura de contratos modular y actualizable (UUPS Proxies). El token CROC sigue el estándar ERC-20 con extensiones de seguridad (Pausable, Burnable, Snapshot). Los activos del juego (NFTs) utilizan el estándar ERC-721A optimizado para minting por lotes con bajo consumo de gas. Todos los contratos críticos están protegidos por Time-Locks de 48 horas, asegurando que cualquier cambio administrativo sea visible para la comunidad antes de su ejecución."
        },
        {
          title: "Seguridad de Grado Institucional",
          text: "La seguridad es nuestra prioridad cero. La Tesorería del proyecto está gestionada mediante una Gnosis Safe Multisig que requiere 5 de 7 firmas de custodios distribuidos geográficamente para cualquier movimiento de fondos. Realizamos análisis estáticos continuos con Slither y Mythril, complementados por programas de Bug Bounty activos en plataformas como Immunefi para incentivar a investigadores de seguridad a auditar nuestro código constantemente."
        }
      ],
      techStack: [
        "Optimism (OP Mainnet)", "Solidity 0.8.20", "ERC-4337 (AA)", "Graph Protocol",
        "IPFS/Arweave", "Gnosis Safe", "Chainlink VRF/Keepers"
      ]
    },
    {
      id: 'gameplay',
      title: '🎮 Profundidad de Mecánicas de Juego',
      icon: Gamepad2,
      content: [
        {
          title: "Evolución del 'Tap-to-Earn' a RPG Estratégico",
          text: "Si bien el núcleo inicial es accesible (clicker), el metajuego evoluciona rápidamente hacia un RPG de gestión de recursos. Los jugadores deben optimizar su 'Energy Per Second' (EPS) y 'Coins Per Second' (CPS) mediante una matriz compleja de mejoras, cartas potenciadoras sinérgicas y skins con atributos pasivos únicos. Esta profundidad asegura la retención de usuarios a largo plazo más allá de la especulación inicial del token."
        },
        {
          title: "Economía Dual: Off-Chain vs On-Chain",
          text: "Para garantizar una experiencia de usuario fluida (sin firma de transacciones por cada acción), utilizamos un modelo híbrido. Las 'Monedas de Pantano' y la experiencia se procesan en un backend de alto rendimiento (Off-Chain), permitiendo velocidad instantánea. El token CROC y los NFTs residen On-Chain. Un 'Bridge In-Game' permite la sincronización periódica y segura entre ambos estados, validada por oráculos y pruebas de consistencia criptográfica."
        },
        {
          title: "Social-Fi y Viralidad Incentivada",
          text: "El motor de crecimiento del juego es intrínsecamente social. Los 'Clanes' permiten la formación de gremios que compiten por territorio y tesoros semanales. El sistema de referidos multinivel utiliza contratos inteligentes para distribuir recompensas en tiempo real, incentivando la viralidad orgánica. Las misiones sociales integran APIs de redes sociales para verificar interacciones genuinas, creando un flywheel de marketing perpetuo."
        }
      ],
      features: [
        { icon: Target, text: "Estrategia Profunda" },
        { icon: Award, text: "Rankings PvP/GvG" },
        { icon: Users, text: "Gremio & Clanes" },
        { icon: Wallet, text: "Economía Híbrida" }
      ]
    },
    {
      id: 'partners',
      title: '🤝 Ecosistema de Alianzas',
      icon: Globe,
      content: [
        {
          title: "Exchanges Partners y Market Makers",
          text: "Mantener una liquidez saludable es vital. Estamos en fases avanzadas de negociación y acuerdos de listado técnico con **Decrypto** para dominar el mercado fiat en América Latina, y con **Bitget**, **Bybit** y **KuCoin** para asegurar volumen global. Además, colaboramos con Market Makers institucionales (GSR/Wintermute - pendientes de confirmación pública) para asegurar spreads ajustados desde el día uno."
        },
        {
          title: "Infraestructura y Launchpads",
          text: "Para el lanzamiento inicial, nos hemos asociado con **Pinksale**, la plataforma líder en lanzamientos descentralizados, para garantizar un Fair Launch transparente donde la liquidez inicial se bloquea automáticamente por contrato. También colaboramos con **Alchemy** y **Moralis** para infraestructura de nodos RPC de alta disponibilidad."
        }
      ],
      securityFeatures: [
        "Listing CEX Confirmados", "Liquidez Bloqueada (12-24 meses)",
        "Auditoría Full-Stack", "KYC de Fundadores"
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
                    onClick={() => window.open('https://x.com/Cocodrilokombat', '_blank')}
                    variant="outline"
                    className="border-blue-700 text-blue-400 hover:bg-blue-900/30"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Seguir en X
                  </Button>
                  <Button
                    onClick={() => window.open('https://t.me/cocodrilo_kombat', '_blank')}
                    variant="outline"
                    className="border-blue-500 text-blue-400 hover:bg-blue-900/30"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Canal Telegram
                  </Button>
                  <Button
                    onClick={() => window.open('https://www.youtube.com/channel/UCj7cOHm-7nV523MXmCuZlrQ', '_blank')}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/30"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    YouTube
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