/**
 * 基于 IndexedDB 的 LRU Key-Value 缓存
 */
class LRUIndexedDBCache {
  /**
   * @param {string} dbName - 数据库名称
   * @param {string} storeName - 对象存储名称
   * @param {number} maxSize - 最大缓存条数
   */
  constructor(dbName = 'lruCacheDB', storeName = 'cacheStore', maxSize = 1000) {
    if (!('indexedDB' in window)) {
      console.error("This browser doesn't support IndexedDB");
      throw new Error('IndexedDB not supported');
    }

    this.dbName = dbName;
    this.storeName = storeName;
    this.maxSize = maxSize;
    this.db = null; // IndexedDB 数据库实例
    this.isOpening = false; // 防止重复打开数据库
    this.openRequest = null; // Promise to manage database opening
  }

  /**
   * 打开或创建数据库
   * @returns {Promise<IDBDatabase>} - IndexedDB 数据库实例的 Promise
   */
  async open() {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    if (this.isOpening) {
      // If already opening, wait for the existing open request
      return this.openRequest;
    }

    this.isOpening = true;
    this.openRequest = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1); // Version 1

      request.onupgradeneeded = event => {
        const db = event.target.result;
        // Create object store with 'key' as the primary key
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' });
          // Create an index on 'timestamp' for LRU sorting
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log(
            `IndexedDB object store "${this.storeName}" created with "key" primary key and "timestamp" index.`
          );
        }
      };

      request.onsuccess = event => {
        this.db = event.target.result;
        console.log(`IndexedDB database "${this.dbName}" opened successfully.`);
        this.isOpening = false;
        resolve(this.db);
      };

      request.onerror = event => {
        console.error(`IndexedDB database error: ${event.target.errorCode}`);
        this.isOpening = false;
        reject(new Error(`IndexedDB error: ${event.target.errorCode}`));
      };
    });

    return this.openRequest;
  }

  /**
   * 获取数据库事务
   * @param {IDBTransactionMode} mode - 事务模式 ('readonly' 或 'readwrite')
   * @returns {Promise<IDBTransaction>} - 事务对象的 Promise
   */
  async getTransaction(mode) {
    const db = await this.open();
    return db.transaction(this.storeName, mode);
  }

  /**
   * 批量保存 key-value 数据
   * @param {Array<{key: string, value: any}>} items - 要保存的 key-value 对象数组
   * @returns {Promise<void>}
   */
  async set(items) {
    if (!items || items.length === 0) {
      return;
    }

    const transaction = await this.getTransaction('readwrite');
    const objectStore = transaction.objectStore(this.storeName);
    const now = Date.now();

    return new Promise((resolve, reject) => {
      // Use Promise.all to wait for all put requests to complete within the transaction
      const putPromises = items.map(item => {
        return new Promise((putResolve, putReject) => {
          // Ensure key is a string or valid IndexedDB key type
          if (typeof item.key !== 'string') {
            console.warn(`Invalid key type for IndexedDB: ${typeof item.key}. Key will be converted to string.`);
            item.key = String(item.key);
          }
          const dataToStore = { key: item.key, value: item.value, timestamp: now };
          const request = objectStore.put(dataToStore); // Use put to add or update

          request.onsuccess = () => putResolve();
          request.onerror = event => putReject(event.target.error);
        });
      });

      Promise.all(putPromises)
        .then(() => {
          // All puts are successful. Now check size and evict if needed.
          // Eviction should ideally happen within the same transaction or a new one quickly.
          // Let's start a new transaction for eviction for simplicity here.
          // In a highly performance-sensitive scenario, you might extend the current one.
          this.lruEvict().then(resolve).catch(reject);

          // Or simpler (but slightly less efficient if put is slow):
          // transaction.oncomplete = () => {
          //      this.lruEvict().then(resolve).catch(reject);
          // };
          // transaction.onerror = (event) => reject(event.target.error);
          // transaction.onabort = (event) => reject(event.target.error);
        })
        .catch(reject); // Reject the main promise if any put fails
    });
  }

  /**
   * 批量查询多个 key 对应的数据
   * @param {string[]} keys - 要查询的 key 数组
   * @returns {Promise<Array<any | undefined>>} - 对应 key 的 value 数组，如果 key 不存在则为 undefined
   */
  async get(keys) {
    if (!keys || keys.length === 0) {
      return Promise.resolve([]);
    }

    // Use 'readwrite' transaction because we need to update the timestamp of accessed items
    const transaction = await this.getTransaction('readwrite');
    const objectStore = transaction.objectStore(this.storeName);
    const now = Date.now();
    const results = [];
    const itemsToUpdate = []; // To collect items for timestamp update

    return new Promise((resolve, reject) => {
      // Use Promise.all to wait for all get requests to complete within the transaction
      const getPromises = keys.map(key => {
        return new Promise((getResolve, getReject) => {
          const request = objectStore.get(key);
          request.onsuccess = event => {
            const result = event.target.result;
            if (result) {
              results.push(result.value);
              // Collect items to update timestamp later in the same transaction
              itemsToUpdate.push({ key: result.key, value: result.value });
            } else {
              results.push(undefined); // Key not found
            }
            getResolve();
          };
          request.onerror = event => getReject(event.target.error);
        });
      });

      Promise.all(getPromises)
        .then(() => {
          // Now, update the timestamps for the items that were found
          const updatePromises = itemsToUpdate.map(item => {
            return new Promise((updateResolve, updateReject) => {
              const dataToUpdate = { key: item.key, value: item.value, timestamp: now };
              const request = objectStore.put(dataToUpdate);
              request.onsuccess = () => updateResolve();
              request.onerror = event => updateReject(event.target.error);
            });
          });

          return Promise.all(updatePromises); // Wait for all updates
        })
        .then(() => {
          // All gets and updates are successful
          // Ensure results array order matches the input keys (necessary if getPromises resolves out of order,
          // though IDB requests usually resolve in submission order within a single transaction,
          // it's safer to reorder or map results based on input keys if strict order is needed.
          // For now, assuming results are pushed in getPromises order which matches input keys order.)
          // A more robust way is to return { key: key, value: value } from getPromises and map.
          // Let's stick to simple pushing for now. If order is critical, need a mapping step.

          // Final step: Wait for the transaction to complete
          transaction.oncomplete = () => resolve(results);
          transaction.onerror = event => reject(event.target.error);
          transaction.onabort = event => reject(event.target.error);
        })
        .catch(reject); // Reject the main promise if any get or update fails
    });
  }

  /**
   * LRU 淘汰逻辑：删除最老的数据直到数量回到 maxSize
   * @returns {Promise<void>}
   * @private
   */
  async lruEvict() {
    const transaction = await this.getTransaction('readwrite');
    const objectStore = transaction.objectStore(this.storeName);
    const countRequest = objectStore.count();

    return new Promise((resolve, reject) => {
      countRequest.onsuccess = async event => {
        const currentCount = event.target.result;

        if (currentCount <= this.maxSize) {
          // No eviction needed
          resolve();
          return;
        }

        const itemsToDeleteCount = currentCount - this.maxSize;
        console.log(
          `Cache size (${currentCount}) exceeds max size (${this.maxSize}). Evicting ${itemsToDeleteCount} items.`
        );

        // Open a cursor on the 'timestamp' index in ascending order ('next')
        const index = objectStore.index('timestamp');
        const cursorRequest = index.openCursor('next'); // 'next' iterates in ascending order of timestamp

        let itemsDeleted = 0;
        cursorRequest.onsuccess = event => {
          const cursor = event.target.result;
          if (cursor && itemsDeleted < itemsToDeleteCount) {
            // Delete the current item pointed by the cursor
            const deleteRequest = cursor.delete();
            deleteRequest.onsuccess = () => {
              itemsDeleted++;
              // If we still need to delete more, continue the cursor
              if (itemsDeleted < itemsToDeleteCount) {
                cursor.continue();
              } else {
                console.log(`Evicted ${itemsDeleted} items.`);
                // Eviction finished within the cursor loop
                // Wait for the transaction to complete
                transaction.oncomplete = () => resolve();
                transaction.onerror = event => reject(event.target.error);
                transaction.onabort = event => reject(event.target.error);
              }
            };
            deleteRequest.onerror = event => {
              console.error('Error during cursor deletion:', event.target.error);
              reject(event.target.error);
            };
          } else {
            // Cursor finished or no more items to delete
            console.log(`Eviction finished. Deleted ${itemsDeleted} items.`);
            // Wait for the transaction to complete (important if cursor finished before deleting enough, though unlikely if count > maxSize)
            transaction.oncomplete = () => resolve();
            transaction.onerror = event => reject(event.target.error);
            transaction.onabort = event => reject(event.target.error);
          }
        };

        cursorRequest.onerror = event => {
          console.error('Error opening timestamp cursor:', event.target.error);
          reject(event.target.error);
        };
      };

      countRequest.onerror = event => {
        console.error('Error getting object store count:', event.target.error);
        reject(event.target.error);
      };
      // Need to handle transaction completion/errors for the count request path too
      transaction.onerror = event => reject(event.target.error);
      transaction.onabort = event => reject(event.target.error);
    });
  }

  /**
   * 批量删除多个 key 对应的数据
   * @param {string[]} keys - 要删除的 key 数组
   * @returns {Promise<void>}
   */
  async delete(keys) {
    if (!keys || keys.length === 0) {
      return;
    }
    const transaction = await this.getTransaction('readwrite');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const deletePromises = keys.map(key => {
        return new Promise((deleteResolve, deleteReject) => {
          const request = objectStore.delete(key);
          request.onsuccess = () => deleteResolve();
          request.onerror = event => deleteReject(event.target.error);
        });
      });

      Promise.all(deletePromises)
        .then(() => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = event => reject(event.target.error);
          transaction.onabort = event => reject(event.target.error);
        })
        .catch(reject);
    });
  }

  /**
   * 清空整个缓存
   * @returns {Promise<void>}
   */
  async clear() {
    const transaction = await this.getTransaction('readwrite');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.clear();
      request.onsuccess = () => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = event => reject(event.target.error);
        transaction.onabort = event => reject(event.target.error);
      };
      request.onerror = event => reject(event.target.error);
    });
  }

  /**
   * 获取当前缓存条数
   * @returns {Promise<number>} - 缓存条数的 Promise
   */
  async count() {
    const transaction = await this.getTransaction('readonly');
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.count();
      request.onsuccess = event => {
        resolve(event.target.result);
      };
      request.onerror = event => reject(event.target.error);
      // No transaction completion handler needed for readonly count
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log(`IndexedDB database "${this.dbName}" closed.`);
    }
  }
}

