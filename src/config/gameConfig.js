import {
  Zap as ZapIcon,
  Target,
  Crown,
  Flame,
  Trophy,
  Shield,
  Activity,
  Aperture,
  Award as AwardIconLucide,
  Briefcase,
  CalendarCheck,
  CheckCircle,
  Compass,
  Cpu,
  Disc,
  DollarSign,
  Feather as FeatherIcon,
  FileText,
  Filter,
  Flag,
  Folder,
  Globe,
  Grid,
  HardDrive,
  HelpCircle,
  Inbox,
  Layers,
  LifeBuoy,
  Link,
  MapPin,
  Maximize,
  Mic,
  Minimize,
  Monitor,
  Moon,
  MousePointer,
  Package,
  Percent,
  PieChart,
  Pilcrow,
  Pocket,
  Power,
  Printer,
  Radio,
  Save,
  Scissors,
  Server,
  Share2,
  ShoppingBag,
  Shuffle,
  Sidebar,
  Smile,
  Speaker,
  Square,
  Star as StarIcon,
  Sun,
  Sunset,
  Sunrise,
  Tag,
  Terminal,
  Wrench as Tool,
  Trash2,
  TrendingUp,
  TrendingDown,
  Umbrella,
  UploadCloud,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus as UserPlusIcon,
  Users,
  Video,
  Voicemail,
  Watch,
  Wifi,
  Wind,
  ZapOff,
  ZoomIn,
  ZoomOut,
  Send,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Twitch,
  Shirt,
  Gem,
  Eye,
  Palette,
  Diamond,
  Rocket,
  BookOpen,
  BarChartHorizontalBig,
  Lightbulb,
  Battery,
  Brain,
  Castle,
  Cloud,
  Coffee,
  Crosshair,
  Droplets,
  Fish,
  Ghost,
  Heart,
  Key,
  Leaf,
  Lock,
  Magnet,
  Mountain,
  Octagon,
  Puzzle,
  Search,
  Skull,
  Snowflake,
  Sun as SunIcon,
  Sword,
  Tree,
  Umbrella as UmbrellaIcon,
  Volcano,
  Wand,
  X,
  YinYang,
  Zap as ZapSolid,
  Bell,
  Calculator,
  Database,
  Cpu as CpuIcon,
  Network,
  Server as ServerIcon,
  Wifi as WifiIcon,
  Bluetooth,
  Cctv,
  Satellite,
  SatelliteDish,
  Radar,
  Microchip,
  CircuitBoard,
  CpuChip,
  MemoryStick,
  HardDrive as HardDriveIcon,
  Router,
  Switch,
  Terminal as TerminalIcon,
  Code,
  Bug,
  TestTube,
  Beaker,
  FlaskConical,
  Atom,
  DNA,
  Stethoscope,
  Syringe,
  Pill,
  BrainCircuit,
  HeartPulse,
  Bone,
  Eye as EyeIcon,
  Ear,
  Nose,
  Armchair,
  Sofa,
  Lamp,
  LampDesk,
  LampFloor,
  Lightbulb as LightbulbIcon,
  Flashlight,
  CandlestickChart,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LineChart,
  BarChart,
  BarChartHorizontal,
  PieChart as PieChartIcon,
  Donut,
  AreaChart,
  ScatterChart,
  Kanban,
  Table,
  LayoutGrid,
  List,
  ListOrdered,
  ListChecks,
  ListTodo,
  ListX,
  ListFilter,
  ListMinus,
  ListPlus,
  ListRestart,
  ListStart,
  ListEnd,
  ListTree,
  ListVideo,
  ListMusic,
  ListImage,
  ListHeart,
  ListStar,
  ListThumbsUp,
  ListThumbsDown,
} from "lucide-react";

/* =====================================================
 🎮 ESTADO INICIAL DEL JUEGO - OPTIMIZADO
===================================================== */

export const INITIAL_GAME_STATE = {
  coins: 0,
  totalCoins: 0,
  clickPower: 1,
  coinsPerSecond: 0,
  totalClicks: 0,
  level: 1,
  experience: 0,
  energy: 100,
  maxEnergy: 100,
  nativeTokenBalance: 0,
  referralsCount: 0,
  crocFromRefs: 0,
  coinsFromRefs: 0,
  playerId: crypto.randomUUID(),
  // ✅ NUEVOS CAMPOS PARA ARQUITECTURA CENTRALIZADA
  dailyStreak: 0,
  lastDailyClaim: null,
  totalPlayTime: 0,
  prestigeLevel: 0,
  highestCombo: 0,
  luckyMultiplier: 1.0,
  achievementsPoints: 0,
  clanId: null,
  battlePassLevel: 0,
  seasonalTokens: 0,
};

/* =====================================================
 🛠️ UPGRADES - EXPANDIDO Y OPTIMIZADO
===================================================== */

