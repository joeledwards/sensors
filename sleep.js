const durations = require('durations');

const sleepMs = 5;

durations.timeAsync(next => {
  setTimeout(() => next(), sleepMs);
}, duration => {
  console.log(`Actual duration of ${sleepMs} ms setTimeout was ${duration}`);
});


