// const CryptoJS = require('crypto-js');
// const axios = require('axios');
import CryptoJS from 'crypto-js';
import axios from 'axios';

const baiduTranslator = {
  options: {
    appId: '',
    secretKey: '',
    originLang: 'zh',
    targetLang: 'en'
  },
  setOptions(options) {
    this.options = options;
  },
  async translate(text) {
    const { appId, secretKey, originLang, targetLang } = this.options;
    const salt = Date.now();
    const data = {
      q: text,
      appid: appId,
      from: originLang,
      to: targetLang,
      salt,
      sign: CryptoJS.MD5(appId + text + salt + secretKey).toString()
    };
    const response = await axios.post('https://fanyi-api.baidu.com/api/trans/vip/translate', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    });
    console.log('response.data');
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
    console.log(JSON.stringify(response.data, null, 2));
  }
};

baiduTranslator.translate('你好{p0}\n我很好\n你好hello\n Vue2SyntaxView你好  {p0} ');

// module.exports = {
//   baiduTranslator
// };
export { baiduTranslator };
