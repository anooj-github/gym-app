// Wolfpack Google Sheets & Google Apps Script Cloud Sync Module
window.WolfpackCloudSync = {
  DEFAULT_URL: 'https://script.google.com/macros/s/AKfycbx60HlMxGSKoqjDW921Emacb6VLQpZhunNfa40FP3EpM8jqMrwCPc2OrWF6WVhIOZp1/exec',
  scriptUrl: '',
  isSyncing: false,
  autoSyncTimeout: null,

  init() {
    this.scriptUrl = localStorage.getItem('wolfpack_apps_script_url') || this.DEFAULT_URL;
    localStorage.setItem('wolfpack_apps_script_url', this.scriptUrl);
    this.updateStatusBadge();

    // Auto-pull latest synced data from Google Sheets on app startup
    if (this.isConfigured()) {
      setTimeout(() => {
        this.pullFromCloud(true);
      }, 600);
    }
  },

  getScriptUrl() {
    return this.scriptUrl;
  },

  setScriptUrl(url) {
    this.scriptUrl = (url || '').trim();
    localStorage.setItem('wolfpack_apps_script_url', this.scriptUrl);
    this.updateStatusBadge();
  },

  isConfigured() {
    return Boolean(this.scriptUrl && this.scriptUrl.startsWith('https://script.google.com/'));
  },

  updateStatusBadge() {
    const badge = document.getElementById('header-cloud-status');
    if (!badge) return;

    if (this.isConfigured()) {
      badge.innerHTML = `<span class="cloud-dot connected"></span> Google Sheets`;
      badge.className = 'cloud-status-chip connected';
      badge.title = 'Connected to Google Sheets Cloud. Click to manage sync.';
    } else {
      badge.innerHTML = `<span class="cloud-dot local"></span> Local Storage`;
      badge.className = 'cloud-status-chip local';
      badge.title = 'Data stored locally in browser. Click to connect Google Sheets.';
    }
  },

  async testConnection(testUrl = null) {
    const url = testUrl || this.scriptUrl;
    if (!url) {
      throw new Error('Please enter a Google Apps Script Web App URL');
    }

    const pingUrl = url + (url.includes('?') ? '&' : '?') + 'action=ping';
    try {
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (data && data.status === 'success') {
        return true;
      }
      throw new Error(data.message || 'Unexpected response from Google Apps Script');
    } catch (e) {
      console.error('Connection test error:', e);
      throw new Error('Could not connect to Google Apps Script. Ensure deployment is set to "Anyone" and URL is correct.');
    }
  },

  async syncToCloud(silent = false) {
    if (!this.isConfigured()) {
      if (!silent) window.WolfpackApp.showToast('Please connect your Google Sheet URL first', 'warning');
      return false;
    }

    if (this.isSyncing) return;
    this.isSyncing = true;
    this.setSyncingVisual(true);

    try {
      const payload = {
        action: 'syncAllData',
        profile: window.WolfpackTracker.userProfile,
        dailyData: window.WolfpackTracker.dailyData,
        customFoods: JSON.parse(localStorage.getItem('wolfpack_custom_foods') || '[]'),
        exportedAt: new Date().toISOString()
      };

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain avoids CORS preflight on Google Apps Script
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      this.isSyncing = false;
      this.setSyncingVisual(false);

      if (result && result.status === 'success') {
        localStorage.setItem('wolfpack_last_synced', new Date().toLocaleTimeString());
        if (!silent) window.WolfpackApp.showToast('🟢 Synced to Google Sheets successfully!');
        return true;
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (err) {
      this.isSyncing = false;
      this.setSyncingVisual(false);
      console.error('Cloud Sync Error:', err);
      if (!silent) window.WolfpackApp.showToast('Sync error: ' + err.message, 'warning');
      return false;
    }
  },

  async pullFromCloud(silent = false) {
    if (!this.isConfigured()) {
      if (!silent) window.WolfpackApp.showToast('Please configure Google Apps Script URL first', 'warning');
      return false;
    }

    this.isSyncing = true;
    this.setSyncingVisual(true);

    try {
      const pullUrl = this.scriptUrl + (this.scriptUrl.includes('?') ? '&' : '?') + 'action=getAllData';
      const response = await fetch(pullUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const result = await response.json();
      this.isSyncing = false;
      this.setSyncingVisual(false);

      if (result && result.status === 'success' && result.data) {
        const { profile, dailyData, customFoods } = result.data;
        if (profile) window.WolfpackTracker.userProfile = profile;
        if (dailyData && Object.keys(dailyData).length > 0) window.WolfpackTracker.dailyData = dailyData;
        if (customFoods) localStorage.setItem('wolfpack_custom_foods', JSON.stringify(customFoods));

        window.WolfpackTracker.saveState();
        window.FoodDatabase.init();
        window.WolfpackCalendar.render();
        window.WolfpackApp.refreshAll();

        localStorage.setItem('wolfpack_last_synced', new Date().toLocaleTimeString());
        if (!silent) window.WolfpackApp.showToast('☁️ Loaded latest data from Google Sheets!');
        return true;
      } else {
        throw new Error(result.message || 'No data returned from Google Sheets');
      }
    } catch (err) {
      this.isSyncing = false;
      this.setSyncingVisual(false);
      console.error('Pull Error:', err);
      if (!silent) window.WolfpackApp.showToast('Pull error: ' + err.message, 'warning');
      return false;
    }
  },

  triggerAutoSync() {
    if (!this.isConfigured()) return;
    clearTimeout(this.autoSyncTimeout);
    this.autoSyncTimeout = setTimeout(() => {
      this.syncToCloud(true);
    }, 2000);
  },

  setSyncingVisual(isSyncing) {
    const badge = document.getElementById('header-cloud-status');
    if (!badge) return;
    if (isSyncing) {
      badge.innerHTML = `<span class="cloud-spinner"></span> Syncing...`;
    } else {
      this.updateStatusBadge();
    }
  }
};
