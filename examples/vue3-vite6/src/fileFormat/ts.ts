import { Person, CaseTab, CaseType } from './tsType';

const a: number = 1;
const b: string = a + '来自.ts' + 1;
const c = `a是${a ?? b?.length}` + CaseTab.BorrowerAccounts + CaseType.Overdue;
const d = 'Casos Totales';
let reg = new RegExp('^正则表达式$', 'i');
let reg2 = new RegExp(`^正则表达式模板字符串${d}`, 'i');
console.log('ts.ts', b, c, d, reg);

export const greet = (person: Person): Promise<Person> => {
  return Promise.resolve(person);
};
