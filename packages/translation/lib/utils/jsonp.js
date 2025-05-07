let jsonpIndex = 0;

export function jsonp({ url, data }) {
  const promise = new Promise((resolve, reject) => {
    // 1. 创建script标签
    const script = document.createElement('script');

    // 2. 处理参数，拼接URL
    let queryString = '';
    if (data) {
      queryString = Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');
    }

    // 3. 设置script的src属性
    const callbackName = `translation_jsonp_callback_${jsonpIndex}`;
    jsonpIndex++;
    script.src = `${url}?${queryString}&callback=${callbackName}`;

    // 4. 定义全局回调函数
    window[callbackName] = function (data) {
      // 清理工作
      delete window[callbackName];
      document.body.removeChild(script);
      resolve({ data });
    };

    // 5. 错误处理
    script.onerror = function (e) {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error('jsonp request failed: ' + e.message));
    };

    // 6. 将script添加到DOM中
    document.body.appendChild(script);
  });
  return promise;
}
