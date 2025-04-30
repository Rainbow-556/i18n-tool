class MemoryCache {
  #cache;
  #maxItems;

  constructor({ maxItems = 1000 }) {
    this.#maxItems = maxItems;
    this.#cache = new Map();
  }

  getItems(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return [];
    }

    return keys.map(key => {
      const item = this.#cache.get(key);
      if (item) {
        // 更新访问时间戳
        this.#cache.set(key, { ...item, timestamp: Date.now() });
        return item;
      }
      return undefined;
    });
  }

  setItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    if (this.#maxItems <= items.length) {
      // 如果当前数据量已经超过maxItems，则清空所有数据
      this.#cache.clear();
      // 超过限制，只保留最新的maxItems条数据
      console.log('memoryCache not added items', items.slice(this.#maxItems));
      items = items.slice(0, this.#maxItems);
    } else {
      // 计算需要删除的最旧记录数
      const needSize = items.filter(item => !this.#cache.has(item.key)).length;
      if (needSize > 0) {
        const currentSize = this.#cache.size;
        const needDeleteCount = currentSize + needSize - this.#maxItems;
        if (needDeleteCount > 0) {
          // 按照时间戳排序，删除最旧的记录
          const sortedEntries = [...this.#cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
          let deletedCount = 0;
          for (let i = 0; i < sortedEntries.length; i++) {
            const key = sortedEntries[i][0];
            if (!items.find(item => item.key === key)) {
              // 如果当前数据不在新数据中，则删除
              console.log('memoryCache delete key', key);
              this.#cache.delete(key);
              deletedCount++;
              if (deletedCount >= needDeleteCount) {
                break;
              }
            }
          }
        }
      }
    }

    // 批量插入/更新数据
    const now = Date.now();
    items.forEach(item => {
      this.#cache.set(item.key, { ...item, timestamp: now });
    });
  }
}

export { MemoryCache };