export const UPGRADES = [
  {
    id: "autoClick",
    name: "Ciénaga Automática",
    description: "Genera 1 moneda por segundo automáticamente",
    basePrice: 50,
    basePower: 1,
    icon: Activity,
    color: "text-green-400",
    bgColor: "bg-green-900/30",
    type: "cps",
    image: "/images/upgrades/swamp.jpeg",
    rarity: "common",
    maxLevel: 100,
    category: "automation",
    effectDescription: "+1 moneda/segundo por nivel"
  },
  {
    id: "mordiscoPoderoso",
    name: "Mordisco Poderoso",
    description: "Aumenta monedas por clic en +1 por nivel",
    basePrice: 100,
    basePower: 1,
    icon: Target,
    color: "text-red-500",
    bgColor: "bg-red-900/30",
    type: "click",
    image: "/images/upgrades/bite.jpeg",
    rarity: "common",
    maxLevel: 50,
    category: "click",
    effectDescription: "+1 moneda/clic por nivel"
  },
  {
    id: "cazadorSigiloso",
    name: "Cazador Sigiloso",
    description: "Genera 5 monedas por segundo",
    basePrice: 500,
    basePower: 5,
    icon: Compass,
    color: "text-teal-400",
    bgColor: "bg-teal-900/30",
    type: "cps",
    image: "/images/upgrades/hunter.jpeg",
    rarity: "uncommon",
    maxLevel: 75,
    category: "automation",
    effectDescription: "+5 monedas/segundo por nivel"
  },
  {
    id: "superCocodrilo",
    name: "Super Cocodrilo",
    description: "Multiplica monedas por clic x1.5 por nivel",
    basePrice: 1000,
    basePower: 1.5,
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-900/30",
    type: "multiplier",
    image: "/images/upgrades/super_croc.jpeg",
    rarity: "rare",
    maxLevel: 20,
    category: "multiplier",
    effectDescription: "×1.5 multiplicador por nivel"
  },
  {
    id: "criaderoMasivo",
    name: "Criadero Masivo",
    description: "Genera 25 monedas por segundo",
    basePrice: 5000,
    basePower: 25,
    icon: Users,
    color: "text-lime-400",
    bgColor: "bg-lime-900/30",
    type: "cps",
    image: "/images/upgrades/breeding.jpeg",
    rarity: "epic",
    maxLevel: 40,
    category: "automation",
    effectDescription: "+25 monedas/segundo por nivel"
  },
  {
    id: "escamasReforzadas",
    name: "Escamas Reforzadas",
    description: "Aumenta monedas por clic en +10 por nivel",
    basePrice: 2500,
    basePower: 10,
    icon: Shield,
    color: "text-gray-400",
    bgColor: "bg-gray-900/30",
    type: "click",
    image: "/images/upgrades/scales.jpeg",
    rarity: "uncommon",
    maxLevel: 30,
    category: "click",
    effectDescription: "+10 monedas/clic por nivel"
  },
  {
    id: "rey_del_pantano",
    name: "Rey del Pantano",
    description: "Genera 100 monedas por segundo",
    basePrice: 20000,
    basePower: 100,
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
    type: "cps",
    image: "/images/upgrades/swamp_king.jpeg",
    rarity: "legendary",
    maxLevel: 25,
    category: "automation",
    effectDescription: "+100 monedas/segundo por nivel"
  },
  {
    id: "dientes_de_oro",
    name: "Dientes de Oro",
    description: "Multiplica todas las ganancias x2",
    basePrice: 50000,
    basePower: 2,
    icon: Diamond,
    color: "text-yellow-300",
    bgColor: "bg-yellow-800/30",
    type: "global_multiplier",
    image: "/images/upgrades/golden_teeth.jpeg",
    rarity: "legendary",
    maxLevel: 10,
    category: "multiplier",
    effectDescription: "×2 multiplicador global por nivel"
  },
  {
    id: "energia_eterna",
    name: "Energía Eterna",
    description: "Aumenta energía máxima en +50",
    basePrice: 7500,
    basePower: 50,
    icon: Battery,
    color: "text-blue-400",
    bgColor: "bg-blue-900/30",
    type: "energy",
    image: "/images/upgrades/eternal_energy.jpeg",
    rarity: "rare",
    maxLevel: 20,
    category: "energy",
    effectDescription: "+50 energía máxima por nivel"
  },
  {
    id: "estratega_del_pantano",
    name: "Estratega del Pantano",
    description: "Aumenta la regeneración de energía en +2/seg",
    basePrice: 15000,
    basePower: 2,
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-900/30",
    type: "energy_regen",
    image: "/images/upgrades/swamp_strategist.jpeg",
    rarity: "epic",
    maxLevel: 15,
    category: "energy",
    effectDescription: "+2 energía/segundo por nivel"
  }
];

export const INITIAL_UPGRADES_STATE = UPGRADES.reduce((acc, upgrade) => {
  acc[upgrade.id] = { 
    level: 0, 
    owned: 0,
    unlocked: true,
    lastPurchase: null
  };
  return acc;
}, {});

/* =====================================================
 🏆 ACHIEVEMENTS - EXPANDIDO
===================================================== */

