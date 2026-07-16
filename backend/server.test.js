const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');
const { createApp, startServer } = require('./server');

test('startServer falls back when the requested port is occupied', async () => {
  const blocker = net.createServer();

  await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
  const address = blocker.address();

  const server = await startServer(createApp(), address.port);
  const actualPort = server.address().port;

  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  await new Promise((resolve, reject) => {
    blocker.close((err) => (err ? reject(err) : resolve()));
  });

  assert.notEqual(actualPort, address.port);
});
