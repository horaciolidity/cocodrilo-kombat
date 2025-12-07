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

// 🔧 CONFIGURACIÓN DE DIFICULTAD - PROTECCIÓN AIRDROP
export const DIFFICULTY_CONFIG = {
  BASE_CPS_MULTIPLIER: 0.5,           // Reducir producción de farmeo a la mitad
  BASE_CLICK_MULTIPLIER: 0.7,         // Reducir clics a 70%
  ENERGY_PER_CLICK: 2,                // Gastar 2 puntos de energía por clic
  ENERGY_REGEN_RATE: 5000,            // Regenerar energía cada 5 segundos
  EXPERIENCE_PER_CLICK: 0.5,          // Ganar 0.5 XP por clic
  LEVEL_FORMULA_EXPONENT: 1.5,        // Exponente para fórmula de niveles
  LEVEL_BASE_EXP: 100,                // Experiencia base por nivel
  UPGRADE_PRICE_MULTIPLIER_BASE: 2.0, // Multiplicador base de precios
};

// 🎯 FÓRMULAS DE NIVEL
export const calculateExperienceForNextLevel = (currentLevel) => {
  return Math.floor(DIFFICULTY_CONFIG.LEVEL_BASE_EXP * Math.pow(currentLevel, DIFFICULTY_CONFIG.LEVEL_FORMULA_EXPONENT));
};

export const calculateLevelFromExperience = (experience) => {
  let level = 1;
  let expNeeded = calculateExperienceForNextLevel(level);
  let totalExp = experience;
  
  while (totalExp >= expNeeded) {
    totalExp -= expNeeded;
    level++;
    expNeeded = calculateExperienceForNextLevel(level);
  }
  
  return {
    level,
    currentExperience: totalExp,
    nextLevelExperience: expNeeded
  };
};

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
  // 🆕 NIVEL DE DIFICULTAD
  difficultyLevel: 2, // 1=Fácil, 2=Normal, 3=Difícil
};

/* =====================================================
 🛠️ UPGRADES (con restricciones de nivel y límites máximos)
===================================================== */

