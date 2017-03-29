console.log("Loading log-a-log module ...");
require('log-a-log');

console.log("Loading cogs-sdk module ...");
const cogs = require('cogs-sdk');

const channel = 'rocket-bmp-1s';
const keys = [
  'R-bfbd5da0f7b559d5a21aa1ba4085c2fb-863c85d00e811f877b0fc03131b7463f72ca1e657ae96c6fdaf90f5da0c619a4'
];

console.log("Connecting to Cogs pub/sub ...");

cogs.pubsub.connect(keys)
.then(handle => {
  console.log(`Connected. Subscribing to channel '${channel}' ...`);

  return handle.subscribe(channel, msg => {
    console.log(msg.message);
  });
})
.then(() => console.log(`Subscribed to channel '${channel}'.`))
.catch(error => {
  console.error("Error connecting to Cogs pub/sub", error);
});
