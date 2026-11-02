import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  onSnapshot,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import type { WorkOrder, Asset, SystemUser, SparePart, Technician } from '../types';
import { DEFAULT_ADMIN_USER } from '../data/mockData';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the exact provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Helper to remove undefined properties before saving to Firestore
export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
    return false;
  }
}

// Collection names
export const WORK_ORDERS_COLLECTION = 'work_orders';
export const ASSETS_COLLECTION = 'assets';
export const USERS_COLLECTION = 'users';
export const SPARE_PARTS_COLLECTION = 'spare_parts';
export const TECHNICIANS_COLLECTION = 'technicians';

// ==========================================
// 1. WORK ORDERS
// ==========================================
export async function saveWorkOrderToFirestore(order: WorkOrder): Promise<void> {
  const docRef = doc(db, WORK_ORDERS_COLLECTION, order.id);
  try {
    const payload = {
      ...order,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firebase] Work order ${order.orderNumber} synced to Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to save work order ${order.orderNumber}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${WORK_ORDERS_COLLECTION}/${order.id}`);
  }
}

export async function fetchWorkOrdersFromFirestore(): Promise<WorkOrder[]> {
  try {
    const colRef = collection(db, WORK_ORDERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const orders: WorkOrder[] = [];
    snapshot.forEach(docSnap => {
      orders.push(docSnap.data() as WorkOrder);
    });
    orders.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
    return orders;
  } catch (error) {
    console.warn('[Firebase] fetchWorkOrders error:', error);
    return [];
  }
}

export function subscribeToWorkOrders(onUpdate: (orders: WorkOrder[]) => void): () => void {
  try {
    const colRef = collection(db, WORK_ORDERS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const orders: WorkOrder[] = [];
        snapshot.forEach(docSnap => {
          orders.push(docSnap.data() as WorkOrder);
        });
        orders.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
        onUpdate(orders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, WORK_ORDERS_COLLECTION);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase] Work order subscription failed:', error);
    return () => {};
  }
}

export async function batchSyncWorkOrdersToFirestore(orders: WorkOrder[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const order of orders) {
      const docRef = doc(db, WORK_ORDERS_COLLECTION, order.id);
      batch.set(docRef, { ...order, syncedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    console.log(`[Firebase] Batch uploaded ${orders.length} work orders to Firestore.`);
  } catch (error) {
    console.error('[Firebase] Batch work order upload failed:', error);
    handleFirestoreError(error, OperationType.WRITE, WORK_ORDERS_COLLECTION);
  }
}

// ==========================================
// 2. ASSETS
// ==========================================
export async function saveAssetToFirestore(asset: Asset): Promise<void> {
  const docRef = doc(db, ASSETS_COLLECTION, asset.id);
  try {
    const payload = cleanUndefined({
      ...asset,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firebase] Asset ${asset.code} successfully saved to Firestore (${asset.id}).`);
  } catch (error) {
    console.error(`[Firebase] Failed to save asset ${asset.code}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${ASSETS_COLLECTION}/${asset.id}`);
  }
}

