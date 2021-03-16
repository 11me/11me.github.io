const sec = a => a + 1;
const add = (a, b) => (b === 0) ? a : sec(add(a, b - 1));
const mpy = (a, b) => (b === 1) ? a : add(a, mpy(a, b - 1));
const pwr = (a, b) => (b === 0) ? 1 : (b === 1) ? a : mpy(a, pwr(a, b - 1));

//console.log(pwr(2, 13)); //MAX VAL IS 13
//pwr(2, 13);