export const ACHIEVEMENTS = [
  // 🎯 Clics
  { 
    id: "first_click", 
    name: "Primer Mordisco", 
    description: "Haz tu primer clic", 
    requirement: 1, 
    type: "clicks", 
    icon: MousePointer,
    rarity: "common",
    rewardPoints: 10,
    rewardCoins: 100
  },
  { 
    id: "hundred_clicks", 
    name: "Cien Mordiscos", 
    description: "Haz 100 clics", 
    requirement: 100, 
    type: "clicks", 
    icon: Aperture,
    rarity: "common",
    rewardPoints: 25,
    rewardCoins: 500
  },
  { 
    id: "thousand_clicks", 
    name: "Milenario del Clic", 
    description: "Haz 1,000 clics", 
    requirement: 1000, 
    type: "clicks", 
    icon: Crosshair,
    rarity: "uncommon",
    rewardPoints: 50,
    rewardCoins: 2000
  },
  { 
    id: "ten_thousand_clicks", 
    name: "Maestro del Clic", 
    description: "Haz 10,000 clics", 
    requirement: 10000, 
    type: "clicks", 
    icon: Target,
    rarity: "rare",
    rewardPoints: 100,
    rewardCoins: 10000
  },

  // 💰 Monedas
  { 
    id: "thousand_coins", 
    name: "Tesoro del Pantano", 
    description: "Acumula 1,000 monedas", 
    requirement: 1000, 
    type: "totalCoins", 
    icon: DollarSign,
    rarity: "common",
    rewardPoints: 15,
    rewardCoins: 200
  },
  { 
    id: "million_coins", 
    name: "Millionario Croc", 
    description: "Acumula 1,000,000 monedas", 
    requirement: 1000000, 
    type: "totalCoins", 
    icon: Crown,
    rarity: "epic",
    rewardPoints: 200,
    rewardCoins: 50000
  },

  // ⚡ Upgrades
  { 
    id: "first_upgrade", 
    name: "Evolución Inicial", 
    description: "Compra tu primera mejora", 
    requirement: 1, 
    type: "upgrades", 
    icon: TrendingUp,
    rarity: "common",
    rewardPoints: 20,
    rewardCoins: 300
  },
  { 
    id: "ten_upgrades", 
    name: "Depredador Mejorado", 
    description: "Compra 10 mejoras (total niveles)", 
    requirement: 10, 
    type: "upgrades", 
    icon: Cpu,
    rarity: "uncommon",
    rewardPoints: 40,
    rewardCoins: 1500
  },
  { 
    id: "fifty_upgrades", 
    name: "Experto en Evolución", 
    description: "Compra 50 mejoras (total niveles)", 
    requirement: 50, 
    type: "upgrades", 
    icon: CircuitBoard,
    rarity: "rare",
    rewardPoints: 100,
    rewardCoins: 10000
  },

  // 🎯 Misiones
  { 
    id: "first_mission", 
    name: "Misión Inicial", 
    description: "Completa tu primera misión", 
    requirement: 1, 
    type: "missions", 
    icon: Flag,
    rarity: "common",
    rewardPoints: 25,
    rewardCoins: 500
  },
  { 
    id: "all_missions", 
    name: "Completista", 
    description: "Completa todas las misiones", 
    requirement: MISSIONS.length, 
    type: "missions", 
    icon: CheckCircle,
    rarity: "legendary",
    rewardPoints: 300,
    rewardCoins: 50000
  },

  // 🃏 Cartas
  { 
    id: "card_collector", 
    name: "Coleccionista de Cartas", 
    description: "Obtén 3 cartas diferentes", 
    requirement: 3, 
    type: "cards", 
    icon: Layers,
    rarity: "uncommon",
    rewardPoints: 50,
    rewardCoins: 2000
  },
  { 
    id: "full_deck", 
    name: "Mazo Completo", 
    description: "Colecciona todas las cartas", 
    requirement: CARDS_DATA.length, 
    type: "cards", 
    icon: Cards,
    rarity: "legendary",
    rewardPoints: 500,
    rewardCoins: 100000
  },

  // 🛍️ Tienda
  { 
    id: "shopaholic", 
    name: "Comprador Compulsivo", 
    description: "Compra 5 ítems en la tienda", 
    requirement: 5, 
    type: "items", 
    icon: ShoppingBag,
    rarity: "uncommon",
    rewardPoints: 60,
    rewardCoins: 3000
  },
  { 
    id: "fashionista", 
    name: "Fashionista del Pantano", 
    description: "Compra todas las skins", 
    requirement: SHOP_ITEMS.filter(i => i.type === "skin").length, 
    type: "items", 
    icon: Palette,
    rarity: "epic",
    rewardPoints: 250,
    rewardCoins: 25000
  },

  // 🎯 Hitos de Farmeo
  { 
    id: "croc_farmer_1", 
    name: "Granjero CROC I", 
    description: "Reclama tu primer hito de farmeo CROC", 
    requirement: 1, 
    type: "farming_milestones", 
    icon: Target,
    rarity: "common",
    rewardPoints: 30,
    rewardCoins: 1000
  },
  { 
    id: "croc_farmer_5", 
    name: "Leyenda del Farmeo", 
    description: "Reclama todos los hitos de farmeo", 
    requirement: FARMING_MILESTONES.length, 
    type: "farming_milestones", 
    icon: Trophy,
    rarity: "legendary",
    rewardPoints: 400,
    rewardCoins: 75000
  },

  // 📈 Niveles
  { 
    id: "level_10", 
    name: "Depredador Experimentado", 
    description: "Alcanza el nivel 10", 
    requirement: 10, 
    type: "level", 
    icon: AwardIconLucide,
    rarity: "uncommon",
    rewardPoints: 75,
    rewardCoins: 5000
  },
  { 
    id: "level_50", 
    name: "Maestro del Pantano", 
    description: "Alcanza el nivel 50", 
    requirement: 50, 
    type: "level", 
    icon: Crown,
    rarity: "epic",
    rewardPoints: 200,
    rewardCoins: 25000
  },

  // 👥 Referidos
  { 
    id: "first_referral", 
    name: "Pionero de la Comunidad", 
    description: "Invita a tu primer amigo", 
    requirement: 1, 
    type: "referrals", 
    icon: Users,
    rarity: "common",
    rewardPoints: 40,
    rewardCoins: 2000
  },
  { 
    id: "ten_referrals", 
    name: "Líder de Manada", 
    description: "Invita a 10 amigos", 
    requirement: 10, 
    type: "referrals", 
    icon: Crown,
    rarity: "legendary",
    rewardPoints: 300,
    rewardCoins: 50000
  }
];

