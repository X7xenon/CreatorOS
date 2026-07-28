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

  static get count() {
    return this.getItems().length;
  }
}
