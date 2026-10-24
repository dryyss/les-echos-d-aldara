import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CharacterData, DialogueScene, EventAction } from '../../src/data/types';

const ROOT = join(__dirname, '..', '..');
const DIALOGUES_DIR = join(ROOT, 'data', 'dialogues');
const CHARACTERS_DIR = join(ROOT, 'data', 'characters');

const KNOWN_TYPES = new Set([
  'label',
  'goto',
  'move',
  'moveTo',
  'face',
  'teleport',
  'spawn',
  'despawn',
  'anim',
  'emote',
  'give',
  'take',
  'setFlag',
  'if',
  'startBattle',
  'fade',
  'wait',
  'playSound',
  'playMusic',
  'shake',
  'flash',
  'recruit',
  'heal',
  'quest',
  'title',
  'save',
  'setMapState',
  'openShop',
  'inn',
  'forge',
  'gameOver',
  'credits',
  'end',
]);

const EXPRESSIONS = new Set(['neutre', 'sourire', 'colere', 'triste', 'surpris', 'fatigue']);

/** Longueur maximale d'une réplique : 3 lignes d'environ 40 caractères. */
const MAX_TEXT_LENGTH = 130;

function listJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f));
}

function loadCharacters(): Set<string> {
  const ids = new Set<string>();
  for (const file of listJson(CHARACTERS_DIR)) {
    const list = JSON.parse(readFileSync(file, 'utf8')) as CharacterData[];
    for (const c of list) ids.add(c.id);
  }
  return ids;
}

function checkText(text: string, where: string, errors: string[]): void {
  if (text.includes('—') || text.includes('–')) errors.push(`${where} : tiret cadratin interdit`);
  if (text.includes("'")) errors.push(`${where} : apostrophe droite, utiliser ’`);
  if (text.includes('...')) errors.push(`${where} : utiliser le caractère …`);
  if (text.length > MAX_TEXT_LENGTH) {
    errors.push(`${where} : réplique trop longue (${text.length} > ${MAX_TEXT_LENGTH})`);
  }
}

function collectLabels(actions: EventAction[], labels: Set<string>): void {
  for (const action of actions) {
    if ('type' in action && action.type === 'label') labels.add(action.id);
    if ('choix' in action) {
      for (const c of action.choix) if (Array.isArray(c.suite)) collectLabels(c.suite, labels);
    }
    if ('type' in action && action.type === 'if') {
      collectLabels(action.alors, labels);
      if (action.sinon) collectLabels(action.sinon, labels);
    }
  }
}

function checkActions(
  actions: EventAction[],
  ctx: { file: string; characters: Set<string>; labels: Set<string>; errors: string[] },
  path: string,
): void {
  if (!Array.isArray(actions)) {
    ctx.errors.push(`${ctx.file} ${path} : doit être un tableau`);
    return;
  }
  actions.forEach((action, index) => {
    const where = `${ctx.file} ${path}[${index}]`;
    if (typeof action !== 'object' || action === null) {
      ctx.errors.push(`${where} : action invalide`);
      return;
    }
    if ('perso' in action && 'texte' in action) {
      if (!ctx.characters.has(action.perso)) {
        ctx.errors.push(`${where} : personnage inconnu « ${action.perso} »`);
      }
      if (action.expr !== undefined && !EXPRESSIONS.has(action.expr)) {
        ctx.errors.push(`${where} : expression inconnue « ${action.expr} »`);
      }
      checkText(action.texte, where, ctx.errors);
      return;
    }
    if ('pensee' in action) {
      checkText(action.pensee, where, ctx.errors);
      if (action.perso !== undefined && !ctx.characters.has(action.perso)) {
        ctx.errors.push(`${where} : personnage inconnu « ${action.perso} »`);
      }
      return;
    }
    if ('ecran' in action) {
      checkText(action.ecran, where, ctx.errors);
      return;
    }
    if ('choix' in action) {
      if (!Array.isArray(action.choix) || action.choix.length < 1) {
        ctx.errors.push(`${where} : choix vide`);
        return;
      }
      action.choix.forEach((c, i) => {
        checkText(c.texte, `${where}.choix[${i}]`, ctx.errors);
        if (typeof c.suite === 'string') {
          if (!ctx.labels.has(c.suite)) {
            ctx.errors.push(`${where}.choix[${i}] : étiquette inconnue « ${c.suite} »`);
          }
        } else {
          checkActions(c.suite, ctx, `${path}[${index}].choix[${i}].suite`);
        }
      });
      return;
    }
    if ('type' in action) {
      if (!KNOWN_TYPES.has(action.type)) {
        ctx.errors.push(`${where} : type inconnu « ${action.type} »`);
        return;
      }
      if (action.type === 'goto' && !ctx.labels.has(action.label)) {
        ctx.errors.push(`${where} : étiquette inconnue « ${action.label} »`);
      }
      if (action.type === 'if') {
        checkActions(action.alors, ctx, `${path}[${index}].alors`);
        if (action.sinon) checkActions(action.sinon, ctx, `${path}[${index}].sinon`);
      }
      if (action.type === 'title') checkText(action.texte, where, ctx.errors);
      if (action.type === 'startBattle' && typeof action.groupe !== 'string') {
        ctx.errors.push(`${where} : startBattle sans groupe`);
      }
      return;
    }
    ctx.errors.push(`${where} : forme d'action non reconnue (${Object.keys(action).join(', ')})`);
  });
}

describe('data/dialogues', () => {
  const files = listJson(DIALOGUES_DIR);
  const characters = loadCharacters();

  it('possède au moins un personnage défini quand des scènes existent', () => {
    if (files.length > 0) expect(characters.size).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [f.slice(DIALOGUES_DIR.length + 1), f]))(
    '%s est une scène valide',
    (name, file) => {
      const scene = JSON.parse(readFileSync(file, 'utf8')) as DialogueScene;
      const errors: string[] = [];
      if (scene.id !== name.replace(/\.json$/, '')) {
        errors.push(`${name} : id « ${scene.id} » différent du nom de fichier`);
      }
      const labels = new Set<string>();
      collectLabels(scene.lignes ?? [], labels);
      checkActions(scene.lignes, { file: name, characters, labels, errors }, 'lignes');
      expect(errors).toEqual([]);
    },
  );
});