/* =====================================================
 🎯 MISSIONS - EXPANDIDO Y MEJORADO
===================================================== */

export const MISSIONS = [
  {
    id: "click_starter",
    name: "Cazador Novato",
    description: "Realiza 50 clics para demostrar tu instinto depredador",
    requirement: { type: "clicks", value: 50 },
    reward: { coins: 200, xp: 50, cardId: "card_agility_1" },
    icon: Target,
    category: "Clics",
    difficulty: "Fácil",
    timeEstimate: "5 minutos"
  },
  {
    id: "coin_collector",
    name: "Recolector de Tesoros",
    description: "Acumula 500 monedas en total",
    requirement: { type: "coins", value: 500 },
    reward: { coins: 500, xp: 100, cardId: "card_fortune_1" },
    icon: DollarSign,
    category: "Monedas",
    difficulty: "Fácil",
    timeEstimate: "10 minutos"
  },
  {
    id: "level_up_rookie",
    name: "Aprendiz de Depredador",
    description: "Alcanza el nivel 2 para demostrar tu crecimiento",
    requirement: { type: "level", value: 2 },
    reward: { coins: 300, xp: 70 },
    icon: StarIcon,
    category: "Nivel",
    difficulty: "Fácil",
    timeEstimate: "5 minutos"
  },
  {
    id: "upgrade_enthusiast",
    name: "Entusiasta de la Evolución",
    description: 'Mejora "Mordisco Poderoso" al nivel 3',
    requirement: { type: "upgradeLevel", upgradeId: "mordiscoPoderoso", value: 3 },
    reward: { coins: 1000, xp: 150, cardId: "card_power_1" },
    icon: TrendingUp,
    category: "Mejoras",
    difficulty: "Medio",
    timeEstimate: "15 minutos"
  },
  {
    id: "social_share_twitter",
    name: "Embajador en X",
    description: "Comparte Cocodrilo Kombat en X (Twitter) para expandir la manada",
    requirement: {
      type: "social_share",
      value: 1,
      url: "https://twitter.com/intent/tweet?text=¡Jugando%20Cocodrilo%20Kombat!%20%23CocodriloKombat%20%23PlayToEarn&url=YOUR_GAME_URL_HERE",
      actionText: "Compartir en X",
    },
    reward: { coins: 250, xp: 50 },
    icon: Share2,
    category: "Social",
    difficulty: "Fácil",
    timeEstimate: "2 minutos"
  },
  {
    id: "social_follow_telegram",
    name: "Guardián del Canal",
    description: "Únete a nuestro canal de Telegram para recibir noticias exclusivas",
    requirement: {
      type: "social_follow",
      value: 1,
      url: "https://t.me/cocodrilokombat",
      actionText: "Unirse a Telegram",
    },
    reward: { coins: 250, xp: 50 },
    icon: UserPlusIcon,
    category: "Social",
    difficulty: "Fácil",
    timeEstimate: "2 minutos"
  },
  {
    id: "energy_master",
    name: "Maestro de la Energía",
    description: "Mantén tu energía al máximo por 5 minutos consecutivos",
    requirement: { type: "custom", value: "energy_full_5min" },
    reward: { coins: 750, xp: 100, cardId: "card_energy_1" },
    icon: Battery,
    category: "Energía",
    difficulty: "Medio",
    timeEstimate: "5 minutos"
  },
  {
    id: "click_combo",
    name: "Combo Mortal",
    description: "Realiza 100 clics en menos de 30 segundos",
    requirement: { type: "custom", value: "click_combo_100" },
    reward: { coins: 1500, xp: 200 },
    icon: Crosshair,
    category: "Habilidad",
    difficulty: "Difícil",
    timeEstimate: "Variable"
  },
  {
    id: "daily_streak",
    name: "Devoto del Pantano",
    description: "Reclama tu recompensa diaria por 3 días consecutivos",
    requirement: { type: "custom", value: "daily_streak_3" },
    reward: { coins: 1000, xp: 150, cardId: "card_streak_1" },
    icon: CalendarCheck,
    category: "Constancia",
    difficulty: "Fácil",
    timeEstimate: "3 días"
  },
  {
    id: "referral_master",
    name: "Constructor de Comunidad",
    description: "Invita a 3 amigos para unirte al juego",
    requirement: { type: "custom", value: "referrals_3" },
    reward: { coins: 3000, xp: 300, cardId: "card_community_1" },
    icon: Users,
    category: "Social",
    difficulty: "Medio",
    timeEstimate: "Variable"
  },
  {
    id: "upgrade_collector",
    name: "Coleccionista de Mejoras",
    description: "Compra todas las mejoras disponibles al menos una vez",
    requirement: { type: "custom", value: "all_upgrades_once" },
    reward: { coins: 5000, xp: 500 },
    icon: ShoppingBag,
    category: "Coleccionismo",
    difficulty: "Difícil",
    timeEstimate: "Variable"
  },
  {
    id: "milestone_champion",
    name: "Campeón de Hitos",
    description: "Reclama 3 hitos de farmeo diferentes",
    requirement: { type: "custom", value: "milestones_3" },
    reward: { coins: 4000, xp: 400, cardId: "card_milestone_1" },
    icon: Trophy,
    category: "Progreso",
    difficulty: "Difícil",
    timeEstimate: "Variable"
  }
];

