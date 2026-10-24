/** Récompenses de victoire : XP, pièces, objets lâchés, Lueur du boss, montées de niveau. */
import { recomputeHeroStats } from './combatants';
import { sum } from './math';
import { rollChance } from './random';
import { gainXp } from './stats';
import { isAlive, isDown } from './targeting';
import type { BattleContext, BattleRewards, Drop, EnemyCombatant, LevelUp, Rng } from './types';

export function rollDrops(defeated: readonly EnemyCombatant[], rng: Rng): Drop[] {
  const quantities = new Map<string, number>();
  for (const enemy of defeated) {
    for (const drop of enemy.data.drops) {
      if (rollChance(drop.chance, rng)) {
        quantities.set(drop.item, (quantities.get(drop.item) ?? 0) + 1);
      }
    }
  }
  return [...quantities.entries()].map(([item, quantity]) => ({ item, quantity }));
}

/** Chaque héros vivant reçoit toute l'XP, un héros K.O. la moitié. Les Lueurs redeviennent Liées. */
export function grantXp(ctx: BattleContext, xp: number): LevelUp[] {
  const levelUps: LevelUp[] = [];
  for (const hero of ctx.heroes) {
    const gain = isAlive(hero) ? xp : Math.floor(xp / 2);
    const result = gainXp(hero.data, { ...hero.state, hp: hero.hp, pr: hero.pr }, gain);
    hero.state = result.state;
    for (const lueur of hero.lueurs) lueur.state = 'liee';
    recomputeHeroStats(ctx, hero);
    hero.hp = Math.min(result.state.hp, hero.stats.hp);
    hero.pr = Math.min(result.state.pr, hero.stats.pr);
    hero.state = { ...hero.state, hp: hero.hp, pr: hero.pr };
    if (result.levelsGained > 0) {
      levelUps.push({
        hero: hero.data.id,
        from: result.state.level - result.levelsGained,
        to: result.state.level,
        stats: result.after,
      });
    }
  }
  return levelUps;
}

export function computeRewards(ctx: BattleContext): BattleRewards {
  const defeated = ctx.enemies.filter(isDown);
  const xp = sum(defeated.map((enemy) => enemy.data.xp));
  const coins = sum(defeated.map((enemy) => enemy.data.coins));
  const drops = rollDrops(defeated, ctx.rng);
  const lueur = defeated.map((enemy) => enemy.data.lueurReward).find((id) => id !== undefined);
  const levelUps = grantXp(ctx, xp);
  const rewards: BattleRewards = { xp, coins, drops, levelUps };
  if (lueur) rewards.lueur = lueur;
  return rewards;
}
