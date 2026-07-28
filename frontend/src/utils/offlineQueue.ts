export class OfflineQueue {
  private static KEY = 'creatoros_sync_queue';

  static getItems(): any[] {
    try {
      const data = localStorage.getItem(this.KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addItem(item: any) {
    const items = this.getItems();
    items.push({
      ...item,
      _queuedAt: new Date().toISOString()
    });
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }

  static clear() {
    localStorage.setItem(this.KEY, JSON.stringify([]));
  }

  static removeItems(itemsToRemove: any[]) {
    const currentItems = this.getItems();
    const toRemoveSet = new Set(itemsToRemove.map(i => i._queuedAt));
    const newItems = currentItems.filter(i => !toRemoveSet.has(i._queuedAt));
    localStorage.setItem(this.KEY, JSON.stringify(newItems));
  }

  static get count() {
    return this.getItems().length;
  }
}
