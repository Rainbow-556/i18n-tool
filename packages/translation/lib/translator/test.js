import VolcEngineSDK from 'volcengine-sdk';
import axios from 'axios';
import KEY from '../../../../lib/key.json' assert { type: 'json' };

const { ApiInfo, ServiceInfo, Credentials, API, Request } = VolcEngineSDK;

// 设置安全凭证 AK、SK
const AK = KEY.VOLCENGINE_ACCESS_KEY_ID;
const SK = KEY.VOLCENGINE_SECRET_ACCESS_KEY;

// 翻译目标语言、翻译文本列表
const toLang = 'zh';
const textList = ['Hello world', 'こんにちは世界'];

// api凭证
const credentials = new Credentials(AK, SK, 'translate', 'cn-north-1');

// 设置请求的 header、query、body
const header = new Request.Header({
  'Content-Type': 'application/json'
});
const query = new Request.Query({
  Action: 'TranslateText',
  Version: '2020-06-01'
});
const body = new Request.Body({
  TargetLanguage: toLang,
  TextList: textList
});

// 设置 service、api信息
const serviceInfo = new ServiceInfo('open.volcengineapi.com', header, credentials);
// const serviceInfo = new ServiceInfo('translate.volcengineapi.com', header, credentials);
const apiInfo = new ApiInfo('POST', '/', query, body);

// 生成 API
const api = API(serviceInfo, apiInfo);
// console.log(api.url, api.params, api.config);

// 获取 API 数据，发送请求
axios
  .post(api.url, api.params, api.config)
  .then(res => {
    console.log('res', res.data);
  })
  .catch(err => {
    console.log('err', err);
  });
