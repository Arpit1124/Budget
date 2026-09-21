/**
 * BudgetAI Gov - IndexedDB Offline Storage & Synchronization Engine
 * Designed for government network resiliency, unstable NIC Intranets, and offline field audits.
 */

const DB_NAME = 'BudgetGov_Offline_DB';
const DB_VERSION = 1;
const CACHE_STORE = 'budget_cache';
const QUEUE_STORE = 'offline_queue';

export interface QueuedAction {
  id: string;
  actionType: string;
  payload: any;
  description: string;
  timestamp: string;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache arbitrary dataset into IndexedDB
 */
export async function saveToIndexedDBCache(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      const store = tx.objectStore(CACHE_STORE);
      const record = {
        key,
        data,
        cachedAt: new Date().toISOString(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB save failed for ${key}:`, err);
  }
}

/**
 * Retrieve cached dataset from IndexedDB
 */
export async function getFromIndexedDBCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, 'readonly');
      const store = tx.objectStore(CACHE_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB read failed for ${key}:`, err);
    return null;
  }
}

/**
 * Bulk cache all critical budget data for offline resilience
 */
export async function cacheAllCriticalData(datasets: Record<string, any>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(CACHE_STORE, 'readwrite');
    const store = tx.objectStore(CACHE_STORE);

    const now = new Date().toISOString();
    Object.entries(datasets).forEach(([key, data]) => {
      if (data !== undefined && data !== null) {
        store.put({ key, data, cachedAt: now });
      }
    });

    store.put({ key: '_last_sync_timestamp', data: now, cachedAt: now });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to bulk cache budget datasets:', err);
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastCacheTimestamp(): Promise<string | null> {
  const ts = await getFromIndexedDBCache<string>('_last_sync_timestamp');
  return ts;
}

/**
 * Add a mutating user action to the offline queue when connection is unstable
 */
export async function enqueueOfflineAction(action: {
  actionType: string;
  payload: any;
  description: string;
}): Promise<QueuedAction> {
  const item: QueuedAction = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actionType: action.actionType,
    payload: action.payload,
    description: action.description,
    timestamp: new Date().toISOString(),
    status: 'QUEUED',
    retryCount: 0,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to enqueue offline action to IndexedDB:', err);
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('budgetai_offline_queue') || '[]');
    existing.push(item);
    localStorage.setItem('budgetai_offline_queue', JSON.stringify(existing));
  }

  return item;
}

/**
 * Retrieve all currently pending actions from offline queue
 */
export async function getOfflineQueue(): Promise<QueuedAction[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readonly');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve((req.result as QueuedAction[]) || []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const fallback = JSON.parse(localStorage.getItem('budgetai_offline_queue') || '[]');
    return fallback;
  }
}

/**
 * Remove an item from the offline queue after successful server sync
 */
export async function removeQueuedAction(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const existing = JSON.parse(localStorage.getItem('budgetai_offline_queue') || '[]');
    const updated = existing.filter((item: any) => item.id !== id);
    localStorage.setItem('budgetai_offline_queue', JSON.stringify(updated));
  }
}

/**
 * Clear the entire offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    localStorage.removeItem('budgetai_offline_queue');
  }
}

export interface SystemSyncStatus {
  status: 'ONLINE' | 'SYNCING' | 'OFFLINE';
  pendingQueueCount: number;
  swRegistered: boolean;
  swActive: boolean;
  indexedDBConnected: boolean;
  lastSyncTimestamp: string | null;
}

/**
 * Check synchronization status by checking IndexedDB queue status and Service Worker
 */
export async function checkSystemSyncStatus(isAppSyncing: boolean = false): Promise<SystemSyncStatus> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  let queueCount = 0;
  let hasSyncingItems = false;
  let indexedDBOk = false;
  let lastSyncTime: string | null = null;

  try {
    const queue = await getOfflineQueue();
    queueCount = queue.length;
    hasSyncingItems = queue.some((q) => q.status === 'SYNCING');
    lastSyncTime = await getLastCacheTimestamp();
    indexedDBOk = true;
  } catch (e) {
    indexedDBOk = false;
  }

  // Check Service Worker status via MessageChannel
  let swActive = false;
  let swRegistered = false;

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    swRegistered = true;
    if (navigator.serviceWorker.controller) {
      swActive = true;
      try {
        const channel = new MessageChannel();
        navigator.serviceWorker.controller.postMessage(
          { type: 'CHECK_SYNC_STATUS' },
          [channel.port2]
        );
      } catch (err) {
        // SW message channel error fallback
      }
    }
  }

  let finalStatus: 'ONLINE' | 'SYNCING' | 'OFFLINE' = 'ONLINE';
  if (!isOnline) {
    finalStatus = 'OFFLINE';
  } else if (isAppSyncing || hasSyncingItems) {
    finalStatus = 'SYNCING';
  } else {
    finalStatus = 'ONLINE';
  }

  return {
    status: finalStatus,
    pendingQueueCount: queueCount,
    swRegistered,
    swActive,
    indexedDBConnected: indexedDBOk,
    lastSyncTimestamp: lastSyncTime,
  };
}

