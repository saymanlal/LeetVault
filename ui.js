// LeetVault UI Manager
class LeetVaultUI {
  constructor() {
    this.db = new LeetVaultDB();
    this.overlay = null;
    this.isVisible = false;
    this.isDragging = false;
    this.currentTab = 'add';
    this.dragOffset = { x: 0, y: 0 };
    this.searchDebounceTimer = null;
    this.currentResults = [];
    this.editingId = null;
  }

  async init() {
    await this.db.init();
    this.createOverlay();
    this.attachEventListeners();
    this.setupMessageListener();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'lv-overlay';
    this.overlay.className = 'lv-hidden';
    
    this.overlay.innerHTML = `
      <div class="lv-container">
        <div class="lv-header">
          <div class="lv-drag-handle">
            <svg class="lv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span class="lv-title">LeetVault</span>
          </div>
          <button class="lv-close" title="Close (Alt+Shift+L)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="lv-tabs">
          <button class="lv-tab lv-tab-active" data-tab="add">
            <svg class="lv-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Problem
          </button>
          <button class="lv-tab" data-tab="search">
            <svg class="lv-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search Problems
          </button>
        </div>
        
        <div class="lv-content">
          <div class="lv-tab-content lv-tab-active" data-tab="add">
            <div class="lv-form">
              <div class="lv-form-group">
                <label>Problem Title</label>
                <input type="text" id="lv-title" placeholder="e.g., Two Sum, Valid Parentheses" autocomplete="off">
              </div>
              
              <div class="lv-form-group">
                <label>Problem Description</label>
                <textarea id="lv-description" rows="4" placeholder="Describe the problem statement..."></textarea>
              </div>
              
              <div class="lv-form-group">
                <label>Solution Code</label>
                <textarea id="lv-code" class="lv-code-editor" rows="12" placeholder="Paste your solution here..." spellcheck="false"></textarea>
              </div>
              
              <div class="lv-message" id="lv-add-message"></div>
              
              <div class="lv-form-actions">
                <button id="lv-save-btn" class="lv-btn-primary">
                  <svg class="lv-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  <span id="lv-save-btn-text">Save Problem</span>
                </button>
                <button id="lv-clear-btn" class="lv-btn-secondary">
                  <svg class="lv-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Clear Form
                </button>
              </div>
              
              <div class="lv-stats" id="lv-stats"></div>
              
              <div class="lv-export-section">
                <h4>Export/Import Database</h4>
                <div class="lv-export-actions">
                  <button id="lv-export-btn" class="lv-btn-secondary">
                    <svg class="lv-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export All
                  </button>
                  <button id="lv-import-btn" class="lv-btn-secondary">
                    <svg class="lv-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Import
                  </button>
                </div>
                <input type="file" id="lv-import-file" accept=".json" style="display: none;">
              </div>
            </div>
          </div>
          
          <div class="lv-tab-content" data-tab="search">
            <div class="lv-search-container">
              <div class="lv-form-group">
                <div class="lv-search-wrapper">
                  <svg class="lv-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input type="text" id="lv-search" placeholder="Search problems by title..." autocomplete="off">
                </div>
                <div class="lv-search-info" id="lv-search-info"></div>
              </div>
              
              <div class="lv-results" id="lv-results">
                <div class="lv-empty-state">
                  <svg class="lv-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                  </svg>
                  <p>No problems stored yet</p>
                  <span>Add your first LeetCode solution in the Add Problem tab</span>
                </div>
              </div>
              
              <div class="lv-detail" id="lv-detail">
                <div class="lv-detail-header">
                  <h3 id="lv-detail-title"></h3>
                  <div class="lv-detail-actions">
                    <button id="lv-edit-btn" class="lv-btn-icon" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button id="lv-delete-btn" class="lv-btn-icon lv-btn-danger" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                    <button id="lv-detail-close" class="lv-btn-icon" title="Close">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="lv-detail-body">
                  <div class="lv-detail-section">
                    <h4>Description</h4>
                    <p id="lv-detail-description"></p>
                  </div>
                  <div class="lv-detail-section">
                    <div class="lv-code-header">
                      <h4>Solution</h4>
                      <button id="lv-copy-btn" class="lv-btn-copy">
                        <svg class="lv-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy Code
                      </button>
                    </div>
                    <pre id="lv-detail-code"></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }

  attachEventListeners() {
    this.overlay.querySelector('.lv-close').addEventListener('click', () => this.hide());

    this.overlay.querySelectorAll('.lv-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
    });

    const header = this.overlay.querySelector('.lv-drag-handle');
    header.addEventListener('mousedown', (e) => this.startDrag(e));

    document.getElementById('lv-save-btn').addEventListener('click', () => this.saveProblem());
    document.getElementById('lv-clear-btn').addEventListener('click', () => this.clearForm());
    document.getElementById('lv-export-btn').addEventListener('click', () => this.exportProblems());
    document.getElementById('lv-import-btn').addEventListener('click', () => this.importProblems());

    const searchInput = document.getElementById('lv-search');
    searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

    document.getElementById('lv-detail-close').addEventListener('click', () => this.hideDetail());
    document.getElementById('lv-copy-btn').addEventListener('click', () => this.copyCode());
    document.getElementById('lv-edit-btn').addEventListener('click', () => this.editProblem());
    document.getElementById('lv-delete-btn').addEventListener('click', () => this.deleteProblem());

    this.overlay.querySelectorAll('.lv-tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        if (tab.dataset.tab === 'add') {
          await this.updateStats();
        } else if (tab.dataset.tab === 'search') {
          await this.loadAllResults();
        }
      });
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggle') {
        this.toggle();
      }
    });
  }

  startDrag(e) {
    if (e.target.tagName === 'svg' || e.target.tagName === 'path') return;
    
    this.isDragging = true;
    const rect = this.overlay.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    
    document.addEventListener('mousemove', this.drag);
    document.addEventListener('mouseup', this.stopDrag);
    
    this.overlay.style.cursor = 'grabbing';
  }

  drag = (e) => {
    if (!this.isDragging) return;
    
    requestAnimationFrame(() => {
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
      
      const maxX = window.innerWidth - this.overlay.offsetWidth;
      const maxY = window.innerHeight - this.overlay.offsetHeight;
      
      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));
      
      this.overlay.style.left = boundedX + 'px';
      this.overlay.style.top = boundedY + 'px';
      this.overlay.style.right = 'auto';
      this.overlay.style.bottom = 'auto';
    });
  }

  stopDrag = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.drag);
    document.removeEventListener('mouseup', this.stopDrag);
    this.overlay.style.cursor = 'default';
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    this.overlay.querySelectorAll('.lv-tab').forEach(tab => {
      tab.classList.toggle('lv-tab-active', tab.dataset.tab === tabName);
    });
    
    this.overlay.querySelectorAll('.lv-tab-content').forEach(content => {
      content.classList.toggle('lv-tab-active', content.dataset.tab === tabName);
    });
    
    this.hideDetail();
    
    if (tabName === 'add') {
      this.clearEditMode();
    }
  }

  async saveProblem() {
    const title = document.getElementById('lv-title').value.trim();
    const description = document.getElementById('lv-description').value.trim();
    const code = document.getElementById('lv-code').value;
    
    const messageEl = document.getElementById('lv-add-message');
    
    if (!title) {
      this.showMessage(messageEl, 'Please enter a problem title', 'error');
      return;
    }
    
    if (!description) {
      this.showMessage(messageEl, 'Please enter a problem description', 'error');
      return;
    }
    
    if (!code) {
      this.showMessage(messageEl, 'Please enter a solution code', 'error');
      return;
    }
    
    try {
      if (this.editingId) {
        await this.db.updateProblem(this.editingId, title, description, code);
        this.showMessage(messageEl, 'Problem updated successfully', 'success');
        this.clearEditMode();
      } else {
        await this.db.addProblem(title, description, code);
        this.showMessage(messageEl, 'Problem saved successfully', 'success');
      }
      
      this.clearForm();
      await this.updateStats();
      
      if (this.currentTab === 'search') {
        await this.loadAllResults();
      }
    } catch (error) {
      this.showMessage(messageEl, 'Error saving problem', 'error');
    }
  }

  async editProblem() {
    const detailEl = document.getElementById('lv-detail');
    const problemId = parseInt(detailEl.dataset.currentId);
    
    if (!problemId) return;
    
    try {
      const problem = await this.db.getProblemById(problemId);
      if (!problem) return;
      
      this.switchTab('add');
      
      document.getElementById('lv-title').value = problem.title;
      document.getElementById('lv-description').value = problem.description;
      document.getElementById('lv-code').value = problem.code;
      
      this.editingId = problemId;
      document.getElementById('lv-save-btn-text').textContent = 'Update Problem';
      
      const messageEl = document.getElementById('lv-add-message');
      this.showMessage(messageEl, 'Editing problem - click Update to save changes', 'info');
      
      this.hideDetail();
    } catch (error) {
      console.error('Error loading problem for edit:', error);
    }
  }

  async deleteProblem() {
    const detailEl = document.getElementById('lv-detail');
    const problemId = parseInt(detailEl.dataset.currentId);
    
    if (!problemId) return;
    
    if (!confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
      return;
    }
    
    try {
      await this.db.deleteProblem(problemId);
      
      this.hideDetail();
      
      await this.loadAllResults();
      await this.updateStats();
      
      const messageEl = document.getElementById('lv-add-message');
      this.showMessage(messageEl, 'Problem deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete problem');
    }
  }

  async exportProblems() {
    try {
      const problems = await this.db.exportAll();
      
      const dataStr = JSON.stringify(problems, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leetvault-export-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      const messageEl = document.getElementById('lv-add-message');
      this.showMessage(messageEl, `Exported ${problems.length} problems successfully`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export problems');
    }
  }

  async importProblems() {
    const fileInput = document.getElementById('lv-import-file');
    fileInput.click();
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const problems = JSON.parse(text);
        
        if (!Array.isArray(problems)) {
          throw new Error('Invalid file format');
        }
        
        const count = await this.db.importProblems(problems);
        
        const messageEl = document.getElementById('lv-add-message');
        this.showMessage(messageEl, `Imported ${count} problems successfully`, 'success');
        
        await this.updateStats();
        if (this.currentTab === 'search') {
          await this.loadAllResults();
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import problems. Please check the file format.');
      }
      
      fileInput.value = '';
    };
  }

  clearEditMode() {
    this.editingId = null;
    document.getElementById('lv-save-btn-text').textContent = 'Save Problem';
  }

  clearForm() {
    document.getElementById('lv-title').value = '';
    document.getElementById('lv-description').value = '';
    document.getElementById('lv-code').value = '';
    const messageEl = document.getElementById('lv-add-message');
    messageEl.textContent = '';
    messageEl.className = 'lv-message';
    this.clearEditMode();
  }

  showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'lv-message lv-message-' + type;
    
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        element.textContent = '';
        element.className = 'lv-message';
      }, 3000);
    }
  }

  async updateStats() {
    const count = await this.db.getCount();
    const statsEl = document.getElementById('lv-stats');
    statsEl.textContent = `Total Problems: ${count.toLocaleString()}`;
  }

  handleSearch(searchTerm) {
    clearTimeout(this.searchDebounceTimer);
    
    this.searchDebounceTimer = setTimeout(async () => {
      if (searchTerm.trim() === '') {
        await this.loadAllResults();
      } else {
        await this.performSearch(searchTerm);
      }
    }, 150);
  }

  async loadAllResults() {
    try {
      const results = await this.db.getAllProblems();
      this.currentResults = results;
      this.displayResults(results);
      this.updateSearchInfo(results.length, results.length);
    } catch (error) {
      console.error('Error loading problems:', error);
    }
  }

  async performSearch(searchTerm) {
    try {
      const results = await this.db.searchProblems(searchTerm);
      this.currentResults = results;
      this.displayResults(results);
      
      const total = await this.db.getCount();
      this.updateSearchInfo(results.length, total);
    } catch (error) {
      console.error('Error searching problems:', error);
    }
  }

  updateSearchInfo(found, total) {
    const infoEl = document.getElementById('lv-search-info');
    infoEl.textContent = `${found.toLocaleString()} of ${total.toLocaleString()} problems`;
  }

  displayResults(results) {
    const resultsEl = document.getElementById('lv-results');
    
    if (results.length === 0) {
      resultsEl.innerHTML = `
        <div class="lv-empty-state">
          <svg class="lv-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <p>No problems found</p>
          <span>Try a different search term or add new problems</span>
        </div>
      `;
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    results.forEach(p => {
      const div = document.createElement('div');
      div.className = 'lv-result-item';
      div.dataset.id = p.id;
      
      const title = document.createElement('div');
      title.className = 'lv-result-title';
      title.textContent = p.title;
      
      const preview = document.createElement('div');
      preview.className = 'lv-result-preview';
      preview.textContent = p.description.substring(0, 100) + (p.description.length > 100 ? '...' : '');
      
      div.appendChild(title);
      div.appendChild(preview);
      
      div.addEventListener('click', () => this.showDetail(p.id));
      
      fragment.appendChild(div);
    });
    
    resultsEl.innerHTML = '';
    resultsEl.appendChild(fragment);
  }

  async showDetail(id) {
    try {
      const problem = await this.db.getProblemById(id);
      if (!problem) return;
      
      document.getElementById('lv-detail-title').textContent = problem.title;
      document.getElementById('lv-detail-description').textContent = problem.description;
      document.getElementById('lv-detail-code').textContent = problem.code;
      
      const detailEl = document.getElementById('lv-detail');
      detailEl.classList.add('lv-detail-visible');
      detailEl.dataset.currentId = id;
    } catch (error) {
      console.error('Error loading problem detail:', error);
    }
  }

  hideDetail() {
    document.getElementById('lv-detail').classList.remove('lv-detail-visible');
  }

  async copyCode() {
    const codeEl = document.getElementById('lv-detail-code');
    const code = codeEl.textContent;
    
    try {
      await navigator.clipboard.writeText(code);
      
      const btn = document.getElementById('lv-copy-btn');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg class="lv-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copied
      `;
      btn.classList.add('lv-btn-copied');
      
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('lv-btn-copied');
      }, 2000);
    } catch (error) {
      console.error('Error copying code:', error);
    }
  }

  show() {
    this.isVisible = true;
    this.overlay.classList.remove('lv-hidden');
    this.updateStats();
  }

  hide() {
    this.isVisible = false;
    this.overlay.classList.add('lv-hidden');
    this.hideDetail();
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

window.LeetVaultUI = LeetVaultUI;