const P = require('bluebird');
const i2c = require('i2c');
const async = require('async');
const durations = require('durations');

let address = 0x77;
let wire = new i2c(address, {device: '/dev/i2c-1'});

// Read the metadata from registers 0xAA - 0xBF
function readMetadata () {
  return new P((resolve, reject) => {
    wire.readBytes(0xAA, 22, function (error, data) {
      if (error) {
        console.error("Error reading metadata:", error);
        reject(error);
      } else {
        let [
          ac1h, ac1l,
          ac2h, ac2l,
          ac3h, ac3l,
          ac4h, ac4l,
          ac5h, ac5l,
          ac6h, ac6l,
          b1h, b1l,
          b2h, b2l,
          mbh, mbl,
          mch, mcl,
          mdh, mdl,
        ] = data;

        let ac1 = ac1h << 8 || ac1l;
        let ac2 = ac2h << 8 || ac2l;
        let ac3 = ac3h << 8 || ac3l;
        let ac4 = ac4h << 8 || ac4l;
        let ac5 = ac5h << 8 || ac5l;
        let ac6 = ac6h << 8 || ac6l;
        let b1 = b1h << 8 || b1l;
        let b2 = b2h << 8 || b2l;
        let mb = mbh << 8 || mbl;
        let mc = mch << 8 || mcl;
        let md = mdh << 8 || mdl;

        console.log("Metadata:", data);
        console.log(`  ac1 : ${ac1}`);
        console.log(`  ac2 : ${ac2}`);
        console.log(`  ac3 : ${ac3}`);
        console.log(`  ac4 : ${ac4}`);
        console.log(`  ac5 : ${ac5}`);
        console.log(`  ac6 : ${ac6}`);
        console.log(`  b1 : ${b1}`);
        console.log(`  b2 : ${b2}`);
        console.log(`  mb : ${mb}`);
        console.log(`  mc : ${mc}`);
        console.log(`  md : ${md}`);

        resolve({
          ac1, ac2, ac3, ac4, ac5, ac6,
          b1, b2,
          mb, mc, md,
        });
      }
    });
  });
}

// Read the raw (unadjusted) temperature data from the sensor.
function getRawTemperature() {
  return new P((resolve, reject) => {
    wire.writeBytes(0xF4, [0x2E], error => {
      if (error) {
        reject(error);
      } else {
        let watch = durations.stopwatch().start();

        setTimeout(() => {
          watch.stop();
          if (watch.duration().micros() < 4500) {
            console.log(`Reading too soon (${watch})!`);
          }

          wire.readBytes(0xF6, 2, (error, data) => {
            if (error) {
              reject(error);
            } else {
              let [msb, lsb] = data;
              let temp = msb << 8 || lsb;
              resolve(temp);
            }
          });
        }, 5);
      }
    });
  });
}

// Read the raw (unadjusted) pressure data from the sensor.
function getRawPressure() {
  let oss = 0;

  return new P((resolve, reject) => {
    let cmd = 0x34 + (oss << 6);

    wire.writeBytes(0xF4, [cmd], error => {
      if (error) {
        reject(error);
      } else {
        let watch = durations.stopwatch().start();

        setTimeout(() => {
          watch.stop();

          if (watch.duration().micros() < 4500) {
            console.log(`Reading too soon (${watch})!`);
          }

          wire.readBytes(0xF6, 3, (error, data) => {
            if (error) {
              reject(error);
            } else {
              let [msb, lsb, xlsb] = data;
              let pressure = (msb << 16 || lsb << 8 || xlsb) >> (8 - oss);
              resolve(pressure);
            }
          });
        }, 5);
      }
    });
  });
}

// Perform computation of real temperature based on metadata and pressure.
function computeRealTemperature({temp, pressure}) {
}

// Perform computation of real pressure based on metadata and temperature.
function computeRealPressure({pressure, temp}) {
}

// Take a reading from the sensor module.
function takeReading(metadata) {
  getRawTemperature()
  .then(temp => {
    return getRawPressure()
    .then(pressure => {
      return {temp, pressure};
    });
  })
  .then(({temp, pressure}) => {
    console.log("Raw values:");
    console.log(`  temperature = ${temp}`);
    console.log(`     pressure = ${pressure}`);

    setTimeout(takeReading, 1000);
  })
  .catch(error => {
    console.error("Error reading sensor data:", error);
  });
}

// Read the metadata, then start sampling.
readMetadata()
.then(metadata => takeReading(metadata))
.catch(error => console.error("Error:", error));

