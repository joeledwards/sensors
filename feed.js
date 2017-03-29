require('log-a-log');

const cogs = require('cogs-sdk');

const keys = [
  'R-bfbd5da0f7b559d5a21aa1ba4085c2fb-863c85d00e811f877b0fc03131b7463f72ca1e657ae96c6fdaf90f5da0c619a4'
];

cogs.pubsub.connect(keys)
.then(handle => {
  handle.subscribe('rocket-bmp-1s', msg => {
    console.log(msg.message);
  });
})
.catch(console.error);
