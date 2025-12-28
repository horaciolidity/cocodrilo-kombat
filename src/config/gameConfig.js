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
  // Agrega estos iconos adicionales:
  Zap,
  ShoppingCart,
  Coins as CoinsIcon,
  Award,
  Sparkles,
  Clock,
  Ticket,
  Gift,
  Heart,
  ChevronRight,
  TrendingDown as TrendingDownIcon,
  CloudSnow, // Usaremos CloudSnow en lugar de Snowflake
  Snowflake // Si no existe, usa CloudSnow
} from "lucide-react";

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
};

/* =====================================================
 🛠️ UPGRADES (con imágenes de portada)
===================================================== */

export const UPGRADES = [
  {
    id: "autoClick",
    name: "Ciénaga Automática",
    description: "Genera 1 moneda por segundo",
    basePrice: 50,
    basePower: 1,
    icon: Activity,
    color: "text-green-400",
    type: "cps",
    image: "/images/upgrades/swamp.jpeg",
  },
  {
    id: "mordiscoPoderoso",
    name: "Mordisco Poderoso",
    description: "Aumenta monedas por clic en +1",
    basePrice: 100,
    basePower: 1,
    icon: Target,
    color: "text-red-500",
    type: "click",
    image: "/images/upgrades/bite.jpeg",
  },
  {
    id: "cazadorSigiloso",
    name: "Cazador Sigiloso",
    description: "Genera 5 monedas por segundo",
    basePrice: 500,
    basePower: 5,
    icon: Compass,
    color: "text-teal-400",
    type: "cps",
    image: "/images/upgrades/hunter.jpeg",
  },
  {
    id: "superCocodrilo",
    name: "Super Cocodrilo",
    description: "Multiplica monedas por clic x1.5",
    basePrice: 1000,
    basePower: 1.5,
    icon: Flame,
    color: "text-orange-500",
    type: "multiplier",
    image: "/images/upgrades/super_croc.jpeg",
  },
  {
    id: "criaderoMasivo",
    name: "Criadero Masivo",
    description: "Genera 25 monedas por segundo",
    basePrice: 5000,
    basePower: 25,
    icon: Users,
    color: "text-lime-400",
    type: "cps",
    image: "/images/upgrades/breeding.jpeg",
  },
  {
    id: "escamasReforzadas",
    name: "Escamas Reforzadas",
    description: "Aumenta monedas por clic en +10",
    basePrice: 2500,
    basePower: 10,
    icon: Shield,
    color: "text-gray-400",
    type: "click",
    image: "/images/upgrades/scales.jpeg",
  },
  {
    id: "rey_del_pantano",
    name: "Rey del Pantano",
    description: "Genera 100 monedas por segundo",
    basePrice: 20000,
    basePower: 100,
    icon: Crown,
    color: "text-yellow-400",
    type: "cps",
    image: "/images/upgrades/swamp_king.jpeg",
  },
];

export const INITIAL_UPGRADES_STATE = UPGRADES.reduce((acc, upgrade) => {
  acc[upgrade.id] = { level: 0, owned: 0 };
  return acc;
}, {});

/* =====================================================
 🏆 ACHIEVEMENTS
===================================================== */

export const ACHIEVEMENTS = [
  { id: "first_click", name: "Primer Mordisco", description: "Haz tu primer clic", requirement: 1, type: "clicks", icon: MousePointer },
  { id: "hundred_clicks", name: "Cien Mordiscos", description: "Haz 100 clics", requirement: 100, type: "clicks", icon: Aperture },
  { id: "thousand_coins", name: "Tesoro del Pantano", description: "Acumula 1000 monedas", requirement: 1000, type: "totalCoins", icon: DollarSign },
  { id: "first_upgrade", name: "Evolución Inicial", description: "Compra tu primera mejora", requirement: 1, type: "upgrades", icon: TrendingUp },
  { id: "ten_upgrades", name: "Depredador Mejorado", description: "Compra 10 mejoras (total niveles)", requirement: 10, type: "upgrades", icon: Cpu },
  { id: "first_mission", name: "Misión Inicial", description: "Completa tu primera misión", requirement: 1, type: "missions", icon: Flag },
  { id: "card_collector", name: "Coleccionista de Cartas", description: "Obtén 3 cartas diferentes", requirement: 3, type: "cards", icon: Layers },
  { id: "shopaholic", name: "Comprador Compulsivo", description: "Compra 5 ítems en la tienda", requirement: 5, type: "items", icon: ShoppingBag },
  { id: "croc_farmer_1", name: "Granjero CROC I", description: "Reclama tu primer hito de farmeo CROC.", requirement: 1, type: "farming_milestones", icon: Target },
];

