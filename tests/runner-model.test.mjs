import test from 'node:test';
import assert from 'node:assert/strict';
import { RunnerModel, GROUND, overlaps } from '../src/game/runner-model.ts';

function running(width = 800) {
  const model = new RunnerModel(width, () => .2);
  model.start();
  model.nextObstacle = model.nextCoin = Infinity;
  return model;
}

test('the same time produces the same distance and score at 30, 60 and 120 Hz', () => {
  const results = [30, 60, 120].map(fps => {
    const model = running();
    for (let i = 0; i < fps * 10; i++) model.update(1 / fps);
    return model;
  });
  for (const model of results) {
    assert.ok(Math.abs(model.distance - results[0].distance) < .001);
    assert.equal(model.score, results[0].score);
  }
});

test('jump has sufficient clearance, lands and does not permit midair jumping', () => {
  const model = running(); model.jump(); model.update(.1);
  assert.ok(model.y < GROUND - 45);
  const velocity = model.velocityY; model.jump(); assert.equal(model.velocityY, velocity);
  for (let i = 0; i < 120; i++) model.update(1 / 120);
  assert.equal(model.y, GROUND);
});

test('crouching avoids a bird that collides with a standing player', () => {
  const standing = running(); const crouching = running();
  for (const model of [standing, crouching]) model.obstacles = [{ kind: 'bird', x: 80, y: GROUND - 55, width: 38, height: 25 }];
  crouching.duck(true);
  standing.update(1 / 60); crouching.update(1 / 60);
  assert.equal(standing.state, 'over'); assert.equal(crouching.state, 'running');
});

test('collision ends the run; a coin can only be collected once', () => {
  const model = running();
  model.pickups = [{ x: 90, y: GROUND - 25, phase: 0 }];
  model.update(1 / 60); model.update(1 / 60);
  assert.equal(model.coins, 1); assert.equal(model.pickups.length, 0);
  model.obstacles = [{ kind: 'rock', x: 85, y: GROUND - 24, width: 28, height: 24 }];
  model.update(1 / 60); assert.equal(model.state, 'over');
});

test('pause freezes simulation, resize keeps reaction distance proportional, restart clears state', () => {
  const model = running(); model.update(.1); model.pause();
  const elapsed = model.elapsed; model.update(1); assert.equal(model.elapsed, elapsed);
  model.obstacles = [{ kind:'fence', x:700, y:GROUND-43, width:46, height:43 }];
  const timeBefore = (700-model.playerX)/model.speed;
  model.resize(440);
  const timeAfter = (model.obstacles[0].x-model.playerX)/model.speed;
  assert.ok(Math.abs(timeAfter-timeBefore)<.001);
  model.resume(); assert.equal(model.state,'running');
  model.coins=7; model.start(); assert.equal(model.coins,0); assert.equal(model.elapsed,0); assert.equal(model.obstacles.length,0);
});

test('large frame stalls are bounded and box edges are not false collisions', () => {
  const model = running(); model.update(10); assert.ok(model.elapsed <= .101);
  assert.equal(overlaps({x:0,y:0,width:10,height:10},{x:10,y:0,width:10,height:10}),false);
});

test('a scale refresh at the same dimensions does not pause a running game', () => {
  const model = running(); model.resize(800); assert.equal(model.state, 'running');
});
