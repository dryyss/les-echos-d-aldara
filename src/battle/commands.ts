/** Liste des commandes disponibles pour un héros et validation d'une commande soumise. */
import type { SpellData } from '../data/types';
import { itemCandidates } from './items';
import { canAct, isSilenced } from './status';
import { availableSummons } from './summons';
import { aliveEnemies, canFleeNow, isAlive, isSingleScope, scopeCandidates } from './targeting';
import type {
  AvailableCommand,
  BattleCommand,
  BattleContext,
  HeroCombatant,
  HeroLueur,
  TargetChoice,
} from './types';
import { unleashCandidates } from './unleash';

export function teamLueurs(ctx: BattleContext): HeroLueur[] {
  return ctx.heroes.flatMap((hero) => hero.lueurs);
}

/** Un Accord demande ses deux éléments parmi les héros vivants et capables d'agir. */
export function accordAvailable(ctx: BattleContext, spell: SpellData): boolean {
  if (!spell.accord) return true;
  const present = new Set(
    ctx.heroes
      .filter((hero) => isAlive(hero) && canAct(hero.statuses))
      .map((hero) => hero.data.element),
  );
  return spell.accord.every((element) => present.has(element));
}

export function spellChoice(ctx: BattleContext, hero: HeroCombatant, spell: SpellData): TargetChoice {
  const candidates = scopeCandidates(ctx, hero, spell.targets, { koOnly: spell.kind === 'revive' });
  return {
    targets: candidates.map((candidate) => candidate.id),
    needsTarget: isSingleScope(spell.targets) && spell.targets !== 'self',
  };
}

const usable = (choice: TargetChoice): boolean => choice.targets.length > 0;

function spellCommands(ctx: BattleContext, hero: HeroCombatant): AvailableCommand[] {
  if (isSilenced(hero.statuses)) return [];
  const commands: AvailableCommand[] = [];
  for (const spell of hero.spells) {
    if (hero.pr < spell.cost || !accordAvailable(ctx, spell)) continue;
    const choice = spellChoice(ctx, hero, spell);
    if (!usable(choice)) continue;
    commands.push({ kind: 'spell', spellId: spell.id, name: spell.name, cost: spell.cost, ...choice });
  }
  return commands;
}

function lueurCommands(ctx: BattleContext, hero: HeroCombatant): AvailableCommand[] {
  const commands: AvailableCommand[] = [];
  for (const lueur of hero.lueurs) {
    if (lueur.state !== 'liee') continue;
    const choice = unleashCandidates(ctx, hero, lueur.data.unleash);
    if (!usable(choice)) continue;
    commands.push({ kind: 'lueur', lueurId: lueur.data.id, name: lueur.data.name, ...choice });
  }
  return commands;
}

function summonCommands(ctx: BattleContext, hero: HeroCombatant): AvailableCommand[] {
  const commands: AvailableCommand[] = [];
  for (const summon of availableSummons(ctx.summons, teamLueurs(ctx))) {
    const choice = unleashCandidates(ctx, hero, summon.effect);
    if (!usable(choice)) continue;
    commands.push({ kind: 'summon', summonId: summon.id, name: summon.name, ...choice });
  }
  return commands;
}

function itemCommands(ctx: BattleContext, hero: HeroCombatant): AvailableCommand[] {
  const commands: AvailableCommand[] = [];
  for (const [itemId, quantity] of Object.entries(ctx.inventory)) {
    if (quantity <= 0) continue;
    const item = ctx.items[itemId];
    if (!item || item.kind !== 'consumable' || !item.effect) continue;
    const choice = itemCandidates(ctx, hero, item.effect);
    if (!choice || !usable(choice)) continue;
    commands.push({ kind: 'item', itemId, name: item.name, quantity, ...choice });
  }
  return commands;
}

export function availableCommands(ctx: BattleContext, heroIndex: number): AvailableCommand[] {
  const hero = ctx.heroes[heroIndex];
  if (!hero || !isAlive(hero) || !canAct(hero.statuses)) return [];
  const commands: AvailableCommand[] = [];
  const enemies = aliveEnemies(ctx).map((enemy) => enemy.id);
  if (enemies.length > 0) commands.push({ kind: 'attack', targets: enemies, needsTarget: true });
  commands.push(
    ...spellCommands(ctx, hero),
    ...lueurCommands(ctx, hero),
    ...summonCommands(ctx, hero),
    ...itemCommands(ctx, hero),
  );
  commands.push({ kind: 'defend' });
  if (canFleeNow(ctx)) commands.push({ kind: 'flee' });
  return commands;
}

function targetOk(choice: AvailableCommand | undefined, target: string | undefined): boolean {
  if (!choice || !('targets' in choice)) return false;
  if (!choice.needsTarget) return true;
  return target !== undefined && choice.targets.includes(target);
}

/** Vérifie qu'une commande soumise figure dans la liste des commandes disponibles. */
export function isCommandAllowed(
  available: readonly AvailableCommand[],
  command: BattleCommand,
): boolean {
  switch (command.kind) {
    case 'attack': {
      const entry = available.find((c) => c.kind === 'attack');
      return entry !== undefined && targetOk(entry, command.target);
    }
    case 'spell': {
      const entry = available.find((c) => c.kind === 'spell' && c.spellId === command.spellId);
      return entry !== undefined && targetOk(entry, command.target);
    }
    case 'lueur': {
      const entry = available.find((c) => c.kind === 'lueur' && c.lueurId === command.lueurId);
      return entry !== undefined && targetOk(entry, command.target);
    }
    case 'summon': {
      const entry = available.find((c) => c.kind === 'summon' && c.summonId === command.summonId);
      return entry !== undefined && targetOk(entry, command.target);
    }
    case 'item': {
      const entry = available.find((c) => c.kind === 'item' && c.itemId === command.itemId);
      return entry !== undefined && targetOk(entry, command.target);
    }
    case 'defend':
    case 'flee':
      return available.some((c) => c.kind === command.kind);
  }
}