export const UPGRADES = [
  {
    id: "autoClick",
    name: "Ciénaga Automática",
    description: "Genera 1 moneda por segundo",
    basePrice: 100, // 🆕 PRECIO AUMENTADO
    basePower: 1,
    icon: Activity,
    color: "text-green-400",
    type: "cps",
    image: "/images/upgrades/swamp.jpeg",
    requiredLevel: 1,      // 🆕 NIVEL REQUERIDO
    maxLevel: 10,          // 🆕 NIVEL MÁXIMO
    priceMultiplier: 2.5,  // 🆕 MULTIPLICADOR DE PRECIO AUMENTADO
    cpsMultiplier: 0.8,    // 🆕 MULTIPLICADOR DE PRODUCCIÓN REDUCIDO
  },
  {
    id: "mordiscoPoderoso",
    name: "Mordisco Poderoso",
    description: "Aumenta monedas por clic en +1",
    basePrice: 250, // 🆕 PRECIO AUMENTADO
    basePower: 1,
    icon: Target,
    color: "text-red-500",
    type: "click",
    image: "/images/upgrades/bite.jpeg",
    requiredLevel: 2,      // 🆕 NIVEL REQUERIDO
    maxLevel: 20,          // 🆕 NIVEL MÁXIMO
    priceMultiplier: 2.8,  // 🆕 MULTIPLICADOR DE PRECIO AUMENTADO
    clickMultiplier: 0.85, // 🆕 MULTIPLICADOR DE CLIC REDUCIDO
  },
  {
    id: "cazadorSigiloso",
    name: "Cazador Sigiloso",
    description: "Genera 5 monedas por segundo",
    basePrice: 1000, // 🆕 PRECIO AUMENTADO
    basePower: 5,
    icon: Compass,
    color: "text-teal-400",
    type: "cps",
    image: "/images/upgrades/hunter.jpeg",
    requiredLevel: 5,      // 🆕 NIVEL REQUERIDO
    maxLevel: 15,          // 🆕 NIVEL MÁXIMO
    priceMultiplier: 3.0,  // 🆕 MULTIPLICADOR DE PRECIO AUMENTADO
    cpsMultiplier: 0.75,   // 🆕 MULTIPLICADOR DE PRODUCCIÓN REDUCIDO
  },
  {
    id: "superCocodrilo",
    name: "Super Cocodrilo",
    description: "Multiplica monedas por clic x1.5",
    basePrice: 2500, // 🆕 PRECIO AUMENTADO
    basePower: 1.5,
    icon: Flame,
    color: "text-orange-500",
    type: "multiplier",
    image: "/images/upgrades/super_croc.jpeg",
    requiredLevel: 8,      // 🆕 NIVEL REQUERIDO (ALTO)
    maxLevel: 5,           // 🆕 NIVEL MÁXIMO (MUY LIMITADO)
    priceMultiplier: 3.5,  // 🆕 MULTIPLICADOR DE PRECIO AUMENTADO
    multiplierEffect: 0.9, // 🆕 EFECTO DE MULTIPLICADOR REDUCIDO
  },
  {
    id: "criaderoMasivo",
    name: "Criadero Masivo",
    description: "Genera 25 monedas por segundo",
    basePrice: 10000, // 🆕 PRECIO AUMENTADO
    basePower: 25,
    icon: Users,
    color: "text-lime-400",
    type: "cps",
    image: "/images/upgrades/breeding.jpeg",
    requiredLevel: 12,     // 🆕 NIVEL REQUERIDO (ALTO)
    maxLevel: 10,          // 🆕 NIVEL MÁXIMO
    priceMultiplier: 4.0,  // 🆕 MULTIPLICADOR DE PRECIO AUMENTADO
    cpsMultiplier: 0.7,    // 🆕 MULTIPLICADOR DE PRODUCCIÓN REDUCIDO
  },
  {
    id: "escamasReforzadas",
    name: "Escamas Reforzadas",
    description: "Aumenta monedas por clic en +10",
    basePrice: 5000, // 🆕 PRECIO AUMENTADO
    basePower: 10,
    icon: Shield,
    color: "text-gray-400",
    type: "click",
    image: "/images/upgrades/scales.jpeg",
    requiredLevel: 10,     // 🆕 NIVEL REQUERIDO
    maxLevel: 10,          // 🆕 NIVEL MÁXIMO
    priceMultiplier: 3.2,  // 🆕 MULTIPLICADOR DE PRECIO AUMENTADO
    clickMultiplier: 0.8,  // 🆕 MULTIPLICADOR DE CLIC REDUCIDO
  },
  {
    id: "rey_del_pantano",
    name: "Rey del Pantano",
    description: "Genera 100 monedas por segundo",
    basePrice: 50000, // 🆕 PRECIO AUMENTADO SIGNIFICATIVAMENTE
    basePower: 100,
    icon: Crown,
    color: "text-yellow-400",
    type: "cps",
    image: "/images/upgrades/swamp_king.jpeg",
    requiredLevel: 20,     // 🆕 NIVEL REQUERIDO (MUY ALTO)
    maxLevel: 5,           // 🆕 NIVEL MÁXIMO (MUY LIMITADO)
    priceMultiplier: 5.0,  // 🆕 MULTIPLICADOR DE PRECIO AUMENTADO
    cpsMultiplier: 0.6,    // 🆕 MULTIPLICADOR DE PRODUCCIÓN REDUCIDO
  },
];

export const INITIAL_UPGRADES_STATE = UPGRADES.reduce((acc, upgrade) => {
  acc[upgrade.id] = { level: 0, owned: 0 };
  return acc;
}, {});

/* =====================================================
 🏆 ACHIEVEMENTS (AJUSTADOS A NUEVA DIFICULTAD)
===================================================== */

