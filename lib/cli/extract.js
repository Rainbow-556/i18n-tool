const { formatAndLint } = require('../transform3.cjs');

function extract() {
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
  formatAndLint(code);
}

module.exports = { extract };