export const INITIAL_MISSIONS_STATE = MISSIONS.reduce((acc, mission) => {
  acc[mission.id] = { 
    completed: false, 
    claimed: false, 
    progress: 0,
    startedAt: null,
    completedAt: null
  };
  return acc;
}, {});

/* =====================================================
 💬 REDES SOCIALES - ACTUALIZADO
===================================================== */

export const SOCIAL_LINKS_DATA = [
  { 
    name: "Telegram", 
    icon: Send, 
    url: "https://t.me/cocodrilokombat",
    description: "Comunidad oficial y anuncios"
  },
  { 
    name: "X (Twitter)", 
    icon: Twitter, 
    url: "https://x.com/cocodrilokombat",
    description: "Noticias y actualizaciones"
  },
  { 
    name: "Discord", 
    icon: MessageSquare, 
    url: "https://discord.gg/cocodrilokombat",
    description: "Chat con la comunidad"
  },
  { 
    name: "YouTube", 
    icon: Youtube, 
    url: "https://youtube.com/c/cocodrilokombat",
    description: "Tutoriales y gameplays"
  },
  { 
    name: "Instagram", 
    icon: Instagram, 
    url: "https://instagram.com/cocodrilokombat",
    description: "Contenido visual"
  },
  { 
    name: "TikTok", 
    icon: Music, 
    url: "https://tiktok.com/@cocodrilokombat",
    description: "Clips virales"
  },
  { 
    name: "Reddit", 
    icon: Alien, 
    url: "https://reddit.com/r/cocodrilokombat",
    description: "Discusiones y memes"
  },
  { 
    name: "GitHub", 
    icon: Github, 
    url: "https://github.com/cocodrilokombat",
    description: "Código abierto"
  }
];

/* =====================================================
 🃏 CARTAS - SISTEMA EXPANDIDO
===================================================== */

export const CARDS_DATA = [
  { 
    id: "card_agility_1", 
    name: "Carta de Agilidad Menor", 
    description: "Aumenta la regeneración de energía en un 5%", 
    effect: { type: "energy_regen_boost_percent", value: 5 }, 
    rarity: "Común", 
    icon: FeatherIcon, 
    color: "text-gray-400",
    bgColor: "bg-gray-900/30",
    collection: "Agilidad",
    set: "Básico"
  },
  { 
    id: "card_fortune_1", 
    name: "Carta de Fortuna Menor", 
    description: "Aumenta las monedas por clic en +2", 
    effect: { type: "click_power_flat", value: 2 }, 
    rarity: "Común", 
    icon: StarIcon, 
    color: "text-green-400",
    bgColor: "bg-green-900/30",
    collection: "Fortuna",
    set: "Básico"
  },
  { 
    id: "card_power_1", 
    name: "Carta de Poder Bruto Menor", 
    description: "Aumenta el poder de clic base en +5", 
    effect: { type: "click_power_flat", value: 5 }, 
    rarity: "Poco Común", 
    icon: ZapIcon, 
    color: "text-blue-400",
    bgColor: "bg-blue-900/30",
    collection: "Poder",
    set: "Avanzado"
  },
  { 
    id: "card_luck_1", 
    name: "Carta de Suerte del Pantano", 
    description: "5% de probabilidad de obtener doble moneda por clic", 
    effect: { type: "double_coin_chance", value: 5 }, 
    rarity: "Rara", 
    icon: Diamond, 
    color: "text-purple-400",
    bgColor: "bg-purple-900/30",
    collection: "Suerte",
    set: "Avanzado"
  },
  { 
    id: "card_wisdom_1", 
    name: "Carta de Sabiduría Ancestral", 
    description: "Aumenta la experiencia ganada un 10%", 
    effect: { type: "xp_boost_percent", value: 10 }, 
    rarity: "Épica", 
    icon: Eye, 
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/30",
    collection: "Sabiduría",
    set: "Épico"
  },
  { 
    id: "card_swamp_mastery", 
    name: "Maestría del Pantano", 
    description: "Aumenta monedas por segundo un 10%", 
    effect: { type: "cps_boost_percent", value: 10 }, 
    rarity: "Legendaria", 
    icon: Crown, 
    color: "text-orange-400",
    bgColor: "bg-orange-900/30",
    collection: "Maestría",
    set: "Legendario"
  },
  { 
    id: "card_energy_flow", 
    name: "Flujo Energético", 
    description: "Reduce el costo de energía por clic en 20%", 
    effect: { type: "energy_cost_reduction", value: 20 }, 
    rarity: "Rara", 
    icon: Battery, 
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/30",
    collection: "Energía",
    set: "Avanzado"
  },
  { 
    id: "card_golden_touch", 
    name: "Toque de Oro", 
    description: "10% de probabilidad de recibir monedas extras por clic", 
    effect: { type: "bonus_coins_chance", value: 10 }, 
    rarity: "Épica", 
    icon: Gem, 
    color: "text-yellow-300",
    bgColor: "bg-yellow-800/30",
    collection: "Riqueza",
    set: "Épico"
  },
  { 
    id: "card_time_warp", 
    name: "Distorsión Temporal", 
    description: "Acelera la regeneración de energía en 15%", 
    effect: { type: "energy_regen_speed", value: 15 }, 
    rarity: "Legendaria", 
    icon: Clock, 
    color: "text-purple-300",
    bgColor: "bg-purple-800/30",
    collection: "Tiempo",
    set: "Legendario"
  },
  { 
    id: "card_community_spirit", 
    name: "Espíritu Comunitario", 
    description: "Aumenta recompensas de referidos en 25%", 
    effect: { type: "referral_boost", value: 25 }, 
    rarity: "Rara", 
    icon: Users, 
    color: "text-green-300",
    bgColor: "bg-green-800/30",
    collection: "Comunidad",
    set: "Avanzado"
  }
];

