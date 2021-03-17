import o3 from './goss_proto.js';

function getProtos(obj, arr = []) {

  if (obj !== null) {
    arr.push(obj.name);
    getProtos(Object.getPrototypeOf(obj), arr);
  }
  return arr;

}

const names = getProtos(Object.getPrototypeOf(o3)); // [ 'JavaScript', 'LiveScript', 'Mocha' ]
o3.name; //ECMAScript
console.log(names);
