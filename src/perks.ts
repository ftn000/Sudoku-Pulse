import { Perk, GameMode } from './types';

export const ALL_PERKS: Perk[] = [
  {
    id: 'neon_shield',
    name: 'Неоновый щит',
    description: 'Блокирует ошибки на каждом этапе (+1 щит за уровень)',
    icon: '🛡️',
    level: 1,
  },
  {
    id: 'time_warp',
    name: 'Тайм-варп',
    description: 'Шкала комбо остывает значительно медленнее',
    icon: '⏳',
    level: 1,
  },
  {
    id: 'fever_overdrive',
    name: 'Супер-Овердрайв',
    description: 'Режим Fever длится на +5 сек дольше за уровень',
    icon: '⚡',
    level: 1,
  },
  {
    id: 'power_bank',
    name: 'Генератор энергии',
    description: '+1 дополнительная подсказка за уровень перка',
    icon: '🔋',
    level: 1,
  },
  {
    id: 'keen_eye',
    name: 'Дальний радар',
    description: 'В «Тёмном секторе» луч сканера расширен до 5×5 (7×7 на Ур. II)',
    icon: '📡',
    level: 1,
  },
  {
    id: 'point_surge',
    name: 'Импульсный резонанс',
    description: '+50% бонусных Pulse очков за каждый уровень перка',
    icon: '💎',
    level: 1,
  },
  {
    id: 'extra_heart',
    name: 'Квантовое сердце',
    description: 'Лимит ошибок увеличен на +2 жизни за уровень',
    icon: '❤️',
    level: 1,
  },
  {
    id: 'combo_master',
    name: 'Комбо-ускоритель',
    description: 'Базовый множитель комбо начинается с x2.0 (x3.0 на Ур. II)',
    icon: '🔥',
    level: 1,
  },
  {
    id: 'auto_scanner',
    name: 'Нейро-сканер',
    description: 'Автоматически заполняет карандашные заметки на старте',
    icon: '🧠',
    level: 1,
  },
  {
    id: 'emp_pulse',
    name: 'Импульс ЭМИ',
    description: 'В начале раунда автоматически расшифровывает +1 ячейку (+2 на Ур. II)',
    icon: '💥',
    level: 1,
  },
  {
    id: 'overcharge',
    name: 'Оверчардж',
    description: 'В режиме Fever множитель очков взлетает до x4.0 вместо x2.0',
    icon: '⚡',
    level: 1,
  },
  {
    id: 'chrono_boost',
    name: 'Хроно-буст',
    description: 'Первые 2 минуты игры начисляют удвоенные очки за ход',
    icon: '⏱️',
    level: 1,
  },
];

export function formatRomanLevel(level: number = 1): string {
  if (level <= 1) return '';
  if (level === 2) return ' II';
  if (level === 3) return ' III';
  return ` ${level}`;
}

/**
 * Returns random perks for the drafting screen with mode-aware filtering.
 * If the player already owns a perk at level < 3, it can appear as an upgrade (Level II / III).
 */
export function getRandomPerks(count: number = 3, ownedPerks: Perk[] = [], mode?: GameMode): Perk[] {
  const candidates: Perk[] = [];

  for (const base of ALL_PERKS) {
    // Mode-aware filter: 'keen_eye' (scanner radar) only works in Dark Sector (fog) or roguelite Run
    if (base.id === 'keen_eye' && mode && mode !== 'fog' && mode !== 'run') {
      continue;
    }

    const existing = ownedPerks.find((p) => p.id === base.id);
    if (!existing) {
      candidates.push({ ...base, level: 1 });
    } else if (base.id !== 'auto_scanner' && (existing.level || 1) < 3) {
      const nextLvl = (existing.level || 1) + 1;
      candidates.push({
        ...base,
        level: nextLvl,
        name: `${base.name}${formatRomanLevel(nextLvl)}`,
        description: `⬆️ Улучшение до Ур. ${nextLvl}: ${base.description}`,
      });
    }
  }

  const safePool = ALL_PERKS.filter(
    (p) => !(p.id === 'keen_eye' && mode && mode !== 'fog' && mode !== 'run')
  ).map((p) => ({ ...p, level: 1 }));

  const source = candidates.length >= count ? candidates : safePool;
  const shuffled = [...source].sort(() => 0.5 - Math.random());

  // Guarantee 'neon_shield' in the very first game draft for soft onboarding
  if (ownedPerks.length === 0) {
    const hasShield = shuffled.slice(0, count).some((p) => p.id === 'neon_shield');
    if (!hasShield) {
      const shieldIdx = shuffled.findIndex((p) => p.id === 'neon_shield');
      if (shieldIdx !== -1) {
        const swapIdx = Math.floor(Math.random() * count);
        [shuffled[swapIdx], shuffled[shieldIdx]] = [shuffled[shieldIdx], shuffled[swapIdx]];
      }
    }
  }

  return shuffled.slice(0, count);
}
