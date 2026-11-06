import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Exercise the actual procedural pose generator, without a browser renderer.
const source = fs.readFileSync('src/creatures/crab/pose.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { computePose, makePose } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const data = fs.readFileSync('src/creatures/crab/data.ts', 'utf8');
const animations = [...data.matchAll(/id: "(idle|walk|sideways|claws|articulation|defensive|swim|manual)"/g)].map(m => m[1]);
assert.ok(animations.length >= 8);
function finite(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finite);
}
for (const animation of new Set(animations)) {
  for (const time of [0, 0.5, 1.2, 3, 7.2, 1000]) {
    const pose = computePose(animation, time, { leg: 7, yaw: 0.6, lift: 1.1, knee: 1, ankle: 0.9, claw: 0.9 }, makePose());
    assert.equal(pose.legs.length, 8);
    assert.equal(pose.claws.length, 2);
    finite(pose);
  }
}
const html = fs.readFileSync('dist/index.html', 'utf8');
assert.ok(!html.includes('fonts.googleapis.com'));
assert.ok(!html.includes('/src/main.tsx'));
assert.ok(html.includes('/assets/'));
assert.equal(JSON.parse(fs.readFileSync('vercel.json', 'utf8')).outputDirectory, 'dist');
console.log('Validation passed: eight animation modes, finite poses, production entry, and deployment output.');
