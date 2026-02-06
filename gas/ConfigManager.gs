// ==============================================================================
//  📅 ConfigManager.gs
//  設定管理 - ニジ看護仕様（土曜除外、11-20時）
// ==============================================================================

/**
 * 設定管理オブジェクト
 */
const ConfigManager = {
  // デフォルト設定
  _defaults: {
    CALENDAR_ID: 'ultimatebamboo0407@gmail.com',
    AVAILABLE_START_HOUR: 11,     // 11時から
    AVAILABLE_END_HOUR: 20,       // 20時まで
    SLOT_DURATION_MINUTES: 30,
    DAYS_AHEAD: 30,
    AVAILABLE_DAYS: [0, 1, 2, 3, 4, 5], // 日〜金（土曜=6を除く）
    TIMEZONE: 'Asia/Tokyo',
    OWNER_EMAIL: 'ultimatebamboo0407@gmail.com',
    OWNER_NAME: 'ニジ看護'
  },

  /**
   * 設定を取得
   * @param {string} key - 設定キー
   * @param {string} userId - 将来のマルチユーザー対応用（オプション）
   * @returns {*} 設定値
   */
  get(key, userId = null) {
    // Script PropertiesまたはデフォルトからGET
    const scriptProps = PropertiesService.getScriptProperties();
    const propValue = scriptProps.getProperty(key);
    
    if (propValue !== null) {
      // JSON配列の場合はパース
      if (propValue.startsWith('[')) {
        try {
          return JSON.parse(propValue);
        } catch (e) {
          return propValue;
        }
      }
      // 数値の場合は変換
      if (!isNaN(propValue)) {
        return Number(propValue);
      }
      return propValue;
    }

    return this._defaults[key];
  },

  /**
   * 全設定を取得
   * @param {string} userId - 将来のマルチユーザー対応用
   * @returns {Object} 全設定
   */
  getAll(userId = null) {
    return {
      calendarId: this.get('CALENDAR_ID', userId),
      availableStartHour: this.get('AVAILABLE_START_HOUR', userId),
      availableEndHour: this.get('AVAILABLE_END_HOUR', userId),
      slotDurationMinutes: this.get('SLOT_DURATION_MINUTES', userId),
      daysAhead: this.get('DAYS_AHEAD', userId),
      availableDays: this.get('AVAILABLE_DAYS', userId),
      timezone: this.get('TIMEZONE', userId),
      ownerEmail: this.get('OWNER_EMAIL', userId),
      ownerName: this.get('OWNER_NAME', userId)
    };
  },

  /**
   * 設定を保存（管理者用）
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   */
  set(key, value) {
    const scriptProps = PropertiesService.getScriptProperties();
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    scriptProps.setProperty(key, strValue);
  }
};
