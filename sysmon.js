require('log-a-log');
console.log("log-a-log setup")

const fs = require('fs');
console.log("system modules loaded")

const P = require('bluebird');
const cogs = require('cogs-sdk');
const async = require('async');
const moment = require('moment');
const durations = require('durations');
console.log("3rd party modules loaded")

const pi = require('./pi');
console.log("local modules loaded")

const CPU_TEMP_PATH = '/sys/class/thermal/thermal_zone0/temp';

const GREEN_PIN = 16;
const RED_PIN = 37;

const red = {
  on: () => pi.on(RED_PIN),
  off: () => pi.off(RED_PIN),
};

const green = {
  on: () => pi.on(GREEN_PIN),
  off: () => pi.off(GREEN_PIN),
};

const readFile = P.promisify(fs.readFile);

function fileExists(fileName) {
  return new P(resolve => fs.exists(fileName, resolve));
}

// Read the CPU's temperature.
function readCpuTemp() {
  return readFile(CPU_TEMP_PATH)
  .then(temperature => ({ cpuTemp: parseFloat(temperature) }));
}

// Schedules the next reading at the beginning
// of the next second.
function scheduleNextReading(data) {
  let next = moment.utc().add(1, 'seconds');
  next.milliseconds(0);
  let now = moment.utc();
  let offset = next.valueOf() - now.valueOf();

  setTimeout(() => takeReading(data), offset);
}

// Take a readings from the system.
const firstReading = true;
const readingDelay = durations.stopwatch();
function takeReading() {
  const timestamp = moment.utc().toISOString();

  if (readingDelay.duration().millis() >= 1500) {
    console.log("Reading too slowly!");
  }

  readingDelay.reset().start();

  red.on()
  .then(() => readCpuTemp())
  .then(({cpuTemp}) => {
    let cpuTempC = parseFloat((cpuTemp / 1000).toFixed(3));
    let cpuTempF = parseFloat(((cpuTemp / 1000) * 1.8 + 32).toFixed(3));

    publishData({
      timestamp,
      cpu_temp_c: cpuTempC,
      cpu_temp_f: cpuTempF,
    });

    console.log(`${cpuTempC} C (${cpuTempF} F)`);

    scheduleNextReading();
  })
  .catch(error => {
    console.error("Error reading sensor data:", error);
  })
  .finally(() => red.off());
}

// Fetch the Cogs config file.
const cogsConfigFile = process.env.COGS_CONFIG_FILE;
let cogsConfig;
function getCogsConfig() {
  if (cogsConfig == null) {
    if (cogsConfigFile == null) {
      console.log("Cogs config file not supplied.");
      cogsConfig = P.resolve({});
    } else {
      cogsConfig = readFile(cogsConfigFile)
      .then(JSON.parse)
      .catch(error => {
        console.error("Could not read cogs config file:", error)
        throw error;
      });
    }
  }

  return cogsConfig;
}

// Fetch the Cogs Pub/Sub client.
let cogsClient;
function getCogsClient() {
  if (cogsClient == null) {
    cogsClient = getCogsConfig()
    .then(cfg => {
      if (cfg.pubsub) {
        let {keys, options} = cfg.pubsub;
        return cogs.pubsub.connect(keys, options);
      } else {
        return P.resolve({publish: () => {}});
      }
    })
    .catch(error => {
      // If we initiate the cogs handle when a config file was supplied,
      // then shutdown the connection.
      logger.error("Terminating due to error creating cogs client:", error);
      return process.exit(1);
    });
  }

  return cogsClient;
}

const publishChannel = 'groot-sysmon-1hz';
function publishData(data) {
  const message = JSON.stringify(data);

  /*
  green.on()
  .then(() => console.log(`Publishing data: ${message}`))
  .finally(() => green.off());
  //*/

  //*
  const watch = durations.stopwatch().start();

  green.on()
  .then(() => getCogsClient())
  .then(client => client.publishWithAck(publishChannel, message))
  .then(() => {
    if (watch.stop().duration().millis() > 100) {
      console.log(`Publish took a long time: ${watch}`);
    }
  })
  .catch(error => console.error('Error publishing data:', error))
  .finally(() => green.off());
  //*/
}

function run() {
  scheduleNextReading();
}

// Handle shutdown signal.
process.on('SIGINT', () => {
  pi.shutdown().then(() => process.exit(0));
});

run();

