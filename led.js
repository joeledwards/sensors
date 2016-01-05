const _ = require('lodash');
const Q = require('q');
const pi = require('./pi');

const red = { number: 11, label: "red" };
const green = { number: 13, label: "green" };
const blue = { number: 15, label: "blue" };

const duration = 500;

function die(message) {
  console.error(message);
  pi.shutdown().then(() => process.exit(1));
}

function pulse(pins, duration) {
  console.log(`Pin(s) ${_(pins).map((pin) => pin.number).value()}`);
  return Q.all(_(pins).map((pin) => pi.pulse(pin.number, duration)));
}

var stop = false;

function cycle(count) {
  if (count > 0 && !stop) {
    pulse(red, duration)
    .then(() => pulse([green], duration))
    .then(() => pulse([blue], duration))
    .then(() => pulse([red, green], duration))
    .then(() => pulse([green, blue], duration))
    .then(() => pulse([blue, red], duration))
    .then(() => pulse([red, green, blue], duration))
    .then(() => cycle(count - 1))
    .catch((error) => {
      die(`Error controlling pin ${pin.number} for output: ${error}\n${error.stack}`);
    });
  } else {
    pi.shutdown().then(() => process.exit(0));
  }
}

process.on('SIGINT', () => stop = true);

cycle(100);