/* =====================================================
 🎯 MISSIONS
===================================================== */

export const MISSIONS = [
  {
    id: "click_starter",
    name: "Cazador Novato",
    description: "Realiza 50 clics para demostrar tu instinto.",
    requirement: { type: "clicks", value: 50 },
    reward: { coins: 200, xp: 50, cardId: "card_agility_1" },
    icon: Target,
    category: "Clics",
  },
  {
    id: "coin_collector",
    name: "Recolector de Tesoros",
    description: "Acumula 500 monedas en total.",
    requirement: { type: "coins", value: 500 },
    reward: { coins: 500, xp: 100, cardId: "card_fortune_1" },
    icon: DollarSign,
    category: "Monedas",
  },
  {
    id: "level_up_rookie",
    name: "Aprendiz de Depredador",
    description: "Alcanza el nivel 2.",
    requirement: { type: "level", value: 2 },
    reward: { coins: 300, xp: 70 },
    icon: StarIcon,
    category: "Nivel",
  },
  {
    id: "upgrade_enthusiast",
    name: "Entusiasta de la Evolución",
    description: 'Mejora "Mordisco Poderoso" al nivel 3.',
    requirement: { type: "upgradeLevel", upgradeId: "mordiscoPoderoso", value: 3 },
    reward: { coins: 1000, xp: 150, cardId: "card_power_1" },
    icon: TrendingUp,
    category: "Mejoras",
  },
  {
    id: "social_share_twitter",
    name: "Comparte en X",
    description: "Comparte Cocodrilo Kombat en X (Twitter).",
    requirement: {
      type: "social_share",
      value: 1,
      url: "https://twitter.com/intent/tweet?text=¡Jugando%20Cocodrilo%20Kombat!%20%23CocodriloKombat%20%23PlayToEarn&url=YOUR_GAME_URL_HERE",
      actionText: "Compartir en X",
    },
    reward: { coins: 250, xp: 50 },
    icon: Share2,
    category: "Social",
  },
  {
    id: "social_follow_telegram",
    name: "Sigue en Telegram",
    description: "Únete a nuestro canal de Telegram.",
    requirement: {
      type: "social_follow",
      value: 1,
      url: "https://t.me/yourchannel",
      actionText: "Unirse a Telegram",
    },
    reward: { coins: 250, xp: 50 },
    icon: UserPlusIcon,
    category: "Social",
  },
];

export const INITIAL_MISSIONS_STATE = MISSIONS.reduce((acc, mission) => {
  acc[mission.id] = { completed: false, claimed: false, progress: 0 };
  return acc;
}, {});

export const DAILY_EVENTS = [
  {
    id: "double_coins_hour",
    name: "Hora Doble Monedas",
    time: "18:00-19:00",
    multiplier: 2
  }
];

/* =====================================================
 💬 RESTO DE CONFIG
===================================================== */

export const SOCIAL_LINKS_DATA = [
  { name: "Telegram", icon: Send, url: "https://t.me/yourchannel" },
  { name: "Instagram", icon: Instagram, url: "https://instagram.com/yourprofile" },
  { name: "X", icon: Twitter, url: "https://x.com/yourprofile" },
  { name: "Facebook", icon: Facebook, url: "https://facebook.com/yourpage" },
  { name: "YouTube", icon: Youtube, url: "https://youtube.com/yourchannel" },
  { name: "TikTok", icon: Twitch, url: "https://tiktok.com/@yourprofile" },
];

