const { formatter } = require('../transformBiomeJSApi.cjs');

async function extract() {
  const rootDir = process.cwd();
  console.log('extract.js run', rootDir);
  const code = `
  let a = '1' + '2'+2
  let c = '2' + a
  let ac = 2 + a
  let b = a + c + '1'
  const badStringConcat = "Hello, " + name + "!"; 
  const badMixed = "Hello, " + "Mr. " + name +' '+ myFunction();
  function      myFunction  (  a  ,  b  )  {
    return a   +b;
  }
      `;
  await formatter.init();
  const newCode = formatter.format(code);
  console.log('extract\n', newCode);
}

module.exports = { extract };
