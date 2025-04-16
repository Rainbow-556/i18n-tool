const path = require('path');
const fs = require('fs');

const entry = {};

for (let i = 1; i <= 10; i++) {
  entry[`mockEntry${i}`] = `来自假的数据{p${i}}，还有{p0}`;
}

fs.writeFileSync(path.resolve(__dirname, 'src/mockEntry.json'), JSON.stringify(entry, null, 2));
