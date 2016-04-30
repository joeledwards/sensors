const _ = require('lodash');
const Q = require('q');
const pi = require('./pi');

var stop = false;
var pin = 16;

function die(message) {
  console.error(message);
  pi.shutdown().then(() => process.exit(1));
}

function read() {
  pi.get(pin)
  .then((value) => {
    console.log(`Value from pin ${pin} is : ${value}`)
    if (!stop) {
      setTimeout(() => read(), 100);
    } else {
      pi.shutdown().then(() => process.exit(0));
    }
  })
  .catch((error) => die(`Error reading pin ${pin}: ${error}\n${error.stack}`))
}

process.on('SIGINT', () => stop = true);

read();

