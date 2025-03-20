// 从vue 3.2.13+开始，vue/compiler-sfc 已经内置了对.vue文件的编译，不需要额外安装
import {
  parse as parseVueSFC,
  compileTemplate,
  compileScript,
} from "vue/compiler-sfc";
import { parse } from "@babel/parser";
import traversePkg from "@babel/traverse";
import generatorPkg from "@babel/generator";
import path from "path";
import fs from "fs";

const traverse = traversePkg.default;
const generate = generatorPkg.default;

const fileContent = fs.readFileSync(path.resolve("./src/App.vue"), "utf-8");
const { descriptor } = parseVueSFC(fileContent);

const { code: templateCode } = compileTemplate({
  id: "1",
  filename: "1.vue",
  source: descriptor.template.content,
  compilerOptions: {
    // 不保留template中的注释
    comments: false,
  },
});
console.log("\ntemplateCode\n", templateCode);

const { content: scriptCode } = compileScript(descriptor, {
  id: "1",
  filename: "1.vue",
  sourceMap: false,
});
console.log("\nscriptCode\n", scriptCode);
