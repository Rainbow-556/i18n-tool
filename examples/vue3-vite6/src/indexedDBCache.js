const DB_NAME = 'translationDB';
const OBJECT_STORE = 'cacheStore';
const VERSION = 1;

class IndexedDBCache {
  #db;

  #init() {
    if (this.#db) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, VERSION);
      // 数据库首次创建版本或window.indexedDB.open传递的新版本（版本数值要比现在的高）
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(OBJECT_STORE)) {
          // objectStore就是对象存储，用于存储整个对象
          const objectStore = db.createObjectStore(OBJECT_STORE, {
            // 主键，主键值不能重复
            keyPath: 'key',
            autoIncrement: false
          });
          // 创建索引，keyPath为索引的属性名，因为后面要针对该字段做查询
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          // IndexedDB会自动存储整个对象​​，​​不需要单独定义列
        }
      };
      request.onsuccess = event => {
        this.#db = event.target.result;
        // 关闭事件（非标准但广泛支持）
        if ('onclose' in this.#db) {
          // 数据库关闭事件
          this.#db.onclose = () => {
            this.#db = null;
          };
        }
        // 版本变更事件
        this.#db.onversionchange = () => {
          // 主动关闭以允许更新
          this.#db.close();
          this.#db = null;
        };
        resolve();
      };
      request.onerror = e => {
        reject(e.target.error);
      };
    });
  }

  async setItem(item) {
    await this.#init();
    const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE);
    // store.put方法会插入/更新已有的值，而store.add方法会插入新的值，如果主键值已存在，则会报错
    const request = store.put({ ...item, timestamp: Date.now() });
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = e => {
        reject(e.target.error);
      };
    });
  }

  async getItem(key) {
    await this.#init();
    const transaction = this.#db.transaction(OBJECT_STORE, 'readonly');
    const store = transaction.objectStore(OBJECT_STORE);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = e => {
        reject(e.target.error);
      };
    });
  }

  async removeItem(key) {
    await this.#init();
    const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE);
    const request = store.delete(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = e => {
        reject(e.target.error);
      };
    });
  }

  async clear() {
    await this.#init();
    const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE);
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = e => {
        reject(e.target.error);
      };
    });
  }
}

export const indexedDBCache = new IndexedDBCache();