// 示例用法：
async function exampleUsage() {
  const cache = new LRUIndexedDBCache('myAppDataCache', 'apiResponses', 5); // 最大缓存5条

  try {
    // 1. 打开数据库
    await cache.open();
    console.log('Cache opened.');

    // 2. 批量保存数据 (小于 maxSize)
    console.log('\nSetting initial data...');
    await cache.set([
      { key: 'user:1', value: { name: 'Alice', id: 1 } },
      { key: 'product:101', value: { name: 'Laptop', price: 1200 } },
      { key: 'settings', value: { theme: 'dark' } }
    ]);
    console.log('Initial data set.');
    console.log('Current count:', await cache.count()); // Should be 3

    // 3. 批量查询数据
    console.log('\nGetting data...');
    const result1 = await cache.get(['user:1', 'product:101', 'nonexistent:key']);
    console.log('Get result 1:', result1); // Should show Alice, Laptop, undefined
    console.log('Current count:', await cache.count()); // Still 3 (timestamps updated)

    // 4. 添加更多数据，触发 LRU 淘汰
    console.log('\nSetting more data to trigger LRU...');
    // Adding 3 more items (total 3 + 3 = 6), exceeding maxSize (5)
    // 'user:1' and 'product:101' were accessed recently, 'settings' is the oldest
    await cache.set([
      { key: 'order:abc', value: { id: 'abc', items: [] } },
      { key: 'category:tech', value: { name: 'Technology' } },
      { key: 'user:2', value: { name: 'Bob', id: 2 } }
    ]);
    console.log('More data set.');
    console.log('Current count:', await cache.count()); // Should be 5 (maxSize)

    // 5. 检查哪些数据被淘汰了
    console.log('\nChecking cached data after eviction...');
    const result2 = await cache.get(['user:1', 'product:101', 'settings', 'order:abc', 'category:tech', 'user:2']);
    console.log('Get result 2:', result2); // 'settings' should be undefined, others should exist

    // 6. 批量删除数据
    console.log('\nDeleting data...');
    await cache.delete(['user:1', 'order:abc']);
    console.log('Data deleted.');
    console.log('Current count:', await cache.count()); // Should be 3 ('product:101', 'category:tech', 'user:2')

    const result3 = await cache.get(['user:1', 'product:101', 'order:abc']);
    console.log('Get result 3 after delete:', result3); // 'user:1', 'order:abc' should be undefined

    // 7. 清空缓存
    console.log('\nClearing cache...');
    await cache.clear();
    console.log('Cache cleared.');
    console.log('Current count:', await cache.count()); // Should be 0
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // 8. 关闭数据库连接
    cache.close();
    console.log('\nCache closed.');
  }
}

// 运行示例
exampleUsage();