/* =====================================================
 🛍️ TIENDA - EXPANDIDA CON MÁS ÍTEMS
===================================================== */

export const SHOP_ITEMS = [
  // 🎨 Skins
  { 
    id: "skin_golden_croc", 
    name: "Cocodrilo Dorado", 
    description: "Una skin dorada brillante que otorga +10% de monedas por clic", 
    price: 10000, 
    type: "skin", 
    icon: Palette, 
    image: "/skins/golden_croc.png",
    rarity: "epic",
    effect: { type: "click_multiplier", value: 1.1 },
    category: "skins",
    limited: false,
    stock: -1
  },
  { 
    id: "skin_camo_croc", 
    name: "Cocodrilo Camuflaje", 
    description: "Skin de camuflaje que reduce el costo de energía en 15%", 
    price: 7500, 
    type: "skin", 
    icon: Palette, 
    image: "/skins/camo_croc.png",
    rarity: "rare",
    effect: { type: "energy_cost_reduction", value: 15 },
    category: "skins",
    limited: false,
    stock: -1
  },
  { 
    id: "skin_cyborg_croc", 
    name: "Cocodrilo Cyborg", 
    description: "Skin cibernética que aumenta monedas por segundo en 20%", 
    price: 15000, 
    type: "skin", 
    icon: Palette, 
    image: "/skins/cyborg_croc.png",
    rarity: "legendary",
    effect: { type: "cps_multiplier", value: 1.2 },
    category: "skins",
    limited: true,
    stock: 1000
  },
  { 
    id: "skin_shadow_croc", 
    name: "Cocodrilo Sombrío", 
    description: "Skin oscura con +15% de probabilidad de crítico", 
    price: 12000, 
    type: "skin", 
    icon: Moon, 
    image: "/skins/shadow_croc.png",
    rarity: "epic",
    effect: { type: "critical_chance", value: 15 },
    category: "skins",
    limited: true,
    stock: 500
  },
  { 
    id: "skin_ice_croc", 
    name: "Cocodrilo Glaciar", 
    description: "Skin helada que congela el tiempo de regeneración", 
    price: 18000, 
    type: "skin", 
    icon: Snowflake, 
    image: "/skins/ice_croc.png",
    rarity: "legendary",
    effect: { type: "energy_regen_speed", value: 30 },
    category: "skins",
    limited: true,
    stock: 250
  },

  // ⚡ Items permanentes
  { 
    id: "item_sharp_teeth", 
    name: "Dientes Afilados", 
    description: "+5 monedas por clic permanentemente", 
    price: 5000, 
    type: "item", 
    icon: ZapIcon, 
    effect: { type: "click_boost", value: 5 },
    rarity: "uncommon",
    category: "boost",
    stackable: false,
    maxQuantity: 1
  },
  { 
    id: "item_swamp_amulet", 
    name: "Amuleto del Pantano", 
    description: "+10 monedas por segundo permanentemente", 
    price: 8000, 
    type: "item", 
    icon: Shield, 
    effect: { type: "cps_boost", value: 10 },
    rarity: "rare",
    category: "boost",
    stackable: false,
    maxQuantity: 1
  },
  { 
    id: "item_golden_scales", 
    name: "Escamas Doradas", 
    description: "Aumenta todas las ganancias en 5%", 
    price: 20000, 
    type: "item", 
    icon: Gem, 
    effect: { type: "global_multiplier", value: 1.05 },
    rarity: "epic",
    category: "boost",
    stackable: false,
    maxQuantity: 1
  },
  { 
    id: "item_eternal_heart", 
    name: "Corazón Eterno", 
    description: "Aumenta energía máxima en 50", 
    price: 15000, 
    type: "item", 
    icon: Heart, 
    effect: { type: "max_energy_boost", value: 50 },
    rarity: "rare",
    category: "energy",
    stackable: false,
    maxQuantity: 1
  },

  // ⚗️ Consumibles
  { 
    id: "item_energy_drink", 
    name: "Bebida Energética Croc", 
    description: "Rellena instantáneamente 50 de energía", 
    price: 1000, 
    type: "consumable", 
    icon: ZapIcon, 
    effect: { type: "energy_fill", value: 50 },
    rarity: "common",
    category: "consumable",
    stackable: true,
    maxQuantity: 99
  },
  { 
    id: "item_lucky_coin", 
    name: "Moneda de la Suerte", 
    description: "Doble monedas por 5 minutos", 
    price: 2500, 
    type: "consumable", 
    icon: DollarSign, 
    effect: { type: "double_coins_temporary", duration: 300, value: 2 },
    rarity: "uncommon",
    category: "consumable",
    stackable: true,
    maxQuantity: 50
  },
  { 
    id: "item_time_warp_potion", 
    name: "Poción de Distorsión Temporal", 
    description: "Acelera todo x2 por 10 minutos", 
    price: 5000, 
    type: "consumable", 
    icon: Clock, 
    effect: { type: "speed_boost_temporary", duration: 600, value: 2 },
    rarity: "rare",
    category: "consumable",
    stackable: true,
    maxQuantity: 25
  },
  { 
    id: "item_golden_ticket", 
    name: "Boleto Dorado", 
    description: "Desbloquea una carta aleatoria épica o mejor", 
    price: 10000, 
    type: "consumable", 
    icon: Ticket, 
    effect: { type: "random_card", rarity: "epic+" },
    rarity: "epic",
    category: "consumable",
    stackable: true,
    maxQuantity: 10
  },

  // 🎁 Paquetes especiales
  { 
    id: "pack_starter", 
    name: "Pack Inicial", 
    description: "Pack especial para nuevos jugadores", 
    price: 5000, 
    type: "bundle", 
    icon: Package, 
    contents: [
      { type: "coins", value: 2000 },
      { type: "item", id: "item_energy_drink", quantity: 5 },
      { type: "card", rarity: "common" }
    ],
    rarity: "uncommon",
    category: "bundles",
    limited: true,
    stock: 1
  },
  { 
    id: "pack_premium", 
    name: "Pack Premium", 
    description: "Pack con items exclusivos", 
    price: 25000, 
    type: "bundle", 
    icon: Crown, 
    contents: [
      { type: "coins", value: 10000 },
      { type: "item", id: "item_lucky_coin", quantity: 10 },
      { type: "skin", id: "skin_camo_croc" },
      { type: "card", rarity: "rare+" }
    ],
    rarity: "epic",
    category: "bundles",
    limited: false,
    stock: -1
  }
];

