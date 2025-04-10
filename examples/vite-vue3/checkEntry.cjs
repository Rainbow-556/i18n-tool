const entryFromBuild = require('./entryFromBuild.json');
const entryFromExtract = require('./entryFromExtract.json');

const entryFromExtractKeys = Object.keys(entryFromExtract);

const missingEntry = [];
Object.keys(entryFromBuild).forEach(key => {
  if (!entryFromExtractKeys.includes(key)) {
    missingEntry.push(key);
  }
});

console.log('entry from extract:', entryFromExtractKeys.length);
console.log('entry from build:', Object.keys(entryFromBuild).length);

console.log('missingEntry: ', missingEntry.length);
if (missingEntry.length > 0) {
  console.log(missingEntry);
}