export const CARDS_DATA = [
  { id: "card_agility_1", name: "Carta de Agilidad Menor", description: "Aumenta la regeneración de energía en un 5%.", effect: { type: "energy_regen_boost_percent", value: 5 }, rarity: "Común", icon: FeatherIcon, color: "text-gray-400" },
  { id: "card_fortune_1", name: "Carta de Fortuna Menor", description: "Aumenta las monedas por clic en +2.", effect: { type: "click_power_flat", value: 2 }, rarity: "Común", icon: StarIcon, color: "text-green-400" },
  { id: "card_power_1", name: "Carta de Poder Bruto Menor", description: "Aumenta el poder de clic base en +5.", effect: { type: "click_power_flat", value: 5 }, rarity: "Poco Común", icon: ZapIcon, color: "text-blue-400" },
  { id: "card_luck_1", name: "Carta de Suerte del Pantano", description: "Pequeña probabilidad de obtener doble moneda por clic (simulado).", effect: { type: "double_coin_chance", value: 5 }, rarity: "Rara", icon: Diamond, color: "text-purple-400" },
  { id: "card_wisdom_1", name: "Carta de Sabiduría Ancestral", description: "Aumenta la experiencia ganada un 10%.", effect: { type: "xp_boost_percent", value: 10 }, rarity: "Épica", icon: Eye, color: "text-yellow-400" },
  { id: "card_swamp_mastery", name: "Maestría del Pantano", description: "Aumenta monedas por segundo un 10%.", effect: { type: "cps_boost_percent", value: 10 }, rarity: "Legendaria", icon: Crown, color: "text-orange-400" },
];

/* =====================================================
 🛍️ SHOP ITEMS CORREGIDOS (sin Snowflake)
===================================================== */

export const SHOP_ITEMS = [
  // Skins
  {
    id: 'skin_golden_croc',
    name: 'Cocodrilo Dorado',
    type: 'skin',
    price: 10000,
    priceCroc: 500,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=golden_croc&backgroundColor=ffd700,ffed4e,fbbf24&scale=90',
    description: 'Un cocodrilo cubierto de oro puro. Brilla en la oscuridad.',
    rarity: 'legendary',
    requiredLevel: 10,
    effect: { 
      prestige: 50,
      clickMultiplier: 1.1
    },
    icon: Crown
  },
  {
    id: 'skin_camo_croc',
    name: 'Cocodrilo Camuflaje',
    type: 'skin',
    price: 5000,
    priceCroc: 250,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=camo_croc&backgroundColor=22c55e,16a34a,15803d&scale=90',
    description: 'Perfecto para acechar en el pantano sin ser detectado.',
    rarity: 'rare',
    requiredLevel: 5,
    effect: {
      stealth: 30,
      energyRegen: 1.05
    },
    icon: Shield
  },
  {
    id: 'skin_cyborg_croc',
    name: 'Cocodrilo Ciborg',
    type: 'skin',
    price: 15000,
    priceCroc: 750,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cyborg_croc&backgroundColor=3b82f6,1d4ed8,1e40af&scale=90',
    description: 'Mitad máquina, mitad depredador. El futuro del pantano.',
    rarity: 'epic',
    requiredLevel: 15,
    effect: {
      cpsBoost: 2.0,
      clickPower: 20
    },
    icon: Cpu
  },
  {
    id: 'skin_fire_croc',
    name: 'Cocodrilo Ígneo',
    type: 'skin',
    price: 20000,
    priceCroc: 1000,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=fire_croc&backgroundColor=dc2626,b91c1c,991b1b&scale=90',
    description: 'Arde con el fuego del dragón antiguo.',
    rarity: 'legendary',
    requiredLevel: 20,
    effect: {
      clickMultiplier: 1.3,
      energy: 50
    },
    icon: Flame
  },
  {
    id: 'skin_ice_croc',
    name: 'Cocodrilo Glacial',
    type: 'skin',
    price: 8000,
    priceCroc: 400,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ice_croc&backgroundColor=0ea5e9,0284c7,0369a1&scale=90',
    description: 'Congela a tus enemigos con un solo vistazo.',
    rarity: 'rare',
    requiredLevel: 8,
    effect: {
      energyRegen: 1.15,
      cpsBoost: 1.5
    },
    icon: CloudSnow // Cambiado de Snowflake a CloudSnow
  },
  
  // Items
  {
    id: 'auto_clicker',
    name: 'Auto-Clicker 3000',
    type: 'item',
    price: 25000,
    priceCroc: 1000,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=auto_clicker&backgroundColor=8b5cf6,7c3aed,6d28d9',
    description: 'Hace clics automáticamente por ti.',
    effect: {
      autoClicks: 5,
      duration: 'permanent'
    },
    icon: Zap
  },
  {
    id: 'energy_potion',
    name: 'Poción de Energía XL',
    type: 'consumable',
    price: 1000,
    priceCroc: 50,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=energy_potion&backgroundColor=10b981,059669,047857',
    description: 'Restaura 100 puntos de energía inmediatamente.',
    effect: {
      energy: 100
    },
    icon: Zap
  },
  {
    id: 'double_coins_boost',
    name: 'Boost x2 Monedas',
    type: 'boost',
    price: 2000,
    priceCroc: 100,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=coin_boost&backgroundColor=fbbf24,f59e0b,d97706',
    description: 'Duplica todas las monedas obtenidas por 1 hora.',
    effect: {
      coinMultiplier: 2,
      duration: 3600
    },
    icon: TrendingUp
  },
  {
    id: 'lucky_charm',
    name: 'Amuleto de la Suerte',
    type: 'item',
    price: 15000,
    priceCroc: 600,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=lucky_charm&backgroundColor=a855f7,9333ea,7e22ce',
    description: 'Aumenta la probabilidad de obtener CROC en misiones.',
    effect: {
      luck: 15,
      duration: 'permanent'
    },
    icon: Sparkles
  },
  {
    id: 'xp_booster',
    name: 'Booster de Experiencia',
    type: 'boost',
    price: 3000,
    priceCroc: 150,
    currency: 'both',
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=xp_booster&backgroundColor=ec4899,db2777,be185d',
    description: 'Aumenta la experiencia ganada en un 50% por 30 minutos.',
    effect: {
      xpMultiplier: 1.5,
      duration: 1800
    },
    icon: TrendingUp
  }
];

