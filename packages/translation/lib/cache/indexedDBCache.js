const DB_NAME = 'translationDB';
const OBJECT_STORE = 'translationCacheStore';
const VERSION = 1;

class IndexedDBCache {
  #db;
  #maxItems;

  constructor({ maxItems = 1000 }) {
    this.#maxItems = maxItems;
  }

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

  // async setItem(item) {
  //   await this.#init();
  //   const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
  //   const store = transaction.objectStore(OBJECT_STORE);
  //   // store.put方法会插入/更新已有的值，而store.add方法会插入新的值，如果主键值已存在，则会报错
  //   const request = store.put({ ...item, timestamp: Date.now() });
  //   return new Promise((resolve, reject) => {
  //     request.onsuccess = () => {
  //       resolve();
  //     };
  //     request.onerror = e => {
  //       reject(e.target.error);
  //     };
  //   });
  // }

  // async getItem(key) {
  //   await this.#init();
  //   const transaction = this.#db.transaction(OBJECT_STORE, 'readonly');
  //   const store = transaction.objectStore(OBJECT_STORE);
  //   const request = store.get(key);
  //   return new Promise((resolve, reject) => {
  //     request.onsuccess = () => {
  //       resolve(request.result);
  //     };
  //     request.onerror = e => {
  //       reject(e.target.error);
  //     };
  //   });
  // }

  // async removeItem(key) {
  //   await this.#init();
  //   const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
  //   const store = transaction.objectStore(OBJECT_STORE);
  //   const request = store.delete(key);
  //   return new Promise((resolve, reject) => {
  //     request.onsuccess = () => {
  //       resolve();
  //     };
  //     request.onerror = e => {
  //       reject(e.target.error);
  //     };
  //   });
  // }

  // async clear() {
  //   await this.#init();
  //   const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
  //   const store = transaction.objectStore(OBJECT_STORE);
  //   const request = store.clear();
  //   return new Promise((resolve, reject) => {
  //     request.onsuccess = () => {
  //       resolve();
  //     };
  //     request.onerror = e => {
  //       reject(e.target.error);
  //     };
  //   });
  // }

  async getItems(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return Promise.resolve([]);
    }

    await this.#init();

    const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE);

    // 批量查询
    const getRequests = keys.map(key => store.get(key));
    const results = await Promise.all(
      getRequests.map(
        request =>
          new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = e => reject(e.target.error);
          })
      )
    );

    // 更新时间戳
    const now = Date.now();
    const putRequests = results
      .filter(item => item !== undefined)
      .map(item => {
        const updatedItem = { ...item, timestamp: now };
        return store.put(updatedItem);
      });
    // 异步更新时间戳，不等待完成
    Promise.all(
      putRequests.map(
        request =>
          new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = e => reject(e.target.error);
          })
      )
    )
      .then(() => {
        // console.log('Timestamps updated successfully');
      })
      .catch(e => console.error('Failed to update timestamps:', e));

    return results;
  }

  async setItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    await this.#init();

    const transaction = this.#db.transaction(OBJECT_STORE, 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE);

    if (this.#maxItems <= items.length) {
      // 如果当前数据量已经超过maxItems，则清空所有数据
      await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = e => reject(e.target.error);
      });
      // 超过限制，只保留最新的maxItems条数据
      // 打印未被添加的items
      console.log('indexedDBCache not added items', items.slice(this.#maxItems));
      items = items.slice(0, this.#maxItems);
    } else {
      // 计算本次新增数据中需要的额外空间
      const getExistingRequests = items.map(item => store.get(item.key));
      const existingItems = await Promise.all(
        getExistingRequests.map(
          request =>
            new Promise((resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = e => reject(e.target.error);
            })
        )
      );
      // 查不到的为undefined，该数量则是需要的额外空间
      const needSize = existingItems.filter(item => item === undefined).length;
      // console.log('needSize', needSize);
      if (needSize > 0) {
        const countRequest = store.count();
        const currentSize = await new Promise((resolve, reject) => {
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = e => reject(e.target.error);
        });
        // 计算需要删除的最旧记录数
        const needDeleteCount = currentSize + needSize - this.#maxItems;
        // console.log('needDeleteCount', needDeleteCount);
        if (needDeleteCount > 0) {
          let deletedCount = 0;
          await new Promise((resolve, reject) => {
            // 按照时间戳升序排序，删除最旧的记录，lru策略
            const index = store.index('timestamp');
            const cursorRequest = index.openCursor();
            cursorRequest.onsuccess = e => {
              const cursor = e.target.result;
              if (!cursor) {
                resolve();
                return;
              }
              if (!items.find(item => item.key === cursor.primaryKey)) {
                console.log('indexedDBCache delete key', cursor.primaryKey);
                // 如果当前数据不在新数据中，则删除
                cursor.delete();
                deletedCount++;
                if (deletedCount >= needDeleteCount) {
                  resolve();
                  return;
                }
              }
              cursor.continue();
            };
            cursorRequest.onerror = e => reject(e.target.error);
          });
        }
      }
    }

    // 批量插入/更新数据
    const now = Date.now();
    const putRequests = items.map(item => {
      return store.put({ ...item, timestamp: now });
    });
    return Promise.all(
      putRequests.map(
        request =>
          new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = e => reject(e.target.error);
          })
      )
    );
  }
}

export { IndexedDBCache };
