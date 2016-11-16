const pi = require('./pi');

let redOn = false;
let greenOn = false;

const red = 37;
const green = 16;

setInterval(() => {
  greenOn ? pi.off(green) : pi.on(green);
  greenOn = !greenOn;
}, 750);

setInterval(() => {
  redOn ? pi.off(red) : pi.on(red);
  redOn = !redOn;
}, 200);

process.on('SIGINT', () => {
  pi.shutdown().then(() => process.exit(0));
});