export async function deleteAssetFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, ASSETS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`[Firebase] Asset deleted from Firestore (${id}).`);
  } catch (error) {
    console.error(`[Firebase] Failed to delete asset ${id}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `${ASSETS_COLLECTION}/${id}`);
  }
}

export async function fetchAssetsFromFirestore(): Promise<Asset[]> {
  try {
    const colRef = collection(db, ASSETS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const assets: Asset[] = [];
    snapshot.forEach(docSnap => {
      assets.push(docSnap.data() as Asset);
    });
    return assets;
  } catch (error) {
    console.warn('[Firebase] fetchAssets error:', error);
    return [];
  }
}

export function subscribeToAssets(onUpdate: (assets: Asset[]) => void): () => void {
  try {
    const colRef = collection(db, ASSETS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const assets: Asset[] = [];
        snapshot.forEach(docSnap => {
          assets.push(docSnap.data() as Asset);
        });
        onUpdate(assets);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, ASSETS_COLLECTION);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase] Asset subscription failed:', error);
    return () => {};
  }
}

export async function batchSyncAssetsToFirestore(assets: Asset[]): Promise<void> {
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
      const chunk = assets.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const asset of chunk) {
        const docRef = doc(db, ASSETS_COLLECTION, asset.id);
        batch.set(docRef, cleanUndefined({ ...asset, syncedAt: new Date().toISOString() }), { merge: true });
      }
      await batch.commit();
    }
    console.log(`[Firebase] Batch uploaded ${assets.length} assets to Firestore.`);
  } catch (error) {
    console.error('[Firebase] Batch assets upload failed:', error);
    handleFirestoreError(error, OperationType.WRITE, ASSETS_COLLECTION);
  }
}

// ==========================================
// 3. SPARE PARTS (คลังอะไหล่)
// ==========================================
export async function saveSparePartToFirestore(part: SparePart): Promise<void> {
  const docRef = doc(db, SPARE_PARTS_COLLECTION, part.id);
  try {
    const payload = {
      ...part,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firebase] Spare part ${part.code} synced to Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to save spare part ${part.code}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${SPARE_PARTS_COLLECTION}/${part.id}`);
  }
}

export async function deleteSparePartFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, SPARE_PARTS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`[Firebase] Deleted spare part ${id} from Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to delete spare part ${id}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `${SPARE_PARTS_COLLECTION}/${id}`);
  }
}

export async function fetchSparePartsFromFirestore(): Promise<SparePart[]> {
  try {
    const colRef = collection(db, SPARE_PARTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const parts: SparePart[] = [];
    snapshot.forEach(docSnap => {
      parts.push(docSnap.data() as SparePart);
    });
    return parts;
  } catch (error) {
    console.warn('[Firebase] fetchSpareParts error:', error);
    return [];
  }
}

export function subscribeToSpareParts(onUpdate: (parts: SparePart[]) => void): () => void {
  try {
    const colRef = collection(db, SPARE_PARTS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const parts: SparePart[] = [];
        snapshot.forEach(docSnap => {
          parts.push(docSnap.data() as SparePart);
        });
        onUpdate(parts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, SPARE_PARTS_COLLECTION);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase] Spare parts subscription failed:', error);
    return () => {};
  }
}

export async function batchSyncSparePartsToFirestore(parts: SparePart[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const part of parts) {
      const docRef = doc(db, SPARE_PARTS_COLLECTION, part.id);
      batch.set(docRef, { ...part, syncedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    console.log(`[Firebase] Batch uploaded ${parts.length} spare parts to Firestore.`);
  } catch (error) {
    console.error('[Firebase] Batch spare parts upload failed:', error);
    handleFirestoreError(error, OperationType.WRITE, SPARE_PARTS_COLLECTION);
  }
}

// ==========================================
// 4. TECHNICIANS (ทีมช่าง)
// ==========================================
export async function saveTechnicianToFirestore(tech: Technician): Promise<void> {
  const docRef = doc(db, TECHNICIANS_COLLECTION, tech.id);
  try {
    const payload = {
      ...tech,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firebase] Technician ${tech.name} synced to Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to save technician ${tech.name}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${TECHNICIANS_COLLECTION}/${tech.id}`);
  }
}

export async function deleteTechnicianFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, TECHNICIANS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`[Firebase] Deleted technician ${id} from Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to delete technician ${id}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `${TECHNICIANS_COLLECTION}/${id}`);
  }
}

export async function fetchTechniciansFromFirestore(): Promise<Technician[]> {
  try {
    const colRef = collection(db, TECHNICIANS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const techs: Technician[] = [];
    snapshot.forEach(docSnap => {
      techs.push(docSnap.data() as Technician);
    });
    return techs;
  } catch (error) {
    console.warn('[Firebase] fetchTechnicians error:', error);
    return [];
  }
}

export function subscribeToTechnicians(onUpdate: (techs: Technician[]) => void): () => void {
  try {
    const colRef = collection(db, TECHNICIANS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const techs: Technician[] = [];
        snapshot.forEach(docSnap => {
          techs.push(docSnap.data() as Technician);
        });
        onUpdate(techs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, TECHNICIANS_COLLECTION);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase] Technician subscription failed:', error);
    return () => {};
  }
}

export async function batchSyncTechniciansToFirestore(techs: Technician[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const tech of techs) {
      const docRef = doc(db, TECHNICIANS_COLLECTION, tech.id);
      batch.set(docRef, { ...tech, syncedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    console.log(`[Firebase] Batch uploaded ${techs.length} technicians to Firestore.`);
  } catch (error) {
    console.error('[Firebase] Batch technicians upload failed:', error);
    handleFirestoreError(error, OperationType.WRITE, TECHNICIANS_COLLECTION);
  }
}

// ==========================================
// 5. SYSTEM USERS (จัดการผู้ใช้โดยแอดมิน)
// ==========================================
export async function saveUserToFirestore(user: SystemUser): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, user.id);
  try {
    const payload = {
      ...user,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firebase] User ${user.username} synced to Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to save user ${user.username}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${user.id}`);
  }
}

