import axios from 'axios';

const langMap = {
  'zh-CN': '中文',
  'en-US': '英语',
  'id-ID': '印尼语',
  'es-MX': '西班牙语'
};

const deepSeekTranslator = {
  maxTextCountPerReq: 10000,
  // 实测并发请求比一次性请求的速度更慢，所以设置qps为1，一次请求很大的数据量
  maxCharsPerReq: 4000,
  qps: 1,
  putHtmlTextInSeparateChunk: false,
  textDividerCharLength: 0,
  options: {
    deepSeekApiKey: '',
    getPrompt({ originLang, targetLang }) {
      return `
作为专业本地化翻译专家，请将以下 JSON 数组中的${langMap[originLang]}内容翻译成${langMap[targetLang]}，译文用于在网页显示。

翻译与格式要求：
1. 占位符如 {p0}, {p1} 等保持不变。
2. 代码结构（如 HTML, JSON）保持不变，仅翻译其中的${langMap[originLang]}。
3. 译文需极致精简、本地化，并使用小写。占位符左右加一空格。
4. 保持 JSON 数组结构、元素数量及顺序不变。
5. 返回格式为 JSON 数组，例如 {"results":["译文1","译文2"]}。

示例：
- "你好{p0}{p1}，{p2}" -> "hello {p0} {p1}, {p2}"
- "<div class="title" style="color: red;">你好{p0}{p1}，{p2}</div>" -> "<div class="title" style="color: red;">hello {p0} {p1}, {p2}</div>"
- '{"name":"张三","age":18}' -> '{"name":"Zhang San","age":18}'`;
    }
  },
  setOptions({ deepSeekApiKey, getPrompt }) {
    this.options.deepSeekApiKey = deepSeekApiKey;
    if (typeof getPrompt === 'function') {
      this.options.getPrompt = getPrompt;
    }
  },
  async translate2({ originLang, targetLang, texts }) {
    const data = {
      model: 'deepseek-v3',
      stream: false,
      messages: [
        {
          role: 'system',
          content: this.options.getPrompt({ originLang, targetLang })
        },
        {
          role: 'user',
          content: JSON.stringify(texts)
        }
      ]
    };
    const time = Date.now();
    let success = false;
    let errCode;
    let errMsg;
    try {
      const response = await axios.post('https://a/newapi/v1/chat/completions', data, {
        timeout: 60000,
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.options.deepSeekApiKey}`
        }
      });
      // console.log('response');
      // console.log(JSON.stringify(response.data, null, 2));
      const translatedTexts = JSON.parse(response.data.choices[0].message.content);
      // console.log('translatedTexts', translatedTexts);
      if (translatedTexts.length === texts.length) {
        success = true;
        return { translatedTexts };
      }
      return Promise.reject({ errCode: '-101', errMsg: 'DeepSeek译文结果长度不一致' });
    } catch (e) {
      errMsg = e.message || 'network error';
      if (e.response) {
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        errCode = e.response.status;
        errMsg = e.response.statusText;
      } else if (e.request) {
        // 请求已经成功发起，但没有收到响应
        errCode = -1;
      } else {
        // 发送请求时出了点问题
        errCode = -2;
      }
      return Promise.reject({ errCode: String(errCode), errMsg });
    } finally {
      console.log(
        `[${success ? '成功' : `失败 errCode=${errCode}, errMsg=${errMsg}`}] ${
          texts.length
        }个词条翻译成${targetLang}，总长度为${texts.reduce(
          (result, current) => result + current.length,
          0
        )}个字符，耗时${((Date.now() - time) / 1000).toFixed(2)}s`
      );
    }
  },
  async translate({ originLang, targetLang, texts }) {
    const time = Date.now();
    const data = {
      model: 'deepseek-chat',
      stream: false,
      max_tokens: 8192,
      response_format: {
        type: 'json_object'
      },
      messages: [
        {
          role: 'system',
          content: this.options.getPrompt({ originLang, targetLang })
        },
        {
          role: 'user',
          content: JSON.stringify(texts)
        }
      ]
    };
    // console.log('data');
    // console.log(JSON.stringify(data, null, 2));
    let success = false;
    let errCode;
    let errMsg;
    try {
      const response = await axios.post('https://api.deepseek.com/chat/completions', data, {
        timeout: 60000 * 10,
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.options.deepSeekApiKey}`
        }
      });
      // console.log('response.data');
      // console.log(JSON.stringify(response.data, null, 2));
      const translatedTexts = JSON.parse(response.data.choices[0].message.content).results;
      if (translatedTexts.length === texts.length) {
        success = true;
        return { translatedTexts };
      }
      return Promise.reject({ errCode: '-101', errMsg: 'DeepSeek译文结果长度不一致' });
    } catch (e) {
      errMsg = e.message || 'network error';
      if (e.response) {
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        errCode = e.response.status;
        errMsg = e.response.statusText;
      } else if (e.request) {
        // 请求已经成功发起，但没有收到响应
        errCode = -1;
      } else {
        // 发送请求时出了点问题
        errCode = -2;
      }
      return Promise.reject({ errCode: String(errCode), errMsg });
    } finally {
      console.log(
        `[${success ? '成功' : `失败 errCode=${errCode}, errMsg=${errMsg}`}] ${
          texts.length
        }个词条翻译成${targetLang}，总长度为${texts.reduce(
          (result, current) => result + current.length,
          0
        )}个字符，耗时${((Date.now() - time) / 1000).toFixed(2)}秒`
      );
    }
  }
};

// async function test2() {
//   const data = {
//     messages: [
//       {
//         role: 'system',
//         content:
//           '你是一位精通西班牙语的翻译专家，请翻译以下JSON中的"content"字段为西班牙语。保留"content"中的占位符（如 {p0}）不进行翻译。如果原文没有问号等符号，译文也不要添加。'
//       },
//       {
//         role: 'user',
//         content: '[{""content"": "你好{p0}"}, {""content"": "我有{p0}个苹果，你要吃{p1}个"}]'
//       }
//     ],
//     model: 'deepseek-chat',
//     max_tokens: 8192,
//     response_format: {
//       type: 'json_object'
//     }
//   };

//   const config = {
//     maxBodyLength: Infinity,
//     url: 'https://api.deepseek.com/chat/completions',
//     headers: {
//       'Content-Type': 'application/json',
//       Accept: 'application/json',
//       Authorization: 'Bearer sk-fc00d9a041774791a4478e8e5b5d25871'
//     }
//   };

//   const time = Date.now();
//   axios
//     .post('https://api.deepseek.com/chat/completions', data, config)
//     .then(response => {
//       console.log('time', Date.now() - time + 'ms');
//       console.log(response.data.choices[0].message.content);
//     })
//     .catch(error => {
//       console.log('接口调用失败');
//       console.log(error);
//     });
// }

// test2();

export { deepSeekTranslator };
