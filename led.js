const _ = require('lodash');
const Q = require('q');
const pi = require('rpi-gpio');

const red = 11;
const green = 13;
const blue = 15;

const duration = 1000;
var pin = blue;

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

console.log("Pulsing red...");
pulse(red, 1000)
.then(() => {
  console.log("Pulsing green...");
  return pulse(green, 1000)
})
.then(() => {
  console.log("Pulsing blue...");
  return pulse(blue, 1000)
})
.then(() => {
  pi.destroy(() => {
    console.log("Done.")
    process.exit(0);
  });
})
.catch((error) => {
  die(`Error controlling pin ${pin} for output: ${error}\n${error.stack}`);
});