/* =====================================================
 🏆 HITOS DE FARMEO - MEJORADOS
===================================================== */

export const FARMING_MILESTONES = [
  { 
    id: "fm_1", 
    name: "Pescador de CROC", 
    coinsRequired: 100000, 
    tokenReward: 10, 
    icon: Target,
    difficulty: "Fácil",
    estimatedTime: "1-2 horas",
    description: "Primer paso en tu camino como granjero CROC"
  },
  { 
    id: "fm_2", 
    name: "Cazador de CROC", 
    coinsRequired: 500000, 
    tokenReward: 50, 
    icon: Crosshair,
    difficulty: "Medio",
    estimatedTime: "5-6 horas",
    description: "Demuestra tu habilidad como cazador de tokens"
  },
  { 
    id: "fm_3", 
    name: "Maestro del Pantano CROC", 
    coinsRequired: 1000000, 
    tokenReward: 120, 
    icon: Crown,
    difficulty: "Difícil",
    estimatedTime: "10-12 horas",
    description: "Conviértete en el maestro indiscutido del pantano"
  },
  { 
    id: "fm_4", 
    name: "Rey Cocodrilo CROC", 
    coinsRequired: 5000000, 
    tokenReward: 600, 
    icon: Crown,
    difficulty: "Épico",
    estimatedTime: "2-3 días",
    description: "Alcanza la realeza del ecosistema CROC"
  },
  { 
    id: "fm_5", 
    name: "Leyenda del Nilo CROC", 
    coinsRequired: 10000000, 
    tokenReward: 1500, 
    icon: Trophy,
    difficulty: "Legendario",
    estimatedTime: "5-7 días",
    description: "Conviértete en una leyenda viva del farmeo"
  },
  { 
    id: "fm_6", 
    name: "Titán de CROC", 
    coinsRequired: 25000000, 
    tokenReward: 4000, 
    icon: Mountain,
    difficulty: "Mítico",
    estimatedTime: "2-3 semanas",
    description: "Logro solo alcanzable por los verdaderos titanes"
  },
  { 
    id: "fm_7", 
    name: "Dios del Farmeo", 
    coinsRequired: 50000000, 
    tokenReward: 10000, 
    icon: ZapSolid,
    difficulty: "Divino",
    estimatedTime: "1 mes+",
    description: "Transciende a la divinidad del farmeo CROC"
  }
];

export const INITIAL_FARMING_MILESTONES_STATE = FARMING_MILESTONES.reduce((acc, milestone) => {
  acc[milestone.id] = { 
    claimed: false,
    claimedAt: null,
    notified: false,
    progress: 0
  };
  return acc;
}, {});

/* =====================================================
 📊 RANKING - DATOS DE EJEMPLO
===================================================== */

export const RANKING_DATA = [
  { id: "player1", name: "Coco Supremo", score: 1578000, avatarSeed: "coco", level: 45, rank: 1 },
  { id: "player2", name: "Lagarto Alfa", score: 1230500, avatarSeed: "lagarto", level: 42, rank: 2 },
  { id: "player3", name: "Caimán Rey", score: 980200, avatarSeed: "caiman", level: 38, rank: 3 },
  { id: "player4", name: "SwampLord", score: 750000, avatarSeed: "swamp", level: 35, rank: 4 },
  { id: "player5", name: "GatorGlory", score: 550100, avatarSeed: "gator", level: 32, rank: 5 },
  { id: "player6", name: "MudMaster", score: 480300, avatarSeed: "mud", level: 30, rank: 6 },
  { id: "player7", name: "ReptileRuler", score: 320000, avatarSeed: "reptile", level: 28, rank: 7 },
  { id: "player8", name: "SnapJaw", score: 280700, avatarSeed: "snap", level: 27, rank: 8 },
  { id: "player9", name: "MarshKing", score: 190000, avatarSeed: "marsh", level: 25, rank: 9 },
  { id: "player10", name: "You", score: 0, avatarSeed: "you", isCurrentUser: true, level: 1, rank: 999 },
];