export const ACHIEVEMENTS = [
  { 
    id: "first_click", 
    name: "Primer Mordisco", 
    description: "Haz tu primer clic", 
    requirement: 1, 
    type: "clicks", 
    icon: MousePointer,
    difficultyMultiplier: 1.0
  },
  { 
    id: "hundred_clicks", 
    name: "Cien Mordiscos", 
    description: "Haz 100 clics", 
    requirement: 250, // 🆕 REQUISITO AUMENTADO
    type: "clicks", 
    icon: Aperture,
    difficultyMultiplier: 2.5
  },
  { 
    id: "thousand_coins", 
    name: "Tesoro del Pantano", 
    description: "Acumula 1000 monedas", 
    requirement: 5000, // 🆕 REQUISITO AUMENTADO 5x
    type: "totalCoins", 
    icon: DollarSign,
    difficultyMultiplier: 5.0
  },
  { 
    id: "first_upgrade", 
    name: "Evolución Inicial", 
    description: "Compra tu primera mejora", 
    requirement: 1, 
    type: "upgrades", 
    icon: TrendingUp,
    difficultyMultiplier: 1.0
  },
  { 
    id: "ten_upgrades", 
    name: "Depredador Mejorado", 
    description: "Compra 10 mejoras (total niveles)", 
    requirement: 25, // 🆕 REQUISITO AUMENTADO
    type: "upgrades", 
    icon: Cpu,
    difficultyMultiplier: 2.5
  },
  { 
    id: "first_mission", 
    name: "Misión Inicial", 
    description: "Completa tu primera misión", 
    requirement: 1, 
    type: "missions", 
    icon: Flag,
    difficultyMultiplier: 1.0
  },
  { 
    id: "card_collector", 
    name: "Coleccionista de Cartas", 
    description: "Obtén 3 cartas diferentes", 
    requirement: 3, 
    type: "cards", 
    icon: Layers,
    difficultyMultiplier: 1.0
  },
  { 
    id: "shopaholic", 
    name: "Comprador Compulsivo", 
    description: "Compra 5 ítems en la tienda", 
    requirement: 5, 
    type: "items", 
    icon: ShoppingBag,
    difficultyMultiplier: 1.0
  },
  { 
    id: "croc_farmer_1", 
    name: "Granjero CROC I", 
    description: "Reclama tu primer hito de farmeo CROC.", 
    requirement: 1, 
    type: "farming_milestones", 
    icon: Target,
    difficultyMultiplier: 1.0
  },
];

/* =====================================================
 🎯 MISSIONS (AJUSTADAS A NUEVA DIFICULTAD)
===================================================== */

export const MISSIONS = [
  {
    id: "click_starter",
    name: "Cazador Novato",
    description: "Realiza 100 clics para demostrar tu instinto.", // 🆕 AUMENTADO
    requirement: { type: "clicks", value: 100 },
    reward: { coins: 200, xp: 50, cardId: "card_agility_1" },
    icon: Target,
    category: "Clics",
    difficultyMultiplier: 2.0,
  },
  {
    id: "coin_collector",
    name: "Recolector de Tesoros",
    description: "Acumula 2500 monedas en total.", // 🆕 AUMENTADO 5x
    requirement: { type: "coins", value: 2500 },
    reward: { coins: 500, xp: 100, cardId: "card_fortune_1" },
    icon: DollarSign,
    category: "Monedas",
    difficultyMultiplier: 5.0,
  },
  {
    id: "level_up_rookie",
    name: "Aprendiz de Depredador",
    description: "Alcanza el nivel 3.", // 🆕 AUMENTADO
    requirement: { type: "level", value: 3 },
    reward: { coins: 300, xp: 70 },
    icon: StarIcon,
    category: "Nivel",
    difficultyMultiplier: 1.5,
  },
  {
    id: "upgrade_enthusiast",
    name: "Entusiasta de la Evolución",
    description: 'Mejora "Mordisco Poderoso" al nivel 5.', // 🆕 AUMENTADO
    requirement: { type: "upgradeLevel", upgradeId: "mordiscoPoderoso", value: 5 },
    reward: { coins: 1000, xp: 150, cardId: "card_power_1" },
    icon: TrendingUp,
    category: "Mejoras",
    difficultyMultiplier: 1.7,
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
    difficultyMultiplier: 1.0,
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
    difficultyMultiplier: 1.0,
  },
];

