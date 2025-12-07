// StorageService.ts
declare global {
  interface Window {
    storage: {
      get(key: string): Promise<{ value: string } | undefined>;
      set(key: string, value: string): Promise<void>;
    };
  }
}

// Polyfill window.storage with localStorage
if (!window.storage) {
  window.storage = {
    async get(key: string) {
      const value = localStorage.getItem(key);
      return value ? { value } : undefined;
    },
    async set(key: string, value: string) {
      localStorage.setItem(key, value);
    }
  };
}

const StorageService = {
  async loadRecords() {
    try {
      const data = await window.storage.get('purchase_records');
      return data ? JSON.parse(data.value) : [];
    } catch (error) {
      console.log('No existing records');
      return [];
    }
  },

  async loadSuppliers() {
    try {
      const data = await window.storage.get('suppliers_list');
      return data ? JSON.parse(data.value) : [];
    } catch (error) {
      console.log('No existing suppliers');
      return [];
    }
  },

  async save(records: any, suppliers: any) {
    try {
      await window.storage.set('purchase_records', JSON.stringify(records));
      await window.storage.set('suppliers_list', JSON.stringify(suppliers));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
};

export default StorageService;
