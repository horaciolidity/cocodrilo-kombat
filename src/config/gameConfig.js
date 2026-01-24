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
  {
    id: "daily_youtube_sub",
    name: "Suscripción Diaria YouTube",
    description: "Visita nuestro canal y completa las acciones diarias para ganar CROC y Monedas.",
    reward: { coins: 2500, xp: 100, croc: 10 },
    icon: Youtube,
    category: "Diario",
    validation_type: "youtube_actions"
  },
  {
    id: "daily_secret_code",
    name: "Código Secreto del Vídeo",
    description: "Busca el código de 6 dígitos en el vídeo de hoy y multiplícalo.",
    reward: { coins: 0, xp: 150 }, // Reward is dynamic from DB but we show 0 or description
    icon: CalendarCheck,
    category: "Diario",
    validation_type: "daily_code"
  },
];

export const INITIAL_MISSIONS_STATE = MISSIONS.reduce((acc, mission) => {
  acc[mission.id] = { completed: false, claimed: false, progress: 0 };
  return acc;
}, {});


// En gameConfig.js - Agregar eventos
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

// En gameConfig.js - dentro de SHOP_ITEMS, reemplazar con esto:
export const SHOP_ITEMS = [
  // 🎨 SKINS (10 skins con imágenes reales)
  {
    id: 'skin_golden_croc',
    name: 'Cocodrilo Dorado',
    type: 'skin',
    price: 100000,
    priceCroc: 1000,
    currency: 'both',
    image: '/images/skins/golden_croc.jpg',
    description: 'Pura elegancia dorada. +15% poder de click',
    rarity: 'legendary',
    requiredLevel: 10,
    effect: { clickMultiplier: 1.15, cpsBoost: 10 }
  },
  {
    id: 'skin_camo_croc',
    name: 'Cocodrilo Camuflaje',
    type: 'skin',
    price: 50000,
    priceCroc: 500,
    currency: 'both',
    image: '/images/skins/camo_croc.jpg',
    description: 'Acecha en el pantano. +10% regeneración energía',
    rarity: 'rare',
    requiredLevel: 5,
    effect: { energyRegen: 1.1, stealth: 25 }
  },
  {
    id: 'skin_fire_croc',
    name: 'Cocodrilo Ígneo',
    type: 'skin',
    price: 150000,
    priceCroc: 1500,
    currency: 'both',
    image: '/images/skins/fire_croc.jpg',
    description: 'Lava pura. +25% poder de click',
    rarity: 'legendary',
    requiredLevel: 20,
    effect: { clickMultiplier: 1.25, burnEffect: true }
  },
  {
    id: 'skin_ice_croc',
    name: 'Cocodrilo Glaciar',
    type: 'skin',
    price: 80000,
    priceCroc: 800,
    currency: 'both',
    image: '/images/skins/ice_croc.jpg',
    description: 'Gélido y letal. Congela el CPS enemigo',
    rarity: 'epic',
    requiredLevel: 15,
    effect: { slowEnemyCPS: 0.5, clickPower: 15 }
  },
  {
    id: 'skin_cyborg_croc',
    name: 'Cyborg 9000',
    type: 'skin',
    price: 200000,
    priceCroc: 2000,
    currency: 'both',
    image: '/images/skins/cyborg_croc.jpg',
    description: 'Tecnología de punta. +50 CPS automático',
    rarity: 'legendary',
    requiredLevel: 25,
    effect: { autoClicks: 50, clickMultiplier: 1.2 }
  },

  // ⚡ ITEMS DE POTENCIA (5 items)
  {
    id: 'auto_clicker_pro',
    name: 'Auto-Clicker Pro',
    type: 'item',
    price: 50000,
    priceCroc: 500,
    currency: 'both',
    image: '/images/items/auto_clicker.jpg',
    description: '20 clics automáticos por segundo',
    effect: { autoClicks: 20, duration: 'permanent' }
  },
  {
    id: 'energy_core',
    name: 'Núcleo de Energía',
    type: 'item',
    price: 30000,
    priceCroc: 300,
    currency: 'both',
    image: '/images/items/energy_core.jpg',
    description: '+100 energía máxima permanente',
    effect: { maxEnergy: 100, energyRegen: 1.2 }
  },
  {
    id: 'cps_amplifier',
    name: 'Amplificador CPS',
    type: 'item',
    price: 75000,
    priceCroc: 750,
    currency: 'both',
    image: '/images/items/cps_amplifier.jpg',
    description: 'Doble CPS por 24 horas',
    effect: { cpsMultiplier: 2, duration: 86400 }
  },

  // 🚀 BOOSTS TEMPORALES (5 boosts)
  {
    id: 'double_coins_boost',
    name: 'Boost x2 Monedas',
    type: 'boost',
    price: 15000,
    priceCroc: 150,
    currency: 'both',
    image: '/images/boosts/double_coins.jpg',
    description: 'Duplica monedas por 1 hora',
    effect: { coinMultiplier: 2, duration: 3600 }
  },
  {
    id: 'triple_click_boost',
    name: 'Furia de Clics x3',
    type: 'boost',
    price: 25000,
    priceCroc: 250,
    currency: 'both',
    image: '/images/boosts/triple_click.jpg',
    description: 'Triple poder de click por 30 min',
    effect: { clickMultiplier: 3, duration: 1800 }
  },
  {
    id: 'energy_refill_boost',
    name: 'Recarga Instantánea',
    type: 'boost',
    price: 10000,
    priceCroc: 100,
    currency: 'both',
    image: '/images/boosts/energy_refill.jpg',
    description: 'Energía al 100% inmediatamente',
    effect: { energyRefill: 'full', instant: true }
  },

  // 🧪 CONSUMIBLES (5 consumibles)
  {
    id: 'energy_potion_xl',
    name: 'Poción Energía XL',
    type: 'consumable',
    price: 5000,
    priceCroc: 50,
    currency: 'both',
    image: '/images/consumables/energy_potion.jpg',
    description: 'Restaura 100 energía',
    effect: { energy: 100 }
  },
  {
    id: 'coin_crate',
    name: 'Cofre de Monedas',
    type: 'consumable',
    price: 10000,
    priceCroc: 100,
    currency: 'both',
    image: '/images/consumables/coin_crate.jpg',
    description: 'Contiene 10,000 monedas',
    effect: { coins: 10000 }
  },
  {
    id: 'croc_token_bag',
    name: 'Bolsa CROC',
    type: 'consumable',
    price: 50000,
    priceCroc: 0,
    currency: 'coins',
    image: '/images/consumables/croc_bag.jpg',
    description: 'Contiene 100 tokens CROC',
    effect: { crocTokens: 100 }
  },
  {
    id: 'xp_elixir',
    name: 'Elixir de Experiencia',
    type: 'consumable',
    price: 20000,
    priceCroc: 200,
    currency: 'both',
    image: '/images/consumables/xp_elixir.jpg',
    description: '+500 XP inmediato',
    effect: { experience: 500 }
  },

  // 🆕 NUEVOS ITEMS AÑADIDOS
  {
    id: 'skin_swamp_guardian',
    name: 'Cocodrilo Guardián',
    type: 'skin',
    price: 300000,
    priceCroc: 3000,
    currency: 'both',
    image: '/images/skins/camo_croc.jpg', // Reusing camo image
    description: 'Protector ancestral. +200 energía máx',
    rarity: 'legendary',
    requiredLevel: 30,
    effect: { maxEnergy: 200, energyRegen: 1.5 }
  },
  {
    id: 'click_frenzy_boost',
    name: 'Frenesí Temporal',
    type: 'boost',
    price: 5000,
    priceCroc: 50,
    currency: 'both',
    image: '/images/boosts/triple_click.jpg',
    description: 'Poder de clic x5 por 1 minuto',
    effect: { clickMultiplier: 5, duration: 60 }
  },
  {
    id: 'small_energy_drink',
    name: 'Bebida Energética',
    type: 'consumable',
    price: 1000,
    priceCroc: 10,
    currency: 'both',
    image: '/images/consumables/energy_potion.jpg',
    description: 'Recupera 50 de energía',
    effect: { energy: 50 }
  },
  {
    id: 'beginner_kit',
    name: 'Kit de Inicio',
    type: 'consumable',
    price: 2500,
    priceCroc: 25,
    currency: 'coins',
    image: '/images/consumables/coin_crate.jpg',
    description: '2000 monedas + 25 energía',
    effect: { coins: 2000, energy: 25 }
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
