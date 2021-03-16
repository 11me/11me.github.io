let n1 = document.querySelector('#n1'),
  n2 = document.querySelector('#n2'),
  res = document.querySelector('#result');

document.querySelector('#btn')
  .addEventListener('click', function () {
    res.value = n1.value ** n2.value;
  });
