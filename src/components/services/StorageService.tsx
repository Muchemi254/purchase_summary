import { get, onValue, ref, set,push} from "firebase/database";
import { db, auth } from "../../firebase";

const StorageService = {
  subscribeRecords(callback: (data: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const recordsRef = ref(db, `users/${user.uid}/records`);
    return onValue(recordsRef, snap => {
      const val = snap.val();
      callback(val ? Object.values(val) : []);
    });
  },

  subscribeSuppliers(callback: (data: string[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const refSup = ref(db, `users/${user.uid}/suppliers`);
    return onValue(refSup, snap => {
      const val = snap.val();
      callback(val ? Object.values(val) : []);
    });
  },

  async loadRecords() {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const snap = await get(ref(db, `users/${user.uid}/records`));
    const val = snap.val();
    return val ? Object.values(val) : [];
  },

  async loadSuppliers() {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const snap = await get(ref(db, `users/${user.uid}/suppliers`));
    const val = snap.val();
    return val ? Object.values(val) : [];
  },

  async saveRecord(record: any, previous?: any) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();
    const version = previous ? previous.version + 1 : 1;

    const recordRef = ref(db, `users/${user.uid}/records/${record.id}`);

    const finalRecord = {
      ...record,
      version,
      updatedAt: now,
      updatedBy: user.uid,
      ...(previous ? {} : { createdAt: now, createdBy: user.uid }),
    };

    await set(recordRef, finalRecord);

    // history
    await push(ref(db, `users/${user.uid}/record_history`), {
      recordId: record.id,
      version,
      snapshot: finalRecord,
      action: previous ? "UPDATE" : "CREATE",
      actor: user.uid,
      timestamp: now,
    });

    // audit
    await push(ref(db, `users/${user.uid}/audit_logs`), {
      entity: "record",
      entityId: record.id,
      action: previous ? "UPDATED_RECORD" : "CREATED_RECORD",
      actor: user.uid,
      timestamp: now,
    });
  },

  async save(records:any, suppliers:any) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    for (const record of records) {
      await this.saveRecord(record);
    }

    await set(ref(db, `users/${user.uid}/suppliers`), suppliers);
  },

  deleteRecord: async (id:any) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    await set(ref(db, `users/${user.uid}/records/${id}`), null);

    await push(ref(db, `users/${user.uid}/audit_logs`), {
      entity: "record",
      entityId: id,
      action: "DELETED_RECORD",
      actor: user.uid,
      timestamp: Date.now(),
    });
  },
};

export default StorageService;