/* =====================================================
 🎓 TUTORIAL - PASOS MEJORADOS
===================================================== */

export const TUTORIAL_STEPS_CONTENT = [
  { 
    emoji: "🐊", 
    title: "¡Bienvenido a Cocodrilo Kombat!", 
    text: "Haz clic en el cocodrilo para ganar monedas. Cada mordisco te acerca más a convertirte en el rey del pantano.",
    duration: 5000,
    highlight: "game-area"
  },
  { 
    emoji: "🛒", 
    title: "Compra Mejoras", 
    text: "Usa tus monedas para comprar mejoras que aumenten tu poder de mordisco o generen monedas automáticamente.",
    duration: 6000,
    highlight: "upgrades-panel"
  },
  { 
    emoji: "🎯", 
    title: "Completa Misiones", 
    text: "Supera misiones para ganar recompensas especiales, incluyendo cartas de poder y tokens CROC.",
    duration: 5500,
    highlight: "missions-tab"
  },
  { 
    emoji: "🏆", 
    title: "Alcanza Hitos", 
    text: "Acumula monedas para desbloquear hitos de farmeo y ganar tokens CROC antes del lanzamiento oficial.",
    duration: 6000,
    highlight: "milestones-tab"
  },
  { 
    emoji: "🎨", 
    title: "Personaliza tu Cocodrilo", 
    text: "Visita la tienda para comprar skins y ítems que mejoren tu farmeo y hagan único a tu cocodrilo.",
    duration: 5500,
    highlight: "shop-tab"
  },
  { 
    emoji: "👥", 
    title: "Invita Amigos", 
    text: "Comparte tu enlace de referido para ganar recompensas cuando tus amigos se unan al juego.",
    duration: 5000,
    highlight: "referrals-widget"
  },
  { 
    emoji: "📊", 
    title: "Sigue tu Progreso", 
    text: "Revisa tus estadísticas para ver cuánto has avanzado y planificar tu próxima estrategia.",
    duration: 5500,
    highlight: "stats-tab"
  },
  { 
    emoji: "🚀", 
    title: "Explora el Ecosistema", 
    text: "Revisa el Fairlaunch y Whitepaper para aprender sobre el token CROC y el futuro del juego.",
    duration: 6000,
    highlight: "fairlaunch-tab"
  },
];

/* =====================================================
 🔧 CONSTANTES ADICIONALES
===================================================== */

// 📈 Experiencia requerida por nivel
export const EXPERIENCE_PER_LEVEL = 100;

// ⚡ Energía
export const ENERGY_REGEN_RATE = 1; // puntos por segundo
export const MAX_ENERGY_BASE = 100;

// 💰 Fórmulas de precio
export const UPGRADE_PRICE_MULTIPLIER = 1.5;
export const LEVEL_MULTIPLIER = 1.1;

// 🎯 Probabilidades
export const CRITICAL_CHANCE_BASE = 0.05; // 5%
export const CRITICAL_MULTIPLIER = 2.0;

// 🃏 Cartas
export const CARD_DROP_RATES = {
  common: 0.60,    // 60%
  uncommon: 0.25,  // 25%
  rare: 0.10,      // 10%
  epic: 0.04,      // 4%
  legendary: 0.01  // 1%
};

// 🏆 Recompensas diarias
export const DAILY_REWARD_MULTIPLIER = 1.1;
export const MAX_DAILY_STREAK = 365;

// 👥 Referidos
export const REFERRAL_REWARDS = {
  referrer: { coins: 1000, tokens: 10 },
  referred: { coins: 500, tokens: 5 }
};

// ⏰ Tiempos de refresco
export const REFRESH_INTERVALS = {
  energy: 1000,        // 1 segundo
  coins: 1000,         // 1 segundo
  autoSave: 30000,     // 30 segundos
  ranking: 60000       // 1 minuto
};

// 🎨 Colores del juego
export const GAME_COLORS = {
  primary: "#22c55e",      // Verde
  secondary: "#3b82f6",    // Azul
  accent: "#f59e0b",       // Amarillo
  success: "#10b981",      // Verde éxito
  warning: "#f59e0b",      // Amarillo advertencia
  danger: "#ef4444",       // Rojo peligro
  info: "#06b6d4",         // Cian info
  dark: "#1f2937",         // Gris oscuro
  light: "#f9fafb"         // Gris claro
};

// 🏷️ Categorías de logros
export const ACHIEVEMENT_CATEGORIES = {
  clicks: { name: "Clics", icon: MousePointer, color: "blue" },
  coins: { name: "Monedas", icon: DollarSign, color: "yellow" },
  upgrades: { name: "Mejoras", icon: TrendingUp, color: "green" },
  missions: { name: "Misiones", icon: Flag, color: "purple" },
  cards: { name: "Cartas", icon: Layers, color: "indigo" },
  items: { name: "Ítems", icon: ShoppingBag, color: "pink" },
  farming: { name: "Farmeo", icon: Target, color: "red" },
  level: { name: "Nivel", icon: AwardIconLucide, color: "orange" },
  referrals: { name: "Referidos", icon: Users, color: "teal" }
};

// 🆕 Importar iconos faltantes
const {
  MessageSquare,
  Music,
  Alien,
  Github,
  Cards,
  Clock,
  Ticket
} = {
  MessageSquare: ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Music: ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  Alien: ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>,
  Github: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
  Cards: ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Clock: ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Ticket: ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
};