export const INITIAL_MISSIONS_STATE = MISSIONS.reduce((acc, mission) => {
  acc[mission.id] = { completed: false, claimed: false, progress: 0 };
  return acc;
}, {});

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
  { 
    id: "card_agility_1", 
    name: "Carta de Agilidad Menor", 
    description: "Aumenta la regeneración de energía en un 5%.", 
    effect: { type: "energy_regen_boost_percent", value: 5 }, 
    rarity: "Común", 
    icon: FeatherIcon, 
    color: "text-gray-400" 
  },
  { 
    id: "card_fortune_1", 
    name: "Carta de Fortuna Menor", 
    description: "Aumenta las monedas por clic en +2.", 
    effect: { type: "click_power_flat", value: 2 }, 
    rarity: "Común", 
    icon: StarIcon, 
    color: "text-green-400" 
  },
  { 
    id: "card_power_1", 
    name: "Carta de Poder Bruto Menor", 
    description: "Aumenta el poder de clic base en +5.", 
    effect: { type: "click_power_flat", value: 5 }, 
    rarity: "Poco Común", 
    icon: ZapIcon, 
    color: "text-blue-400" 
  },
  { 
    id: "card_luck_1", 
    name: "Carta de Suerte del Pantano", 
    description: "Pequeña probabilidad de obtener doble moneda por clic (simulado).", 
    effect: { type: "double_coin_chance", value: 5 }, 
    rarity: "Rara", 
    icon: Diamond, 
    color: "text-purple-400" 
  },
  { 
    id: "card_wisdom_1", 
    name: "Carta de Sabiduría Ancestral", 
    description: "Aumenta la experiencia ganada un 10%.", 
    effect: { type: "xp_boost_percent", value: 10 }, 
    rarity: "Épica", 
    icon: Eye, 
    color: "text-yellow-400" 
  },
  { 
    id: "card_swamp_mastery", 
    name: "Maestría del Pantano", 
    description: "Aumenta monedas por segundo un 10%.", 
    effect: { type: "cps_boost_percent", value: 10 }, 
    rarity: "Legendaria", 
    icon: Crown, 
    color: "text-orange-400" 
  },
];

export const SHOP_ITEMS = [
  { 
    id: "skin_golden_croc", 
    name: "Cocodrilo Dorado", 
    description: "Una skin dorada brillante para tu cocodrilo.", 
    price: 20000, // 🆕 PRECIO AUMENTADO
    type: "skin", 
    icon: Palette, 
    image: "/skins/golden_croc.png" 
  },
  { 
    id: "skin_camo_croc", 
    name: "Cocodrilo Camuflaje", 
    description: "Perfecto para emboscadas en el pantano.", 
    price: 15000, // 🆕 PRECIO AUMENTADO
    type: "skin", 
    icon: Palette, 
    image: "/skins/camo_croc.png" 
  },
  { 
    id: "skin_cyborg_croc", 
    name: "Cocodrilo Cyborg", 
    description: "Mejoras cibernéticas para el depredador definitivo.", 
    price: 30000, // 🆕 PRECIO AUMENTADO
    type: "skin", 
    icon: Palette, 
    image: "/skins/cyborg_croc.png" 
  },
  { 
    id: "item_sharp_teeth", 
    name: "Dientes Afilados", 
    description: "+5 monedas por clic.", 
    price: 10000, // 🆕 PRECIO AUMENTADO
    type: "item", 
    icon: ZapIcon, 
    effect: { type: "click_boost", value: 5 } 
  },
  { 
    id: "item_swamp_amulet", 
    name: "Amuleto del Pantano", 
    description: "+10 monedas por segundo.", 
    price: 16000, // 🆕 PRECIO AUMENTADO
    type: "item", 
    icon: Shield, 
    effect: { type: "cps_boost", value: 10 } 
  },
  { 
    id: "item_energy_drink", 
    name: "Bebida Energética Croc", 
    description: "Rellena instantáneamente 50 de energía (consumible).", 
    price: 2000, // 🆕 PRECIO AUMENTADO
    type: "consumable", 
    icon: ZapIcon, 
    effect: { type: "energy_fill", value: 50 } 
  },
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
  { 
    emoji: "🐊", 
    title: "¡Bienvenido a Cocodrilo Kombat!", 
    text: "¡Haz clic en el cocodrilo para ganar monedas! ¡Cada mordisco cuenta! ⚠️ Modo difícil activado - El progreso es lento pero gratificante." 
  },
  { 
    emoji: "🛒", 
    title: "Compra Mejoras", 
    text: "Usa tus monedas para comprar mejoras que aumenten tu poder de mordisco o generen monedas automáticamente. ¡Ahora con restricciones de nivel y límites máximos!" 
  },
  { 
    emoji: "🎯", 
    title: "Completa Misiones e Hitos", 
    text: "¡Supera misiones y alcanza hitos de farmeo para ganar recompensas especiales, incluyendo tokens CROC y cartas de poder! Los requisitos son mayores para proteger el airdrop." 
  },
  { 
    emoji: "🎨", 
    title: "Personaliza y Potencia", 
    text: "Visita la tienda para comprar skins y ítems que mejoren tu farmeo. Los precios se han ajustado para reflejar la mayor dificultad." 
  },
  { 
    emoji: "🚀", 
    title: "Explora el Ecosistema", 
    text: "Revisa el Fairlaunch, Whitepaper y prepárate para más novedades. ¡Diviértete! El juego ahora es más estratégico y menos grind." 
  },
];

