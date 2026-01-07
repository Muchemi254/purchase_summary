import { ref, set, get, push, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db, firestore } from '../../firebase';
import type { PurchaseRecord, Supplier } from '../../types/index';
import CalculationService from './CalculationService';

class StorageService {
  private static instance: StorageService;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.startAutoSync();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private getUserId(): string {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.uid;
  }

  private getRecordsRef() {
    return ref(db, `users/${this.getUserId()}/records`);
  }

  private getSuppliersRef() {
    return ref(db, `users/${this.getUserId()}/suppliers`);
  }

  private getAuditRef() {
    return ref(db, `users/${this.getUserId()}/audit_logs`);
  }

  // Record Management
  async saveRecord(record: any): Promise<void> {
    const userId = this.getUserId();
    const now = Date.now();
    
    // Validate record
    const validation = CalculationService.validateRecord(record);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate totals
    const totals = CalculationService.calculateRecord(record);
    
    // Prepare final record
    const finalRecord: PurchaseRecord = {
      ...record,
      ...totals,
      id: record.id || `record_${now}_${Math.random().toString(36).substr(2, 9)}`,
      version: (record.version || 0) + 1,
      updatedAt: now,
      updatedBy: userId,
      synced: true,
      createdAt: record.createdAt || now,
      createdBy: record.createdBy || userId
    };

    // Save to Realtime Database
    await set(ref(db, `users/${userId}/records/${finalRecord.id}`), finalRecord);

    // Save to Firestore for backup and querying
    await setDoc(doc(firestore, `users/${userId}/records`, finalRecord.id), {
      ...finalRecord,
      _search: {
        date: finalRecord.date,
        month: finalRecord.date.substring(0, 7),
        year: finalRecord.date.substring(0, 4),
        supplierNames: finalRecord.receipts.map(r => r.supplier.toLowerCase())
      }
    });

    // Update suppliers
    await this.updateSuppliersFromRecord(finalRecord);

    // Log audit
    await this.logAudit('RECORD_SAVED', {
      recordId: finalRecord.id,
      version: finalRecord.version,
      action: record.id ? 'UPDATE' : 'CREATE'
    });

    // Store locally for offline access
    await this.storeLocally('records', finalRecord.id, finalRecord);
  }

  async deleteRecord(recordId: string): Promise<void> {
    const userId = this.getUserId();

    // Delete from Realtime DB
    await set(ref(db, `users/${userId}/records/${recordId}`), null);

    // Delete from Firestore
    await deleteDoc(doc(firestore, `users/${userId}/records`, recordId));

    // Remove from local storage
    await this.removeLocal('records', recordId);

    // Log audit
    await this.logAudit('RECORD_DELETED', { recordId });
  }

  async getRecord(recordId: string): Promise<PurchaseRecord | null> {
    try {
      // Try to get from local storage first (fast)
      const local = await this.getLocal('records', recordId);
      if (local) return local;

      // Fall back to Firestore
      const docRef = doc(firestore, `users/${this.getUserId()}/records`, recordId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const record = docSnap.data() as PurchaseRecord;
        // Store locally for future access
        await this.storeLocally('records', recordId, record);
        return record;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting record:', error);
      throw error;
    }
  }

  // Supplier Management
  async updateSuppliersFromRecord(record: PurchaseRecord): Promise<void> {
    const userId = this.getUserId();
    const now = Date.now();
    
    for (const receipt of record.receipts) {
      if (!receipt.supplier) continue;

      const supplierId = `supplier_${receipt.supplier.toLowerCase().replace(/\s+/g, '_')}`;
      const supplierRef = doc(firestore, `users/${userId}/suppliers`, supplierId);
      const supplierSnap = await getDoc(supplierRef);

      let supplierData: Supplier;
      
      if (supplierSnap.exists()) {
        const existing = supplierSnap.data() as Supplier;
        supplierData = {
          ...existing,
          totalTransactions: existing.totalTransactions + 1,
          totalAmount: existing.totalAmount + receipt.amount,
          lastTransaction: now,
          paymentPreferences: Array.from(
            new Set([...existing.paymentPreferences, receipt.paymentMode])
          )
        };
      } else {
        supplierData = {
          id: supplierId,
          name: receipt.supplier,
          totalTransactions: 1,
          totalAmount: receipt.amount,
          lastTransaction: now,
          paymentPreferences: [receipt.paymentMode]
        };
      }

      // Save to Firestore
      await setDoc(supplierRef, supplierData);

      // Save to Realtime DB for real-time updates
      await set(ref(db, `users/${userId}/suppliers/${supplierId}`), supplierData);
    }
  }

  async getSuppliers(): Promise<Supplier[]> {
    const userId = this.getUserId();
    
    try {
      // Try local storage first
      const localSuppliers = await this.getAllLocal('suppliers');
      if (localSuppliers.length > 0) return localSuppliers;

      // Fall back to Firestore
      const suppliersRef = collection(firestore, `users/${userId}/suppliers`);
      const snapshot = await getDocs(suppliersRef);
      const suppliers = snapshot.docs.map(doc => doc.data() as Supplier);

      // Store locally
      suppliers.forEach(supplier => {
        this.storeLocally('suppliers', supplier.id, supplier);
      });

      return suppliers;
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  // Subscription Methods (for real-time updates)
  subscribeToRecords(callback: (records: PurchaseRecord[]) => void): () => void {
    const recordsRef = this.getRecordsRef();
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const records: PurchaseRecord[] = [];
      snapshot.forEach((child) => {
        records.push(child.val());
      });
      
      // Sort by date descending
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      callback(records);
      
      // Store locally for offline access
      records.forEach(record => {
        this.storeLocally('records', record.id, record);
      });
    });

    return unsubscribe;
  }

  subscribeToSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
    const suppliersRef = this.getSuppliersRef();
    const unsubscribe = onValue(suppliersRef, (snapshot) => {
      const suppliers: Supplier[] = [];
      snapshot.forEach((child) => {
        suppliers.push(child.val());
      });
      
      callback(suppliers);
      
      // Store locally
      suppliers.forEach(supplier => {
        this.storeLocally('suppliers', supplier.id, supplier);
      });
    });

    return unsubscribe;
  }

