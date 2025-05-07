import CryptoJS from 'crypto-js';
import axios from 'axios';
import { jsonp } from '../utils/jsonp.js';
import { getJsEnv } from '../utils/jsEnv.js';

// todo 百度翻译需要企业版才支持所有翻译对，个人和高级版不支持中文转印尼语，中文转西班牙语时{p0}也会被翻译！！！
// 文档：https://api.fanyi.baidu.com/doc/21

const jsEnv = getJsEnv();

const langMap = {
  'zh-CN': 'zh',
  'en-US': 'en',
  'id-ID': 'id',
  'es-MX': 'spa'
};

const baiduTranslator = {
  // todo 更新为百度翻译的最大字符限制，都设置为1500
  maxTextCountPerReq: 100,
  maxCharsPerReq: jsEnv === 'browser' ? 100 : 100,
  qps: 1,
  // 百度翻译是通过\n来分隔文本的，所以需要把html文本放到单独的chunk中，否则会漏翻译
  putHtmlTextInSeparateChunk: true,
  textDividerCharLength: 1,
  options: {
    baiduAppId: '',
    baiduSecretKey: ''
  },
  setOptions({ baiduAppId, baiduSecretKey }) {
    this.options.baiduAppId = baiduAppId;
    this.options.baiduSecretKey = baiduSecretKey;
  },
  async translate({ originLang, targetLang, texts }) {
    const { baiduAppId, baiduSecretKey } = this.options;
    const salt = Date.now();
    const q = texts.join('\n');
    const data = {
      q,
      appid: baiduAppId,
      from: 'auto',
      to: langMap[targetLang],
      salt,
      sign: CryptoJS.MD5(baiduAppId + q + salt + baiduSecretKey).toString()
    };
    const time = Date.now();
    let success = false;
    let errCode;
    let errMsg;
    try {
      let response;
      const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
      if (jsEnv === 'browser') {
        // 百度翻译接口不支持cors，需要使用jsonp以get方式请求
        // 注意：jsonp的请求方式只支持get，不支持post
        response = await jsonp({ url, data });
      } else {
        response = await axios.post(url, data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          timeout: 15000
        });
      }
      // console.log('response.data');
      // console.log(JSON.stringify(response.data, null, 2));
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
};

export { baiduTranslator };
