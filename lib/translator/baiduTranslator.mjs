import CryptoJS from 'crypto-js';
import axios from 'axios';

// todo 待补充其他语言
const langMap = {
  'zh-CN': 'zh',
  'en-US': 'en',
  'id-ID': 'id',
  'es-MX': 'spa'
};

const baiduTranslator = {
  maxCharsPerReq: 20,
  qps: 1,
  options: {
    appId: '',
    secretKey: ''
  },
  setOptions(options) {
    this.options = options;
  },
  async translate(originLang, targetLang, texts) {
    const { appId, secretKey } = this.options;
    const salt = Date.now();
    const q = texts.join('\n');
    const data = {
      q,
      appid: appId,
      from: langMap[originLang],
      to: langMap[targetLang],
      salt,
      sign: CryptoJS.MD5(appId + q + salt + secretKey).toString()
    };
    let response;
    try {
      response = await axios.post('https://fanyi-api.baidu.com/api/trans/vip/translate', data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      });
    } catch (e) {
      // console.log('e', e);
      let errCode;
      const errMsg = 'network error';
      if (e.response) {
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        errCode = e.response.status;
      } else if (e.request) {
        // 请求已经成功发起，但没有收到响应
        errCode = -1;
      } else {
        // 发送请求时出了点问题
        errCode = -2;
      }
      return Promise.reject({ errCode: String(errCode), errMsg });
    }
    // console.log('response.data');
    // const data = {
    //   error_code: '54001',
    //   error_msg: 'Invalid Sign',
    //   from: 'zh',
    //   to: 'en',
    //   trans_result: [
    //     {
    //       src: '你好',
    //       dst: 'Hello'
    //     }
    //   ]
    // };
    // console.log(JSON.stringify(response.data, null, 2));
    const { error_code, error_msg, trans_result } = response.data;
    if (error_code == undefined && trans_result) {
      return {
        translatedTexts: trans_result.map(item => item.dst)
      };
    }
    return Promise.reject({ errCode: error_code, errMsg: error_msg });
  }
};

// todo 百度翻译需要企业版才支持所有翻译对，个人和高级版不支持中文转印尼语，中文转西班牙语时{p0}也会被翻译！！！
// baiduTranslator
//   .translate('zh-CN', 'es-MX', ['你好{p-0}，哈哈'])
//   .then(res => {
//     console.log('translate res', res);
//   })
//   .catch(e => {
//     console.log('translate err', e);
//   });
// baiduTranslator
//   .translate('en-US', 'es-MX', ['你好{p-0}'])
//   .then(res => {
//     console.log('translate res', res);
//   })
//   .catch(e => {
//     console.log('translate err', e);
//   });
// module.exports = {
//   baiduTranslator
// };
export { baiduTranslator };
