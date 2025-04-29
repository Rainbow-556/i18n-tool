/**
 * 深度遍历 JSON 对象并执行回调
 * @param {any} obj - 要遍历的对象或值
 * @param {Function} callback - 对字符串值执行的回调函数 (value, path)
 * @param {Array<string|number>} [path=[]] - 当前路径
 */
export function deepTraverse(obj, callback, path = []) {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      // 如果是字符串，执行回调
      callback(obj, path);
    }
    return;
  }

  if (Array.isArray(obj)) {
    // 如果是数组，遍历元素
    for (let i = 0; i < obj.length; i++) {
      deepTraverse(obj[i], callback, [...path, i]);
    }
  } else {
    // 如果是对象，遍历属性
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        deepTraverse(obj[key], callback, [...path, key]);
      }
    }
  }
}

/**
 * 根据路径在 JSON 对象中设置值
 * @param {object} obj - 要修改的对象
 * @param {Array<string|number>} path - 属性路径
 * @param {any} value - 要设置的值
 */
export function setValueByPath(obj, path, value) {
  if (!path || path.length === 0) {
    return; // 无效路径
  }

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (current === null || typeof current !== 'object' || !(key in current)) {
      console.error('Invalid path provided for setValueByPath:', path);
      return; // 路径无效
    }
    current = current[key];
  }

  const lastKey = path[path.length - 1];
  if (
    current !== null &&
    typeof current === 'object' &&
    (lastKey in current ||
      (Array.isArray(current) && typeof lastKey === 'number' && lastKey >= 0 && lastKey < current.length))
  ) {
    current[lastKey] = value;
  } else {
    console.error('Could not set value at the end of path:', path);
  }
}
