import CryptoJS from 'crypto-js';
import axios from 'axios';

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
        )}个字符，耗时${((Date.now() - time) / 1000).toFixed(2)}s`
      );
    }
  }
};

// todo 百度翻译需要企业版才支持所有翻译对，个人和高级版不支持中文转印尼语，中文转西班牙语时{p0}也会被翻译！！！
export { baiduTranslator };
