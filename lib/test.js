// with (this) {
//   return _c('div', [
//     _v('\n  Vue2SyntaxView\n  ' + _s(src) + '\n  '),
//     _v(' '),
//     _c('div', [_v(_s(`${computedB}好啊2`))]),
//     _v(' '),
//     _c('div', [_v(_s(methodB()))]),
//     _v(' '),
//     _c('div', [_v('555')])
//   ]);
// }
const { codeFormatter } = require('./utils/codeFormatter.cjs');

const jsx = `
export default function jsx() {
  let a = '来自jsx' + 1;
  let c = '来自jsx' + a + 1;
  return <div id={a}>jsx {c}</div>
}
`;
async function test() {
  await codeFormatter.init();
  const result = await codeFormatter.format(jsx);
  console.log(result);
}

test();
