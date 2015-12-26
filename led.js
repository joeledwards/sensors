const _ = require('lodash');
const Q = require('q');
const pi = require('rpi-gpio');

const red = 11;
const green = 13;
const blue = 15;

const duration = 500;

const ON = true;
const OFF = false;

function die(message) {
  console.error(message);
  pi.destroy(() => process.exit(1));
}

function set(pin, direction) {
  var d = Q.defer();

  pi.setup(pin, pi.DIR_OUT, pi.EDGE_NONE, (error) => {
    if (error) {
      d.reject(error);
    } else {
      pi.output(pin, direction, (error) => {
        if (error) {
          d.reject(error);
        } else {
          d.resolve();
        }
      });
    }
  });

  return d.promise;
}

function on(pin) {
  return set(pin, ON);
}

function off(pin) {
  return set(pin, OFF);
}

function pulse(pin, duration) {
  var d = Q.defer();

  on(pin)
  .then(() => {
    setTimeout(() => {
      off(pin)
      .then(() => d.resolve())
      .catch((error) => d.reject(error));
    }, duration);
  })
  .catch((error) => d.reject(error));

  return d.promise;
}

var stop = false;

function cycle(count) {
  if (count > 0 && !stop) {
    pulse(red, duration)
    .then(() => pulse(green, duration))
    .then(() => pulse(blue, duration))
    .then(() => cycle(count - 1))
    .catch((error) => {
      die(`Error controlling pin ${pin} for output: ${error}\n${error.stack}`);
    });
  } else {
    pi.destroy(() => process.exit(0));
  }
}

process.on('SIGINT', () => stop = true);

cycle(5);

