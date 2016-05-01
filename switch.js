require('log-a-log');

const _ = require('lodash');
const Q = require('q');
const pi = require('./pi');
const moment = require('moment');
const durations = require('durations');

var stop = false;
var pin = 22;

function read() {
  pi.get(pin)
  .then((value) => {
    console.log(`Value from pin ${pin} is : ${value}`);
  })
  .catch((error) => {
    console.error(`Error reading pin ${pin}: ${error}\n${error.stack}`);
  })
  .finally(() => {
    if (!stop) {
      setTimeout(() => read(), 100);
    } else {
      pi.shutdown().then(() => process.exit(0));
    }
  })
}

process.on('SIGINT', () => stop = true);

read();

