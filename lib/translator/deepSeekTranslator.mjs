import axios from 'axios';

// todo 待补充其他语言
const langMap = {
  'zh-CN': '中文',
  'en-US': '英语',
  'id-ID': '印尼语',
  'es-MX': '西班牙语'
};

const deepSeekTranslator = {
  maxCharsPerReq: 20,
  qps: 5,
  setOptions(options) {},
  async translate2(originLang, targetLang, texts) {
    const time = Date.now();
    const data = {
      model: 'deepseek-v3',
      stream: false,
      messages: [
        {
          role: 'system',
          content: `你是一位资深专业翻译官，请把以下JSON数组中的每个字符串翻译为${langMap[targetLang]}。需要严格按照以下规则进行翻译：
          1、所有{p0}、{p1}等数字编号占位符保持原样不翻译。
          2、译文要极致精简和本地化、使用小写。
          3、绝对不能修改JSON数组的结构和元素的数量和顺序，原文和译文在顺序和个数要保持一致。
          4、仅需返回译文的JSON数组，不要包含任何额外的文本或解释。
          `
        },
        {
          role: 'user',
          content: JSON.stringify(texts)
        }
      ]
    };
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
          Authorization: 'Bearer sk-v4kaJ83Ixdf201bmrZnLhWBUE2IlcPCc3vbIPvNOlCUe7oUI1'
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
  async translate(originLang, targetLang, texts) {
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
          content: `你是一位资深专业翻译官，请把以下JSON数组中的每个字符串翻译为${langMap[targetLang]}。需要严格按照以下规则进行翻译：
          1、所有{p0}、{p1}等数字编号占位符保持原样不翻译。
          2、译文要极致精简和本地化、使用小写。
          3、绝对不能修改JSON数组的结构和元素的数量和顺序，原文和译文的顺序和个数要保持一致。
          4、译文务必使用JSON数组格式返回，如 {"results":["译文1","译文2"]}。
          `
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
          Authorization: 'Bearer sk-fc00d9a041774791a4478e8e5b5d25871'
        }
      });
      // console.log('response');
      // console.log(JSON.stringify(response.data, null, 2));
      const translatedTexts = JSON.parse(response.data.choices[0].message.content).results;
      // console.log('translatedTexts');
      // console.log(translatedTexts);
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
