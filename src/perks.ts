import { Perk } from './types';

export const ALL_PERKS: Perk[] = [
  {
    id: 'neon_shield',
    name: 'Неоновый щит',
    description: 'Первая допущенная ошибка не тратит жизнь',
    icon: '🛡️',
  },
  {
    id: 'time_warp',
    name: 'Тайм-варп',
    description: 'Шкала комбо остывает в 2 раза медленнее',
    icon: '⏳',
  },
  {
    id: 'fever_overdrive',
    name: 'Супер-Овердрайв',
    description: 'Режим Fever длится на 5 секунд дольше',
    icon: '⚡',
  },
  {
    id: 'power_bank',
    name: 'Генератор энергии',
    description: '+1 дополнительная подсказка на старте игры',
    icon: '🔋',
  },
  {
    id: 'keen_eye',
    name: 'Дальний радар',
    description: 'В «Тёмном секторе» луч сканера расширен до квадрата 5×5',
    icon: '📡',
  },
  {
    id: 'point_surge',
    name: 'Импульсный резонанс',
    description: '+50% бонусных Pulse очков за правильные ходы',
    icon: '💎',
  },
  {
    id: 'extra_heart',
    name: 'Квантовое сердце',
    description: 'Лимит ошибок увеличен на +2 жизни',
    icon: '❤️',
  },
  {
    id: 'combo_master',
    name: 'Комбо-ускоритель',
    description: 'Стартовый множитель комбо начинается с x2.0',
    icon: '🔥',
  },
  {
    id: 'auto_scanner',
    name: 'Нейро-сканер',
    description: 'Автоматически заполняет карандашные заметки на старте',
    icon: '🧠',
  },
];

/**
 * Returns random perks for the drafting screen, excluding already owned ones if possible.
 */
export function getRandomPerks(count: number = 3, excludeIds: string[] = []): Perk[] {
  const pool = ALL_PERKS.filter((p) => !excludeIds.includes(p.id));
  const source = pool.length >= count ? pool : ALL_PERKS;
  const shuffled = [...source].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