  // Search and Filter
  async searchRecords(filters: {
    startDate?: string;
    endDate?: string;
    supplier?: string;
    paymentMode?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<PurchaseRecord[]> {
    const userId = this.getUserId();
    let queryRef: any = collection(firestore, `users/${userId}/records`);

    // Apply filters
    // This is simplified - in production you'd use composite indexes
    const snapshot = await getDocs(queryRef);
    const allRecords = snapshot.docs.map(doc => doc.data() as PurchaseRecord);

    return allRecords.filter(record => {
      if (filters.startDate && record.date < filters.startDate) return false;
      if (filters.endDate && record.date > filters.endDate) return false;
      if (filters.supplier) {
        const hasSupplier = record.receipts.some(r => 
          r.supplier.toLowerCase().includes(filters.supplier!.toLowerCase())
        );
        if (!hasSupplier) return false;
      }
      if (filters.paymentMode) {
        const hasPaymentMode = record.receipts.some(r => 
          r.paymentMode === filters.paymentMode
        );
        if (!hasPaymentMode) return false;
      }
      return true;
    });
  }

  // Local Storage for Offline Support
  private async storeLocally(collection: string, key: string, data: any): Promise<void> {
    try {
      const store = await this.getLocalStore(collection);
      store[key] = {
        ...data,
        _localTimestamp: Date.now()
      };
      localStorage.setItem(`purchase_${collection}`, JSON.stringify(store));
    } catch (error) {
      console.error('Error storing locally:', error);
    }
  }

  private async getLocal(collection: string, key: string): Promise<any | null> {
    try {
      const store = await this.getLocalStore(collection);
      return store[key] || null;
    } catch (error) {
      return null;
    }
  }

  private async getAllLocal(collection: string): Promise<any[]> {
    try {
      const store = await this.getLocalStore(collection);
      return Object.values(store);
    } catch (error) {
      return [];
    }
  }

  private async removeLocal(collection: string, key: string): Promise<void> {
    try {
      const store = await this.getLocalStore(collection);
      delete store[key];
      localStorage.setItem(`purchase_${collection}`, JSON.stringify(store));
    } catch (error) {
      console.error('Error removing local:', error);
    }
  }

  private async getLocalStore(collection: string): Promise<Record<string, any>> {
    try {
      const data = localStorage.getItem(`purchase_${collection}`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  // Audit Logging
  private async logAudit(action: string, metadata: any): Promise<void> {
    const userId = this.getUserId();
    const now = Date.now();

    const auditLog = {
      action,
      userId,
      timestamp: now,
      metadata,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };

    // Save to Realtime DB
    await push(this.getAuditRef(), auditLog);

    // Save to Firestore
    await addDoc(collection(firestore, `users/${userId}/audit_logs`), auditLog);
  }

  // Sync Management
  private startAutoSync(): void {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncLocalChanges();
    }, 5 * 60 * 1000);
  }

  private async syncLocalChanges(): Promise<void> {
    // This would sync any locally stored changes that haven't been synced
    // Implementation would track changes made while offline
    console.log('Syncing local changes...');
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Export/Import
  async exportData(): Promise<string> {
    const userId = this.getUserId();
    
    // Get all data
    const recordsRef = collection(firestore, `users/${userId}/records`);
    const suppliersRef = collection(firestore, `users/${userId}/suppliers`);
    
    const [recordsSnap, suppliersSnap] = await Promise.all([
      getDocs(recordsRef),
      getDocs(suppliersRef)
    ]);

    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      userId,
      records: recordsSnap.docs.map(doc => doc.data()),
      suppliers: suppliersSnap.docs.map(doc => doc.data()),
      metadata: {
        recordCount: recordsSnap.size,
        supplierCount: suppliersSnap.size
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    if (data.version !== '2.0') {
      throw new Error('Unsupported export version');
    }

    // Clear existing data
    await this.clearUserData();

    // Import records
    for (const record of data.records) {
      await this.saveRecord(record);
    }

    // Import suppliers
    for (const supplier of data.suppliers) {
      const supplierRef = doc(firestore, `users/${this.getUserId()}/suppliers`, supplier.id);
      await setDoc(supplierRef, supplier);
    }
  }

  private async clearUserData(): Promise<void> {
    const userId = this.getUserId();
    
    // Clear Realtime DB
    await set(ref(db, `users/${userId}/records`), null);
    await set(ref(db, `users/${userId}/suppliers`), null);

    // Clear Firestore (would need batch delete in production)
    // This is simplified - in production you'd use batched writes
  }

  // Backup and Restore
  async createBackup(): Promise<string> {
    return this.exportData();
  }

  async restoreBackup(backupData: string): Promise<void> {
    return this.importData(backupData);
  }
}

export default StorageService.getInstance();