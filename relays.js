const pi = require('./pi');

const pins = [
  37, 35, 33, 31, 40, 38, 36, 32
].map(pin => ({
  id: pin,
  on: false,
}));

function togglePin(pin) {
  const {id, on} = pin;
  console.log(`Turning pin ${id} ${on ? 'off' : 'on'}`);
  on ? pi.off(id) : pi.on(id);
  pin.on = !on;
}

let index = 0;
setInterval(() => {
  togglePin(pins[index]);

  index++;
  if (index >= pins.length)
    index = 0;
}, 250);

process.on('SIGINT', () => {
  pi.shutdown().then(() => process.exit(0));
});

