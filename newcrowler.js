import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import * as chromeLauncher from 'chrome-launcher';
import axios from 'axios';

const arrayFromProducts = [];

const pagesForCrowler = process.argv[2];

console.log(process.argv);
const getProdFirstPage = async () => {
  // По умолчанию

  let pages = 3;

  if (pagesForCrowler) {
    pages = pagesForCrowler;
  }

  const browser = await puppeteer.launch({
    headless: false,
  });

  for (let i = 1; i <= pages; i++) {
    const page = await browser.newPage();

    console.log(i);

    //Перед запуском берем свежие coockies с ozon при помощи расширения EditThisCookie
    const cookies = [];

    await page.setCookie(...cookies);

    let link;
    if (i === 1) {
      link =
        'https://www.ozon.ru/seller/pony-jorgensen-goldblatt-workpro-swiss-tech-1181908/products/?miniapp=seller_1181908';
    } else {
      link =
        'https://www.ozon.ru/seller/pony-jorgensen-goldblatt-workpro-swiss-tech-1181908/products/?miniapp=seller_1181908&page=' +
        i;
    }

    await page.goto(link);

    // Set screen size
    await page.setViewport({ width: 1440, height: 800 });

    // const resultCheck = await page.waitForSelector('button.rb', {
    //   timeout: 3000,
    // });

    // if (resultCheck) {
    //   await page.click('button.rb');
    //   await page.waitForNavigation();
    //   await page.reload();
    // }

    await page.waitForSelector(
      'div.widget-search-result-container.ix9 div.i5v.i6v.tile-root',
      { timeout: 5000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let body = await page.evaluate(() => {
      return document.body.innerHTML;
    });

    const { document } = new JSDOM(body).window;

    await document
      .querySelectorAll(
        'div.widget-search-result-container.ix9  div.i5v.i6v.tile-root'
      )
      .forEach((elem) =>
        arrayFromProducts.push({
          [String(elem.querySelector('a').href).match(/[0-9]{10}/)[0]]: {
            name: elem.querySelector('span.tsBody500Medium').innerHTML,
            priceSale: Number(
              String(
                elem.querySelector('div.c3128-a0 span.tsHeadline500Medium')
                  .innerHTML
              )
                .replace(/\s/g, '')
                .replace(/\₽/g, '')
            ),
            link: elem.querySelector('a').href,
            article: String(elem.querySelector('a').href).match(/[0-9]{10}/)[0],
          },
        })
      );

    await page.close();
  }

  await browser.close();

  return arrayFromProducts;
};

getProdFirstPage()
  .then((resultArr) => {
    const finalresiltObject = arrayFromProducts.reduce(
      (finalObject, current) => ({
        ...finalObject,
        ...current,
      })
    );
    console.log(JSON.stringify(resultArr));
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
  })
  .catch(() => console.log('Случилась ошибка'));
