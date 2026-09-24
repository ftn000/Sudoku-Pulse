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
    name: 'Мощный фонарь',
    description: 'В Тумане войны радиус обзора увеличен в 2 раза',
    icon: '🔦',
  },
  {
    id: 'point_surge',
    name: 'Импульсный резонанс',
    description: '+50% бонусных Pulse очков за правильные ходы',
    icon: '💎',
  },
];

/**
 * Returns 3 random perks for the drafting screen.
 */
export function getRandomPerks(count: number = 3): Perk[] {
  const shuffled = [...ALL_PERKS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
