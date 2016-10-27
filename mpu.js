const i2c = require('i2c-bus');
const MPU6050 = require('i2c-mpu6050');

const address = 0x68;

let wire = i2c.openSync(1);
let sensor = new MPU6050(wire, address);

var data = sensor.readSync();
console.log(data);

