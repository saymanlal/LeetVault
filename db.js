// LeetVault IndexedDB Manager
class LeetVaultDB {
  constructor() {
    this.dbName = 'LeetVaultDB';
    this.version = 1;
    this.storeName = 'problems';
    this.db = null;
    this.initPromise = null;
  }

  init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          objectStore.createIndex('titleLower', 'titleLower', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
    
    return this.initPromise;
  }

  async addProblem(title, description, code) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const problem = {
        title: title,
        titleLower: title.toLowerCase(),
        description: description,
        code: code,
        timestamp: Date.now()
      };
      
      const request = store.add(problem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProblem(id, title, description, code) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const problem = {
        id: id,
        title: title,
        titleLower: title.toLowerCase(),
        description: description,
        code: code,
        timestamp: Date.now()
      };
      
      const request = store.put(problem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProblem(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async searchProblems(searchTerm) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('titleLower');
      
      const results = [];
      const searchLower = searchTerm.toLowerCase();
      const range = IDBKeyRange.bound(searchLower, searchLower + '\uffff');
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.titleLower.includes(searchLower)) {
            results.push(cursor.value);
            if (results.length >= 100) {
              resolve(results);
              return;
            }
          }
          cursor.continue();
        } else {
          results.sort((a, b) => {
            const aIndex = a.titleLower.indexOf(searchLower);
            const bIndex = b.titleLower.indexOf(searchLower);
            if (aIndex !== bIndex) return aIndex - bIndex;
            return b.timestamp - a.timestamp;
          });
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProblems() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          if (results.length >= 100) {
            resolve(results);
            return;
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getProblemById(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCount() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async exportAll() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async importProblems(problems) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let count = 0;
      problems.forEach(p => {
        const problem = {
          title: p.title,
          titleLower: p.title.toLowerCase(),
          description: p.description,
          code: p.code,
          timestamp: p.timestamp || Date.now()
        };
        store.add(problem);
        count++;
      });
      
      transaction.oncomplete = () => resolve(count);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAll() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

window.LeetVaultDB = LeetVaultDB;