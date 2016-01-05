const _ = require('lodash');
const Q = require('q');
const pi = require('./pi');

const red = { pins: [11], label: "red" };
const green = { pins: [13], label: "green" };
const blue = { pins: [15], label: "blue" };
const yellow = { pins: [11, 13], label: "yellow" };
const cyan = { pins: [13, 15], label: "cyan" };
const magenta = { pins: [11, 15], label: "magenta" };
const white = { pins: [11, 13, 15], label: "white" };

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
    pulse(red, duration)
    .then(() => pulse(green, duration))
    .then(() => pulse(blue, duration))
    .then(() => pulse(yellow, duration))
    .then(() => pulse(cyan, duration))
    .then(() => pulse(magenta, duration))
    .then(() => pulse(white, duration))
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

