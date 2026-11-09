const assert = require('node:assert/strict');
const test = require('node:test');

const { checkMcpService } = require('../dist/health.js');

test('accepts the Inttegro protected-resource metadata', async () => {
  const health = await checkMcpService(async () => new Response(JSON.stringify({
    resource: 'https://mcp.inttegro.com/',
    resource_name: 'Inttegro',
    authorization_servers: ['https://clerk.inttegro.com']
  }), {
    headers: { 'content-type': 'application/json' },
    status: 200
  }));

  assert.deepEqual(health, {
    authorizationServer: 'https://clerk.inttegro.com',
    resource: 'https://mcp.inttegro.com/',
    resourceName: 'Inttegro'
  });
});

test('rejects metadata for another protected resource', async () => {
  await assert.rejects(
    checkMcpService(async () => new Response(JSON.stringify({
      resource: 'https://example.com/',
      authorization_servers: ['https://clerk.inttegro.com']
    }), { status: 200 })),
    /unexpected protected resource/
  );
});

test('reports an unavailable metadata endpoint', async () => {
  await assert.rejects(
    checkMcpService(async () => new Response('', { status: 503 })),
    /HTTP 503/
  );
});