// 🔧 HITOS DE FARMEO - REQUISITOS AUMENTADOS SIGNIFICATIVAMENTE
export const FARMING_MILESTONES = [
  { 
    id: "fm_1", 
    name: "Pescador de CROC", 
    coinsRequired: 500000, // 🆕 AUMENTADO 5x
    tokenReward: 10, 
    icon: Target,
    estimatedTime: "2-4 semanas", // 🆕 TIEMPO ESTIMADO
  },
  { 
    id: "fm_2", 
    name: "Cazador de CROC", 
    coinsRequired: 2500000, // 🆕 AUMENTADO 5x
    tokenReward: 50, 
    icon: Target,
    estimatedTime: "1-2 meses",
  },
  { 
    id: "fm_3", 
    name: "Maestro del Pantano CROC", 
    coinsRequired: 10000000, // 🆕 AUMENTADO 10x
    tokenReward: 120, 
    icon: Target,
    estimatedTime: "3-6 meses",
  },
  { 
    id: "fm_4", 
    name: "Rey Cocodrilo CROC", 
    coinsRequired: 50000000, // 🆕 AUMENTADO 10x
    tokenReward: 600, 
    icon: Target,
    estimatedTime: "6-12 meses",
  },
  { 
    id: "fm_5", 
    name: "Leyenda del Nilo CROC", 
    coinsRequired: 250000000, // 🆕 AUMENTADO 25x
    tokenReward: 1500, 
    icon: Target,
    estimatedTime: "12+ meses",
  },
];

export const INITIAL_FARMING_MILESTONES_STATE = FARMING_MILESTONES.reduce((acc, milestone) => {
  acc[milestone.id] = { 
    claimed: false,
    notified: false,
    progress: 0
  };
  return acc;
}, {});

// 🔧 FUNCIONES DE UTILIDAD PARA LA DIFICULTAD
export const calculateUpgradePrice = (upgrade, currentLevel) => {
  const priceMultiplier = upgrade.priceMultiplier || DIFFICULTY_CONFIG.UPGRADE_PRICE_MULTIPLIER_BASE;
  return Math.floor(upgrade.basePrice * Math.pow(priceMultiplier, currentLevel));
};

export const calculateUpgradeEffectivePower = (upgrade, currentLevel) => {
  const basePower = upgrade.basePower;
  let effectivePower = basePower;
  
  // Aplicar multiplicadores de dificultad según el tipo
  if (upgrade.type === 'cps' && upgrade.cpsMultiplier) {
    effectivePower = basePower * upgrade.cpsMultiplier;
  } else if (upgrade.type === 'click' && upgrade.clickMultiplier) {
    effectivePower = basePower * upgrade.clickMultiplier;
  } else if (upgrade.type === 'multiplier' && upgrade.multiplierEffect) {
    effectivePower = basePower * upgrade.multiplierEffect;
  }
  
  return Math.floor(effectivePower);
};

export const getDifficultyDescription = (difficultyLevel) => {
  const difficulties = {
    1: { name: "Fácil", description: "Progreso rápido, ideal para principiantes" },
    2: { name: "Normal", description: "Balance entre desafío y progreso" },
    3: { name: "Difícil", description: "Desafío extremo, airdrop protegido" }
  };
  
  return difficulties[difficultyLevel] || difficulties[2];
};

// 🔧 CONSTANTES DE ENERGÍA Y REGENERACIÓN
export const ENERGY_CONFIG = {
  MAX_ENERGY: 100,
  REGEN_RATE: DIFFICULTY_CONFIG.ENERGY_REGEN_RATE, // 5 segundos por punto
  PER_CLICK: DIFFICULTY_CONFIG.ENERGY_PER_CLICK, // 2 puntos por clic
  BOOST_MULTIPLIER: 0.5, // Reducción de boosts del 50%
};

// 🔧 FACTORES DE PRODUCCIÓN
export const PRODUCTION_FACTORS = {
  CPS_BASE: DIFFICULTY_CONFIG.BASE_CPS_MULTIPLIER, // 0.5
  CLICK_BASE: DIFFICULTY_CONFIG.BASE_CLICK_MULTIPLIER, // 0.7
  XP_BASE: DIFFICULTY_CONFIG.EXPERIENCE_PER_CLICK, // 0.5
  LEVEL_EXPONENT: DIFFICULTY_CONFIG.LEVEL_FORMULA_EXPONENT, // 1.5
};