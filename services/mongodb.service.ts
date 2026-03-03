/* 
  🍃 MONGODB SERVICE (via Atlas Data API)
  Connects to MongoDB Atlas using standard HTTPS requests.
  Does NOT require a Node.js runtime/driver.
*/

const MONGODB_CONFIG = {
    endpoint: import.meta.env.VITE_MONGODB_ENDPOINT || '',
    apiKey: import.meta.env.VITE_MONGODB_API_KEY || '',
    database: import.meta.env.VITE_MONGODB_DATABASE || 'ujjwal_db',
    dataSource: import.meta.env.VITE_MONGODB_CLUSTER || 'Cluster0'
};

export const mongodbService = {
    /**
     * Find documents in a MongoDB collection
     */
    async find(collection: string, filter: any = {}, limit: number = 50) {
        if (!MONGODB_CONFIG.endpoint || !MONGODB_CONFIG.apiKey) {
            console.warn("⚠️ MongoDB Config missing. Check your .env file.");
            return { documents: [] };
        }

        try {
            const response = await fetch(`${MONGODB_CONFIG.endpoint}/action/find`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': MONGODB_CONFIG.apiKey,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    dataSource: MONGODB_CONFIG.dataSource,
                    database: MONGODB_CONFIG.database,
                    collection: collection,
                    filter: filter,
                    limit: limit
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`MongoDB Error: ${response.status} - ${err}`);
            }

            return await response.json();
        } catch (error) {
            console.error("❌ MongoDB Find Error:", error);
            return { documents: [], error: true };
        }
    },

    /**
     * Insert a single document into a collection
     */
    async insertOne(collection: string, document: any) {
        try {
            const response = await fetch(`${MONGODB_CONFIG.endpoint}/action/insertOne`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': MONGODB_CONFIG.apiKey
                },
                body: JSON.stringify({
                    dataSource: MONGODB_CONFIG.dataSource,
                    database: MONGODB_CONFIG.database,
                    collection: collection,
                    document: document
                })
            });
            return await response.json();
        } catch (error) {
            console.error("❌ MongoDB Insert Error:", error);
            return { error: true };
        }
    }
};
