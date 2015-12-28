const _ = require('lodash');
const Q = require('q');
const pi = require('./pi');

const red = 11;
const green = 13;
const blue = 15;

const duration = 500;

function die(message) {
  console.error(message);
  pi.shutdown().then(() => process.exit(1));
}

var stop = false;

function cycle(count) {
  if (count > 0 && !stop) {
    pi.pulse(red, duration)
    .then(() => pi.pulse(green, duration))
    .then(() => pi.pulse(blue, duration))
    .then(() => cycle(count - 1))
    .catch((error) => {
      die(`Error controlling pin ${pin} for output: ${error}\n${error.stack}`);
    });
  } else {
    pi.shutdown().then(() => process.exit(0));
  }
}

process.on('SIGINT', () => stop = true);

cycle(100);

