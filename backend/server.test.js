const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('net');
const { createApp, startServer } = require('./server');

test('startServer falls back to the next available port when the requested port is occupied', async () => {
  const blocker = net.createServer();

  await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
  const address = blocker.address();
  const nextPort = address.port + 1;
  const nextBlocker = net.createServer();

  await new Promise((resolve, reject) => {
    nextBlocker.listen(nextPort, '127.0.0.1', resolve);
  });

  const server = await startServer(createApp(), address.port);
  const actualPort = server.address().port;

  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  await new Promise((resolve, reject) => {
    blocker.close((err) => (err ? reject(err) : resolve()));
  });

  await new Promise((resolve, reject) => {
    nextBlocker.close((err) => (err ? reject(err) : resolve()));
  });

  assert.equal(actualPort, nextPort + 1);
});
