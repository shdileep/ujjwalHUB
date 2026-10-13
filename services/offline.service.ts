import localforage from 'localforage';

let _databaseService: any = null;

export function registerDatabaseService(service: any) {
    _databaseService = service;
}

// Configure stores for offline data and queued actions
localforage.config({
    name: 'UjjwalHubOffline',
    storeName: 'offline_store',
});

const cacheStore = localforage.createInstance({ name: 'UjjwalHubOffline', storeName: 'cache' });
const queueStore = localforage.createInstance({ name: 'UjjwalHubOffline', storeName: 'queue' });

export interface OfflineAction {
    id: string;
    type: 'updateBinStatus' | 'recordLogout' | 'updateDriverStatus' | 'recordDutySession' | 'updateBin' | 'incrementDriverTaskCount';
    payload: any;
    timestamp: number;
}

class OfflineManagerService {
    private isOnline: boolean = navigator.onLine;

    constructor() {
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        // Try to flush immediately on start if online
        if (this.isOnline) {
            this.flushQueue();
        }
    }

    private handleOnline() {
        console.log('📶 Back Online! Flushing offline queue...');
        this.isOnline = true;
        this.flushQueue();
    }

    private handleOffline() {
        console.log('📴 Offline Mode Active. Actions will be queued.');
        this.isOnline = false;
    }

    // ---- CACHE METHODS (Read) ----
    async setCache(key: string, data: any) {
        try {
            await cacheStore.setItem(key, data);
        } catch (e) {
            console.error('Failed to cache data', e);
        }
    }

    async getCache<T>(key: string): Promise<T | null> {
        try {
            return await cacheStore.getItem<T>(key);
        } catch (e) {
            console.error('Failed to get cached data', e);
            return null;
        }
    }

    // ---- QUEUE METHODS (Write) ----
    async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
        const fullAction: OfflineAction = {
            ...action,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };

        if (this.isOnline) {
            // IF online, just try to execute it immediately
            return this.executeAction(fullAction);
        }

        // Otherwise, save to IndexedDB queue
        console.log('📴 Queuing action for later:', fullAction.type);
        try {
            const currentQueue: OfflineAction[] = (await queueStore.getItem('action_queue')) || [];
            currentQueue.push(fullAction);
            await queueStore.setItem('action_queue', currentQueue);
        } catch (e) {
            console.error('Failed to queue action', e);
        }
    }

    private async flushQueue() {
        try {
            const queue: OfflineAction[] = (await queueStore.getItem('action_queue')) || [];
            if (queue.length === 0) return;

            console.log(`🔄 Processing ${queue.length} queued actions...`);
            const failedActions: OfflineAction[] = [];

            for (const action of queue) {
                try {
                    await this.executeAction(action);
                } catch (error) {
                    console.error(`❌ Failed to sync action ${action.id}:`, error);
                    // Keep it in the queue if it wasn't a hard validation error
                    failedActions.push(action);
                }
            }

            await queueStore.setItem('action_queue', failedActions);
            if (failedActions.length === 0) {
                console.log('✅ All offline actions synced successfully!');
            } else {
                console.warn(`⚠️ ${failedActions.length} actions failed to sync and remain in queue.`);
            }
        } catch (e) {
            console.error('Failed to flush queue', e);
        }
    }

    private async executeAction(action: OfflineAction) {
        if (!_databaseService) {
            console.warn('⚠️ Database service not registered yet. Cannot execute offline action:', action.type);
            throw new Error('Database service not registered');
        }

        // This executes the actual database.service methods based on the action type
        switch (action.type) {
            case 'updateBinStatus':
                await _databaseService.updateBinStatus(
                    action.payload.binId,
                    action.payload.status,
                    action.payload.fillLevel,
                    action.payload.driverId
                );
                break;
            case 'recordLogout':
                await _databaseService.recordLogout(action.payload.driverId);
                break;
            case 'updateDriverStatus':
                await _databaseService.updateDriverStatus(
                    action.payload.driverId,
                    action.payload.status
                );
                break;
            case 'recordDutySession':
                await _databaseService.recordDutySession(
                    action.payload.driverId,
                    action.payload.type,
                    true
                );
                break;
            case 'updateBin':
                await _databaseService.updateBin(
                    action.payload.binId,
                    action.payload.updates,
                    action.payload.driverId,
                    true
                );
                break;
            case 'incrementDriverTaskCount':
                await _databaseService.incrementDriverTaskCount(
                    action.payload.driverId,
                    true
                );
                break;
            default:
                console.warn('Unknown offline action type:', action.type);
        }
    }
}

export const offlineManager = new OfflineManagerService();
