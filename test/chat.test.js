const test = require('node:test');
const assert = require('node:assert');
const { answer, createServer } = require('../server');

function call(server, message) {
  const { port } = server.address();
  return fetch(`http://127.0.0.1:${port}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message })
  });
}
async function withServer(fn) {
  const s = createServer();
  await new Promise(r => s.listen(0, r));
  try { await fn(s); } finally { delete process.env.CAPWEB_SCENARIO; s.close(); }
}

test('répond sur le loyer', () => assert.match(answer('Comment réviser le loyer ?'), /IRL/));
test('répond sur la caution', () => assert.match(answer('rendre la caution'), /1 mois/));
test('question inconnue : message de repli', () => assert.match(answer('xyz'), /Essayez/));
test('API : message valide = 200', () => withServer(async s => {
  const r = await call(s, 'quittance'); assert.strictEqual(r.status, 200);
  assert.match((await r.json()).reply, /quittance/i);
}));
test('API : message vide = 400 clair', () => withServer(async s => {
  const r = await call(s, '   '); assert.strictEqual(r.status, 400);
  assert.strictEqual((await r.json()).error, 'Message vide');
}));
test('API : panne simulée (500) renvoie une erreur propre', () => withServer(async s => {
  process.env.CAPWEB_SCENARIO = '500';
  const r = await call(s, 'bonjour'); assert.strictEqual(r.status, 500);
  assert.ok((await r.json()).error);
}));
