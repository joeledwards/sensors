const i2c = require('i2c');

let address = 0x18;
let wire = new i2c(address, {device: '/dev/i2c-1'});

wire.scan((error, data) => {
  if (error) {
    console.error("error:", error);
  } else {
    console.log("data:", data);
  }
});

wire.on('data', data => {
  console.log("data:", data);
});

