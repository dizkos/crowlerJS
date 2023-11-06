import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';

const pagesForCrowler = process.argv[2];
const timeOutMs = process.argv[3];

(async () => {
  const arrayFromProducts = [];
  let flag = false;
  let pageStartAfterFirstPage = 2;

  const pagespaginator = new Map();

  while (pageStartAfterFirstPage < 50) {
    pagespaginator.set(
      'page' + pageStartAfterFirstPage,
      'https://www.ozon.ru/seller/pony-jorgensen-goldblatt-workpro-swiss-tech-1181908/products/?miniapp=seller_1181908&page=' +
        pageStartAfterFirstPage
    );
    pageStartAfterFirstPage++;
  }
  pageStartAfterFirstPage = 2;

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const link =
    'https://www.ozon.ru/seller/pony-jorgensen-goldblatt-workpro-swiss-tech-1181908/products/?miniapp=seller_1181908';
  await page.goto(link);

  // Set screen size
  await page.setViewport({ width: 1440, height: 800 });

  await page.waitForSelector('div.ui7.i8u', { timeout: 5000 });

  let body = await page.evaluate(() => {
    return document.body.innerHTML;
  });

  const { document } = new JSDOM(body).window;
  await document
    .querySelectorAll('div.widget-search-result-container.ix div.ui7.i8u')
    .forEach((elem) => {
      arrayFromProducts.push({
        [String(elem.querySelector('a').href).match(/[0-9]{10}/)[0]]: {
          name: elem.querySelector('span.tsBody500Medium').innerHTML,
          priceSale: Number(
            String(elem.querySelector('.ui8 span.c3118-a1').innerHTML)
              .replace(/\s/g, '')
              .replace(/\₽/g, '')
          ),
          link: elem.querySelector('a').href,
          article: String(elem.querySelector('a').href).match(/[0-9]{10}/)[0],
        },
      });
    });

  if (arrayFromProducts.length > 0 && arrayFromProducts) {
    flag = true;
    await browser.close();
  }

  while (
    flag == true &&
    pageStartAfterFirstPage <= (pagesForCrowler ? pagesForCrowler : 5)
  ) {
    const browserTwo = await puppeteer.launch({
      devtools: false,
      headless: false,
      slowMo: timeOutMs ? timeOutMs : 500,
    });
    const pageTwo = await browserTwo.newPage();

    await pageTwo.goto(pagespaginator.get('page' + pageStartAfterFirstPage), {
      waitUntil: 'networkidle2',
    });

    // Set screen size
    await pageTwo.setViewport({ width: 1440, height: 1000 });
    await pageTwo.evaluate(() => {
      window.scrollTo(0, 400);
    });
    await pageTwo.evaluate(() => {
      window.scrollTo(400, 900);
    });
    await pageTwo.evaluate(() => {
      window.scrollTo(900, 1500);
    });
    await pageTwo.evaluate(() => {
      window.scrollTo(1500, document.body.scrollHeight);
    });

    let body2 = await pageTwo.evaluate(() => {
      return document.body.innerHTML;
    });
    if (new JSDOM(body2).window.document.querySelector('div.ui7.i8u')) {
      new JSDOM(body2).window.document
        .querySelectorAll('div.widget-search-result-container.ix div.ui7.i8u')
        .forEach((elem) => {
          // console.log(
          //   `${pageStartAfterFirstPage} и результат перебора - ${elem}`
          // );
          arrayFromProducts.push({
            [String(elem.querySelector('a').href).match(/[0-9]{10}/)[0]]: {
              name:
                elem.querySelector('span.tsBody500Medium').innerHTML + 'page2',
              priceSale: Number(
                String(elem.querySelector('.ui8 span.c3118-a1').innerHTML)
                  .replace(/\s/g, '')
                  .replace(/\₽/g, '')
              ),
              link: elem.querySelector('a').href,
              article: String(elem.querySelector('a').href).match(
                /[0-9]{10}/
              )[0],
            },
          });
        });

      await browserTwo.close();
      pageStartAfterFirstPage++;
    } else {
      flag = false;
      await browserTwo.close();
    }
  }

  if (arrayFromProducts.length < 60) {
    console.log(
      'Ошибка с парсингом, товаров меньше 60 штук, скорей всего недостаточная задержка. Обратиться к разработчику или попробовать запустить скрипт повторно c с большей задержкой, например node crowler.js 3 1000, где crowler.js - имя или путь до исполняемого файла. 3 - количество страниц для прохода. 1000 - задержка в миллисекундах (1000 мс = 1 сек) '
    );
  } else {
    const finalresiltObject = arrayFromProducts.reduce(
      (finalObject, current) => ({
        ...finalObject,
        ...current,
      })
    );

    fetch('http://holod.grappej5.beget.tech/parserozon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalresiltObject),
    })
      .then((responce) => responce.text())
      .then((data) => {
        console.log(`Успешная отправка на сервер для обработки - ${data}`);
      })
      .catch((error) => {
        console.log(`Ошибка с оправкой на сервер - ${error}`);
      });
  }
})();
