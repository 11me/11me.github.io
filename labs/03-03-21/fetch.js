const values = document.querySelector('#values').children,
  URLs = document.querySelector('#urls').children,
  spanRes = document.querySelector('#result'),
  loader = document.querySelector('#loader');

const headers = {
  'Content-Type': 'application/json'
}


const responses = [];
let isFirstRequest = true;

document
  .querySelector('.btn')
  .addEventListener('click',

    async ({target: t}) => {
      spanRes.textContent = '';
      t.disabled = true;
      loader.style.display = 'inline-block';
      let url;

      for (let i = 0; i < URLs.length; i++) {

        isFirstRequest ? (url = URLs[i].textContent + values[i].textContent)
          : (url = URLs[i].textContent + values[i].textContent + '/' + responses[i - 1]);

        let res = await fetch(url, {headers});

        responses.push((await res.json()).result);

        isFirstRequest = false;

      }
      spanRes.textContent = `Результат: ${responses.toString()}`;
      t.disabled = false;
      loader.style.display = 'none';
    }
  );
