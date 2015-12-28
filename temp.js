const _ = require('lodash');
const Q = require('q');
const pi = require('./pi');

const power = 16;
const signal = 18;

const duration = 500;

function die(message) {
  console.error(message);
  pi.shutdown().then(() => process.exit(1));
}

var stop = false;

function measure() {
  if (!stop) {
    pi.get(signal)
    .then((value) => {
      console.log(`Value is: ${value}`);
    })
    .catch((error) => {
      die(`Error controlling pin ${pin} for output: ${error}\n${error.stack}`);
    });
  } else {
    pi.shutdown().then(() => process.exit(0));
  }
}

process.on('SIGINT', () => stop = true);

pi.on(power)
.then(() => measure())
.catch((error) => die(`Error enabling power pin: ${error}\n${error.stack}`));