export async function deleteUserFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);
    console.log(`[Firebase] Deleted user ${id} from Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to delete user ${id}:`, error);
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COLLECTION}/${id}`);
  }
}

export function subscribeToUsers(onUpdate: (users: SystemUser[]) => void): () => void {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const users: SystemUser[] = [];
        snapshot.forEach(docSnap => {
          users.push(docSnap.data() as SystemUser);
        });
        onUpdate(users);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase] User subscription failed:', error);
    return () => {};
  }
}

export async function batchSyncUsersToFirestore(users: SystemUser[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const user of users) {
      const docRef = doc(db, USERS_COLLECTION, user.id);
      batch.set(docRef, { ...user, syncedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    console.log(`[Firebase] Batch uploaded ${users.length} users to Firestore.`);
  } catch (error) {
    console.error('[Firebase] Batch users upload failed:', error);
    handleFirestoreError(error, OperationType.WRITE, USERS_COLLECTION);
  }
}

// ==========================================
// 6. CLEAR DATABASE (ล้างข้อมูลตัวอย่างเป็นฐานเปล่า 100%)
// ==========================================
export async function clearFirestoreData(): Promise<void> {
  try {
    // 1. Delete all work orders
    const ordersSnap = await getDocs(collection(db, WORK_ORDERS_COLLECTION));
    if (!ordersSnap.empty) {
      const batchOrders = writeBatch(db);
      ordersSnap.forEach((d) => batchOrders.delete(d.ref));
      await batchOrders.commit();
    }

    // 2. Delete all assets
    const assetsSnap = await getDocs(collection(db, ASSETS_COLLECTION));
    if (!assetsSnap.empty) {
      const batchAssets = writeBatch(db);
      assetsSnap.forEach((d) => batchAssets.delete(d.ref));
      await batchAssets.commit();
    }

    // 3. Delete all spare parts
    const partsSnap = await getDocs(collection(db, SPARE_PARTS_COLLECTION));
    if (!partsSnap.empty) {
      const batchParts = writeBatch(db);
      partsSnap.forEach((d) => batchParts.delete(d.ref));
      await batchParts.commit();
    }

    // 4. Delete all technicians
    const techsSnap = await getDocs(collection(db, TECHNICIANS_COLLECTION));
    if (!techsSnap.empty) {
      const batchTechs = writeBatch(db);
      techsSnap.forEach((d) => batchTechs.delete(d.ref));
      await batchTechs.commit();
    }

    // 5. Delete all sample users, keep or re-create DEFAULT_ADMIN_USER
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    if (!usersSnap.empty) {
      const batchUsers = writeBatch(db);
      usersSnap.forEach((d) => {
        // Delete all except admin
        const u = d.data() as SystemUser;
        if (u.username?.toLowerCase() !== 'admin') {
          batchUsers.delete(d.ref);
        }
      });
      await batchUsers.commit();
    }

    // Ensure default admin user is present in Firestore with password: 'sskhos'
    await saveUserToFirestore(DEFAULT_ADMIN_USER);

    console.log('[Firebase] Successfully cleared sample database from Firestore (kept default admin: admin/sskhos).');
  } catch (error) {
    console.error('[Firebase] Clear firestore data error:', error);
  }
}
