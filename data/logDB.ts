import { FluxDispatcher } from "@webpack/common";

const DB_NAME = "WatchdogLogs";
const STORE_NAME = "logs";
let db: IDBDatabase | null = null;

export async function openLogDB(): Promise<IDBDatabase> {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const result = request.result;
            if (!result.objectStoreNames.contains(STORE_NAME)) {
                result.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function getLogs(): Promise<any[]> {
    const db = await openLogDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function addLog(log: any) {
    const db = await openLogDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(log);

        request.onsuccess = () => {
            FluxDispatcher.dispatch({ type: "WATCHDOG_LOGS_UPDATED" });
            resolve(undefined);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function clearLogs(): Promise<void> {
    const db = await openLogDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            FluxDispatcher.dispatch({ type: "WATCHDOG_LOGS_UPDATED" });
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}
