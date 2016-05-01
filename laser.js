const _ = require('lodash');
const Q = require('q');
const pi = require('./pi');

const laser = { pins: [16], label: "laser" };

const duration = 500;

function die(message) {
  console.error(message);
  pi.shutdown().then(() => process.exit(1));
}

function pulse(color, duration) {
  console.log(`Pulsing ${color.label}; pins ${color.pins}`);
  return Q.all(_(color.pins).map((pin) => pi.pulse(pin, duration)).value());
}

var stop = false;

function cycle(count) {
  if (count > 0 && !stop) {
    pulse(laser, duration)
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

