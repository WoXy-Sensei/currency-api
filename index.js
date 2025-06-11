import chillout from 'chillout';
import fs from 'fs';

const pattern =/<Cube\s+currency='([A-Z]{3})'\s+rate='([\d.]+)'\/>/g;
const currencyPattern =/<Cube\s+currency='([A-Z]{3})'\s+rate='([\d.]+)'\/>/;

(async () => {
  const apiFolder = fs.readdirSync('./api');
  await chillout.forEach(apiFolder, async (file) => {
    rmFile(file.replace('.json',''));
  });

  console.log('Fetching currencies...');

  const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
  const currenciesText = await response.text();
  
  const currencies = currenciesText.match(pattern);
  
  chillout.repeat(currencies.length, async (from) => {
    const fromCurrency = currencies[from].match(currencyPattern)[1];
    const fromRate = parseFloat(currencies[from].match(currencyPattern)[2]);
    console.log(`1 ${fromCurrency} to ${fromRate} EUR`);
    await createFile({fromCurrency,toCurrency:'EUR',rate:fromRate,lastUpdate:Date.now()},`${fromCurrency}_EUR`);
    await chillout.repeat(currencies.length , async (to) => {
        const toCurrency = currencies[to].match(currencyPattern)[1];
        const toRate = parseFloat(currencies[to].match(currencyPattern)[2]);
        const fromToRate = fromTo(fromRate, toRate);
        console.log(`1 ${fromCurrency} to ${fromToRate} ${toCurrency}`);
        await createFile({fromCurrency,toCurrency,rate:fromToRate,lastUpdate:Date.now()},`${fromCurrency}_${toCurrency}`);
    });
  });

})();

const fromTo = (from , to) =>{
  const rate = to / from;
  return Number(rate.toFixed(7));
}

const createFile = async (data,name) => {
  const json =  JSON.stringify(data, null, 2);
  fs.writeFileSync(`api/${name}.json`, json);
  console.log(`File ${name} created`);
}

const rmFile = async (name) => {
  fs.unlink(`api/${name}.json`, (err) => {
    if (err) throw err;
    console.log('The file has been deleted!');
  });
}