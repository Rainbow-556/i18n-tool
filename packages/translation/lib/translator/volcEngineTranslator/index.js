import axios from 'axios';
import { VolcEngineSDK } from './sdk/index.js';

const { ApiInfo, ServiceInfo, Credentials, API, Request } = VolcEngineSDK;

// 火山翻译不支持cors和jsonp，所以只能在node环境下使用
// 文档：https://www.volcengine.com/docs/4640/65067

const langMap = {
  'zh-CN': 'zh',
  'en-US': 'en',
  'id-ID': 'id',
  'es-MX': 'es'
};

const volcEngineTranslator = {
  // todo 更新为火山翻译的最大字符限制，都设置为3000
  // 火山翻译的要求：TextList列表长度不超过16，但是实测100也是可以的，总文本长度不超过5000字符
  maxTextCountPerReq: 100,
  maxCharsPerReq: 100,
  qps: 5,
  putHtmlTextInSeparateChunk: false,
  textDividerCharLength: 0,
  options: {
    volcEngineAccessKeyId: '',
    volcEngineSecretAccessKey: ''
  },
  setOptions({ volcEngineAccessKeyId, volcEngineSecretAccessKey }) {
    this.options.volcEngineAccessKeyId = volcEngineAccessKeyId;
    this.options.volcEngineSecretAccessKey = volcEngineSecretAccessKey;
  },
  async translate({ originLang, targetLang, texts }) {
    const { volcEngineAccessKeyId, volcEngineSecretAccessKey } = this.options;
    // api凭证
    const credentials = new Credentials(volcEngineAccessKeyId, volcEngineSecretAccessKey, 'translate', 'cn-north-1');
    // 设置请求的 header、query、body
    const header = new Request.Header({ 'Content-Type': 'application/json' });
    const query = new Request.Query({ Action: 'TranslateText', Version: '2020-06-01' });
    const body = new Request.Body({
      TargetLanguage: langMap[targetLang],
      TextList: texts
    });
    // 设置 service、api信息
    const serviceInfo = new ServiceInfo('translate.volcengineapi.com', header, credentials);
    const apiInfo = new ApiInfo('POST', '/', query, body);
    // 生成 API
    const api = API(serviceInfo, apiInfo);

    const time = Date.now();
    let success = false;
    let errCode;
    let errMsg;
    try {
      const response = await axios.post(api.url, api.params, { ...api.config, timeout: 15000 });
      // console.log('response.data');
      // console.log(JSON.stringify(response.data, null, 2));
      // 格式
      // const data = {
      //   ResponseMetadata: {
      //     Error: {
      //       Code: 'InvalidSign',
      //       Message: 'Invalid Sign'
      //     }
      //   },
      //   TranslationList: [
      //     {
      //       Translation: '你好'
      //     }
      //   ]
      // };
      const { ResponseMetadata, TranslationList } = response.data;
      const { Code, Message } = ResponseMetadata.Error || {};
      errCode = Code;
      errMsg = Message;
      if (errCode == undefined && TranslationList) {
        success = true;
        return {
          translatedTexts: TranslationList.map(item => item.Translation)
        };
      }
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

export { volcEngineTranslator };
