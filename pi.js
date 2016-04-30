const _ = require('lodash');
const Q = require('q');
const gpio = require('rpi-gpio');

/* List of pins

+3.3v             1 --  2  +5v
GPIO 2 / SDA1     3 --  4  +5v
GPIO 3 / SCL1     5 --  6  GND
GPIO 4            7 --  8  GPIO 14 / TXD0
GND               9 -- 10  GPIO 15 / RXD0
GPIO 17          11 -- 12  GPIO 18
GPIO 27          13 -- 14  GND
GPIO 22          15 -- 16  GPIO 23
+3.3v            17 -- 18  GPIO 24
GPIO 10 / MOSI   19 -- 20  GND
GPIO 9  / MISO   21 -- 22  GPIO 25
GPIO 11 / SCLK   23 -- 24  GPIO 8  / CE0#
GND              25 -- 26  GPIO 7  / CE1#
GPIO 0  / ID_SD  27 -- 28  GPIO 1  / ID_SC
GPIO 5           29 -- 30  GND
GPIO 6           31 -- 32  GPIO 12
GPIO 13          33 -- 34  GND
GPIO 19 / MISO   35 -- 36  GPIO 16 / CE2#
GPIO 26          37 -- 38  GPIO 20 / MOSI
GND              39 -- 40  GPIO 21 / SCLK

*/
const red = 11;
const green = 13;
const blue = 15;

const ON = true;
const OFF = false;

function get(pin) {
  var d = Q.defer();

  gpio.setup(pin, gpio.DIR_IN, gpio.EDGE_FALLING, (error) => {
    if (error) {
      d.reject(error);
    } else {
      gpio.input(pin, (error, value) => {
        if (error) {
          d.reject(error);
        } else {
          d.resolve(value);
        }
      });
    }
  });

  return d.promise;
}

function set(pin, direction) {
  var d = Q.defer();

  gpio.setup(pin, gpio.DIR_OUT, gpio.EDGE_NONE, (error) => {
    if (error) {
      d.reject(error);
    } else {
      gpio.output(pin, direction, (error) => {
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

function shutdown() {
  var d = Q.defer();

  gpio.destroy(() => d.resolve());

  return d.promise;
}

module.exports = {
  get: get,
  off: off,
  on: on,
  pulse: pulse,
  shutdown: shutdown
};

