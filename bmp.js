const P = require('bluebird');
const i2c = require('i2c');
const async = require('async');
const durations = require('durations');

let address = 0x77;
let wire = new i2c(address, {device: '/dev/i2c-1'});

function short(msb, lsb) {
  return new Buffer([msb, lsb]).readInt16BE(0);
}

function ushort(msb, lsb) {
  return new Buffer([msb, lsb]).readUInt16BE(0);
}

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

        let ac1 = short(ac1h, ac1l); 
        let ac2 = short(ac2h, ac2l);
        let ac3 = short(ac3h, ac3l);
        let ac4 = ushort(ac4h, ac4l);
        let ac5 = ushort(ac5h, ac5l);
        let ac6 = ushort(ac6h, ac6l);
        let b1 = short(b1h, b1l);
        let b2 = short(b2h, b2l);
        let mb = short(mbh, mbl);
        let mc = short(mch, mcl);
        let md = short(mdh, mdl);

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
              let temp = msb << 8 | lsb;
              resolve(temp);
            }
          });
        }, 5);
      }
    });
  });
}

// Read the raw (unadjusted) pressure data from the sensor.
function getRawPressure(oss) {
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
              let pressure = (msb << 16 | lsb << 8 | xlsb) >> (8 - oss);
              resolve(pressure);
            }
          });
        }, 5);
      }
    });
  });
}

const twoToTheFourth = Math.pow(2, 4);
const twoToTheEigth = Math.pow(2, 8);
const twoToTheEleventh = Math.pow(2, 11);
const twoToTheTwelfth = Math.pow(2, 12);
const twoToTheThirteenth = Math.pow(2, 13);
const twoToTheFifteenth = Math.pow(2, 15);
const twoToTheSixteenth = Math.pow(2, 16);

// Perform computation of real temperature based on metadata and pressure.
function computeRealValues({metadata, oss, temp, pressure}) {
  let {
    ac1, ac2, ac3, ac4, ac5, ac6,
    b1, b2,
    mb, mc, md
  } = metadata;

  let x1 = Math.floor((temp - ac6) * ac5 / twoToTheFifteenth);
  //console.log(`x1 = ${x1}`);
  let x2 = Math.floor(mc * twoToTheEleventh / (x1 + md));
  //console.log(`x2 = ${x2}`);
  let b5 = x1 + x2;
  //console.log(`b5 = ${b5}`);
  let realTemp = Math.floor((b5 + 8) / 16);
  //console.log(`realTemp = ${realTemp}`);

  let b6 = b5 - 4000;
  //console.log(`b6 = ${b6}`);
  x1 = Math.floor((b2 * ((b6 * b6) / twoToTheTwelfth)) / twoToTheEleventh);
  //console.log(`x1 = ${x1}`);
  x2 = Math.floor((ac2 * b6) / twoToTheEleventh);
  //console.log(`x2 = ${x2}`);
  let x3 = x1 + x2;
  //console.log(`x3 = ${x3}`);
  let b3 = Math.floor((((ac1 * 4 + x3) << oss) + 2) / 4);
  //console.log(`b3 = ${b3}`);
  x1 = Math.floor(ac3 * b6 / twoToTheThirteenth);
  //console.log(`x1 = ${x1}`);
  x2 = Math.floor((b1 * ((b6 * b6) >> 12)) / twoToTheSixteenth);
  //console.log(`x2 = ${x2}`);
  x3 = ((x1 + x2) + 2) >> 2;
  //console.log(`x3 = ${x3}`);
  b4 = Math.floor((ac4 * (x3 + 32768)) / twoToTheFifteenth);
  //console.log(`b4 = ${b4}`);
  b7 = (pressure - b3) * (50000 >> oss);
  //console.log(`b7 = ${b7}`);

  let p;

  if (b7 < 0x80000000) {
    p = Math.floor((b7 * 2) / b4);
  } else {
    p = Math.floor((b7 / b4) * 2);
  }

  //console.log(`p = ${p}`);

  x1 = Math.floor((p / 256) * (p / 256));
  //console.log(`x1 = ${x1}`);
  x1 = (x1 * 3038) >> 16;
  //console.log(`x1 = ${x1}`);
  x2 = (-7357 * p) >> 16;
  //console.log(`x2 = ${x2}`);

  realPressure = Math.floor(p + (x1 + x2 + 3791) / 16);
  //console.log(`realPressure = ${realPressure}`);

  return {realTemp, realPressure};
}

// Perform computation of real pressure based on metadata and temperature.
function computeRealPressure({metadata, pressure, temp}) {
}

// Take a reading from the sensor module.
function takeReading({metadata, oss}) {
  getRawTemperature(oss)
  .then(temp => {
    return getRawPressure(oss)
    .then(pressure => {
      return {metadata, oss, temp, pressure};
    });
  })
  .then(data => {
    let {metadata, oss, temp, pressure} = data;
    let {realTemp, realPressure} = computeRealValues(data);

    let tempC = (realTemp / 10).toFixed(1);
    let pressureKpa = (realPressure / 1000).toFixed(3);

    console.log(`  adjusted temperature = ${tempC} C`);
    console.log(`     adjusted pressure = ${pressureKpa} kPa`);

    setTimeout(() => takeReading({metadata, oss}), 1000);
  })
  .catch(error => {
    console.error("Error reading sensor data:", error);
  });
}

function run() {
  // Read the metadata, then start sampling.
  let oss = 0;
  console.log(`oss is ${oss}`);

  readMetadata()
  .then(metadata => takeReading({metadata, oss}))
  .catch(error => console.error("Error:", error));
}

function test() {
  let metadata = {
    ac1: 408,
    ac2: -72,
    ac3: -14383,
    ac4: 32741,
    ac5: 32757,
    ac6: 23153,
    b1: 6190,
    b2: 4,
    mb: -32767,
    mc: -8711,
    md: 2868,
  };

  let oss = 0;
  let temp = 27898;
  let pressure = 23843;

  let data = {metadata, oss, temp, pressure};
  let {realTemp, realPressure} = computeRealValues(data);

  let tempC = (realTemp / 10).toFixed(1);
  let pressureKpa = (realPressure / 1000).toFixed(3);

  console.log(`  adjusted temperature = ${tempC} C`);
  console.log(`     adjusted pressure = ${pressureKpa} kPa`);
}

run();

