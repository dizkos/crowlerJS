import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';

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
  document
    .querySelectorAll('div.widget-search-result-container.ix div.ui7.i8u')
    .forEach((elem) => {
      arrayFromProducts.push({
        name: elem.querySelector('span.tsBody500Medium').innerHTML,
        priceSale: String(elem.querySelector('.ui8 span.c3118-a1').innerHTML)
          .replace(/\s/g, '')
          .replace(/\₽/g, ''),
        link: elem.querySelector('a').href,
        article: String(elem.querySelector('a').href).match(/[0-9]{10}/)[0],
      });
    });

  if (arrayFromProducts.length > 0 && arrayFromProducts) {
    flag = true;
    await browser.close();
  }

  while (flag == true && pageStartAfterFirstPage <= 10) {
    const browserTwo = await puppeteer.launch({ headless: false });
    const pageTwo = await browserTwo.newPage();

    await pageTwo.goto(pagespaginator.get('page' + pageStartAfterFirstPage));

    // Set screen size
    await pageTwo.setViewport({ width: 1440, height: 800 });

    // await pageTwo.waitForSelector('div.ui7.i8u', {
    //   timeout: 5000,
    // });
    let body2 = await pageTwo.evaluate(() => {
      return document.body.innerHTML;
    });
    if (new JSDOM(body2).window.document.querySelector('div.ui7.i8u')) {
      new JSDOM(body2).window.document
        .querySelectorAll('div.widget-search-result-container.ix div.ui7.i8u')
        .forEach((elem) => {
          arrayFromProducts.push({
            name:
              elem.querySelector('span.tsBody500Medium').innerHTML + 'page2',
            priceSale: String(
              elem.querySelector('.ui8 span.c3118-a1').innerHTML
            )
              .replace(/\s/g, '')
              .replace(/\₽/g, ''),
            link: elem.querySelector('a').href,
            article: String(elem.querySelector('a').href).match(/[0-9]{10}/)[0],
          });
        });
      pageStartAfterFirstPage++;
      await browserTwo.close();
    } else {
      flag = false;
      await browserTwo.close();
    }
  }
  console.log(arrayFromProducts);
  console.log(arrayFromProducts.length);
})();