export const RANKING_DATA = [
  { id: "player1", name: "Coco Supremo", score: 1578000, avatarSeed: "coco" },
  { id: "player2", name: "Lagarto Alfa", score: 1230500, avatarSeed: "lagarto" },
  { id: "player3", name: "Caimán Rey", score: 980200, avatarSeed: "caiman" },
  { id: "player4", name: "SwampLord", score: 750000, avatarSeed: "swamp" },
  { id: "player5", name: "GatorGlory", score: 550100, avatarSeed: "gator" },
  { id: "player6", name: "MudMaster", score: 480300, avatarSeed: "mud" },
  { id: "player7", name: "ReptileRuler", score: 320000, avatarSeed: "reptile" },
  { id: "player8", name: "SnapJaw", score: 280700, avatarSeed: "snap" },
  { id: "player9", name: "MarshKing", score: 190000, avatarSeed: "marsh" },
  { id: "player10", name: "You", score: 0, avatarSeed: "you", isCurrentUser: true },
];

export const TUTORIAL_STEPS_CONTENT = [
  { emoji: "🐊", title: "¡Bienvenido a Cocodrilo Kombat!", text: "¡Haz clic en el cocodrilo para ganar monedas! ¡Cada mordisco cuenta!" },
  { emoji: "🛒", title: "Compra Mejoras", text: "Usa tus monedas para comprar mejoras que aumenten tu poder de mordisco o generen monedas automáticamente." },
  { emoji: "🎯", title: "Completa Misiones e Hitos", text: "¡Supera misiones y alcanza hitos de farmeo para ganar recompensas especiales, incluyendo tokens CROC y cartas de poder!" },
  { emoji: "🎨", title: "Personaliza y Potencia", text: "Visita la tienda para comprar skins y ítems que mejoren tu farmeo." },
  { emoji: "🚀", title: "Explora el Ecosistema", text: "Revisa el Fairlaunch, Whitepaper y prepárate para más novedades. ¡Diviértete!" },
];

export const FARMING_MILESTONES = [
  { id: "fm_1", name: "Pescador de CROC", coinsRequired: 100000, tokenReward: 10, icon: Target },
  { id: "fm_2", name: "Cazador de CROC", coinsRequired: 500000, tokenReward: 50, icon: Target },
  { id: "fm_3", name: "Maestro del Pantano CROC", coinsRequired: 1000000, tokenReward: 120, icon: Target },
  { id: "fm_4", name: "Rey Cocodrilo CROC", coinsRequired: 5000000, tokenReward: 600, icon: Target },
  { id: "fm_5", name: "Leyenda del Nilo CROC", coinsRequired: 10000000, tokenReward: 1500, icon: Target },
];

export const INITIAL_FARMING_MILESTONES_STATE = FARMING_MILESTONES.reduce((acc, milestone) => {
  acc[milestone.id] = { claimed: false };
  return acc;
}, {});