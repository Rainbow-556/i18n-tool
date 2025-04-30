import { IndexedDBCache } from './indexedDBCache.js';
import { MemoryCache } from './memoryCache.js';

class Cache {
  #memoryCache;
  #indexedDBCache;

  constructor({ maxItems = 1000 }) {
    this.#memoryCache = new MemoryCache({ maxItems });
    if (window.indexedDB) {
      this.#indexedDBCache = new IndexedDBCache({ maxItems });
    }
  }

  async getItems(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return [];
    }

    // 先从内存缓存查询
    const memoryResults = this.#memoryCache.getItems(keys);
    const missingKeys = keys.filter((key, index) => memoryResults[index] === undefined);
    console.log('memoryCache missingKeys', missingKeys);

    // 如果IndexedDB可用，则从IndexedDB查询缺失的key
    if (this.#indexedDBCache && missingKeys.length > 0) {
      try {
        const indexedDBResults = await this.#indexedDBCache.getItems(missingKeys);
        console.log('indexedDBResults', indexedDBResults);
        // 将IndexedDB结果存入内存缓存
        const itemsToMemoryCache = indexedDBResults.filter(item => item !== undefined);
        if (itemsToMemoryCache.length > 0) {
          this.#memoryCache.setItems(itemsToMemoryCache);
        }
        // 合并结果
        return keys.map((key, index) => {
          if (memoryResults[index] !== undefined) {
            return memoryResults[index];
          }
          const indexedDBIndex = missingKeys.indexOf(key);
          return indexedDBResults[indexedDBIndex];
        });
      } catch (e) {
        console.error('Failed to get items from IndexedDB:', e);
        // 如果IndexedDB查询失败，返回内存缓存中的数据
        return memoryResults;
      }
    }

    return memoryResults;
  }

  async setItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }
    // 先更新内存缓存
    this.#memoryCache.setItems(items);
    // 如果IndexedDB可用，异步更新IndexedDB
    if (this.#indexedDBCache) {
      this.#indexedDBCache.setItems(items).catch(e => {
        console.error('Failed to update IndexedDB:', e);
      });
    }
  }
}

export { Cache };
