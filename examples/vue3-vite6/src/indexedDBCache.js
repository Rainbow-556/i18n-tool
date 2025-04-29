const DB_NAME = 'translationCacheDB';
const OBJECT_STORE = 'store';
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
          const objectStore = db.createObjectStore(OBJECT_STORE, {
            keyPath: 'key',
            autoIncrement: false
          });
          objectStore.createIndex('key', 'key', { unique: true });
          objectStore.createIndex('value', 'value', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      request.onsuccess = event => {
        this.#db = event.target.result;
        resolve();
      };
      request.onerror = e => {
        reject(e.target.error);
      };
    });
  }

  async setItem(key, value) {
    await this.#init();
    if (typeof value !== 'object') {
      throw new Error('Value must be an object');
    }
    const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE);
    const request = store.put({ key, value });
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
        resolve(request.result?.value);
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
