const { createHash } = require('crypto');
const axios = require('axios');
const KEY = require('../../key.json');

function md5(str) {
  return createHash('md5').update(str).digest('hex');
}

const langMap = {
  'zh-CN': 'zh',
  'en-US': 'en',
  'id-ID': 'id',
  'es-MX': 'spa'
};

class BaiduTranslator {
  constructor() {
    this.maxTextCountPerReq = 100;
    this.maxCharsPerReq = 100;
    this.qps = 1;
    this.putHtmlTextInSeparateChunk = true;
    this.textDividerCharLength = 1;
    this.appId = KEY.BAIDU_APP_ID;
    this.secretKey = KEY.BAIDU_SECRET_KEY;
  }

  async translate({ originLang, targetLang, texts }) {
    const { appId, secretKey } = this;
    const salt = Date.now();
    const q = texts.join('\n');
    const data = {
      q,
      appid: appId,
      from: langMap[originLang],
      to: langMap[targetLang],
      salt,
      sign: md5(appId + q + salt + secretKey)
    };
    const time = Date.now();
    let success = false;
    let errCode;
    let errMsg;
    try {
      const response = await axios.post('https://fanyi-api.baidu.com/api/trans/vip/translate', data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      });
      // console.log(`response.data\n${JSON.stringify(response.data, null, 2)}`);
      // 格式
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
      const { error_code, error_msg, trans_result } = response.data;
      if (error_code == undefined && trans_result) {
        success = true;
        return {
          translatedTexts: trans_result.map(item => item.dst)
        };
      }
      errCode = error_code;
      errMsg = error_msg;
      return Promise.reject({ errCode, errMsg });
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
}

module.exports = {
  BaiduTranslator
};
