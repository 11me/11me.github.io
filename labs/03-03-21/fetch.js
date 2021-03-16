const values = document.querySelector('#values').children,
  URLs = document.querySelector('#urls').children;

const headers = {
  'Content-Type': 'application/json'
}

const responses = [];
let isFirstRequest = true;

document
  .querySelector('button')
  .addEventListener('click',

    async ({target: t}) => {
      t.disabled = true;
      t.classList.toggle('rotate');
      let url;

      for (let i = 0; i < URLs.length; i++) {

        isFirstRequest ? (url = URLs[i].textContent + values[i].textContent)
          : (url = URLs[i].textContent + values[i].textContent + '/' + responses[i - 1]);

        let res = await fetch(url, {headers});

        responses.push((await res.json()).result);

        isFirstRequest = false;

      }
      t.textContent = `Результат: ${responses.toString()}`;
      t.classList.toggle('rotate');
    }
  );
