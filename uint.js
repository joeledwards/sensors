const uint = require('uint-js');
const UInt = uint.UInt;

function newUint(bits, value) {
  return new UInt({bits, value});
}

function uint8(value) {
  return newUint(8, value);
}

function uint16(value) {
  return newUint(16, value);
}

function uint32(value) {
  return newUint(32, value);
}

function uint64(value) {
  return newUint(64, value);
}

let a = uint64('0x1')
let b = uint64('0x100')
let c = uint64('0x10000')
let d = uint64('0x1000000')
let e = uint64('0x100000000')
let z = uint64('0x1000000000000000')

console.log(`a & b = ${uint.and(a,b)}`);
console.log(`a | b = ${uint.or(a,b)}`);
console.log(`a ^ b = ${uint.xor(a,b)}`);
console.log(`c | d | e = ${uint.or(c, uint.or(d,e))}`);

console.log(`     z = ${z}`);
console.log(`z << 1 = ${uint.rshift(z, a)}`);

let xx = new Buffer([127, 255]);
console.log(`xx.readInt16BE()  = ${xx.readInt16BE(0)}`);
console.log(`xx.readUInt16BE() = ${xx.readUInt16BE(0)}`);
console.log(`xx.toString('hex') = ${xx.toString('hex')}`);

let yy = new Buffer([255, 127]);
console.log(`yy.readInt16BE()  = ${yy.readInt16BE(0)}`);
console.log(`yy.readUInt16BE() = ${yy.readUInt16BE(0)}`);
console.log(`yy.toString('hex') = ${yy.toString('hex')}`);

