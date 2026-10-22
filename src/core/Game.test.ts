import { describe, expect, it } from 'vitest';
import { ARENA, PLAYER, ROUND } from '@/config/gameplayConstants';
import { Game } from '@/core/Game';
import { FakeAudioPlayer, FakeInput, FakeRenderer } from '@/framework/testing/fakes';
import type { ModelId } from '@/models';

function setup() {
  const renderer = new FakeRenderer<ModelId>();
  const input = new FakeInput();
  const audio = new FakeAudioPlayer();
  const game = new Game(renderer, input, audio);
  return { renderer, input, audio, game };
}

function playerPosition(renderer: FakeRenderer<ModelId>) {
  return [...renderer.positions.values()][1];
}

describe('Orbital Survivor', () => {
  it('starts on a pinch and fires a synthesized shot on later pinches', () => {
    const { input, audio, game } = setup();
    expect(game.getStatus()).toBe('ready');
    input.fire('pinchTap', undefined);
    expect(game.getStatus()).toBe('playing');
    input.fire('pinchTap', undefined);
    expect(audio.count('select')).toBe(1);
    expect(audio.count('laser')).toBe(1);
  });

  it('moves by D-pad steps and clamps the ship to the arena', () => {
    const { renderer, input } = setup();
    input.fire('pinchTap', undefined);
    for (let i = 0; i < 20; i++) input.fire('dpadSwipe', 'right');
    expect(playerPosition(renderer).x).toBe(ARENA.playerBound);
    input.fire('dpadSwipe', 'down');
    expect(playerPosition(renderer).y).toBe(-PLAYER.stepSize);
  });

  it('fires in the last D-pad direction and removes a drone on a hit', () => {
    const { input, game } = setup();
    input.fire('pinchTap', undefined);
    input.fire('dpadSwipe', 'left');
    game.update(ARENA.spawnInterval);
    input.fire('pinchTap', undefined);
    game.update(0.1);
    game.update(0.1);
    game.update(0.1);
    expect(game.getScore()).toBe(1);
  });

  it('ends a run when a drone reaches the ship', () => {
    const { input, game } = setup();
    input.fire('pinchTap', undefined);
    game.update(ARENA.spawnInterval);
    game.update(2);
    game.update(1.5);
    expect(game.getStatus()).toBe('lost');
  });

  it('wins after the survival timer expires', () => {
    const { input, game } = setup();
    input.fire('pinchTap', undefined);
    game.update(ROUND.duration);
    expect(game.getStatus()).toBe('won');
  });
});
