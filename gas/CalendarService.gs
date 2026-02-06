// ==============================================================================
//  📅 CalendarService.gs
//  Googleカレンダー連携 - 空き時間取得・予約作成
// ==============================================================================

const CalendarService = {
  /**
   * 指定期間の空きスロットを取得
   * @param {Date} startDate - 開始日
   * @param {Date} endDate - 終了日
   * @param {string} userId - 将来のマルチユーザー対応用
   * @returns {Array} 空きスロットの配列
   */
  getAvailableSlots(startDate, endDate, userId = null) {
    const config = ConfigManager.getAll(userId);
    const calendar = CalendarApp.getCalendarById(config.calendarId);
    
    if (!calendar) {
      console.error('Calendar not found:', config.calendarId);
      return [];
    }

    // 🚀 高速化: 期間中のイベントを一括取得（N回呼び出し → 1回呼び出し）
    // 期間の開始〜終了までの全イベントを取得しておく
    const periodStart = new Date(startDate);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(endDate);
    periodEnd.setHours(23, 59, 59, 999);

    let allBusyTimes = [];
    try {
      const events = calendar.getEvents(periodStart, periodEnd);
      allBusyTimes = events.map(event => ({
        start: event.getStartTime(),
        end: event.getEndTime()
      }));
    } catch (e) {
      console.error('Error batch fetching events:', e);
    }

    const slots = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // 対応曜日かチェック（土曜=6は除外）
      if (config.availableDays.includes(dayOfWeek)) {
        const daySlots = this._getDaySlotsWithAvailability(
          new Date(currentDate), 
          allBusyTimes, // 一括取得した予定を渡す
          config
        );
        slots.push(...daySlots);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  },

  /**
   * 特定日の空きスロットを取得
   * @private
   */
  _getDaySlotsWithAvailability(date, allBusyTimes, config) {
    const slots = [];
    // allBusyTimesをそのまま判定に使う（日付またぎのチェックは不要、日付範囲外のものは単純にマッチしないだけ）

    for (let hour = config.availableStartHour; hour < config.availableEndHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + config.slotDurationMinutes);

      // 過去の時間帯はスキップ
      if (slotStart <= new Date()) {
        continue;
      }

      // 既存予定と重複しないかチェック
      const isBusy = allBusyTimes.some(busy => 
        slotStart < busy.end && slotEnd > busy.start
      );

      if (!isBusy) {
        slots.push({
          date: this._formatDate(slotStart),
          time: this._formatTime(slotStart),
          datetime: slotStart.toISOString()
        });
      }
    }

    return slots;
  },

  /**
   * 特定日の予定（ビジー時間）を取得
   * @private
   * @deprecated 一括取得(_getAvailableSlots内)に移行したため未使用
   */
  _getBusyTimes(date, calendar) {
    // Legacy support or fallback if needed
    const busyTimes = [];
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    try {
      const events = calendar.getEvents(dayStart, dayEnd);
      events.forEach(event => busyTimes.push({start: event.getStartTime(), end: event.getEndTime()}));
    } catch(e) {}
    return busyTimes;
  },

  /**
   * 予約を作成
   * @param {string} datetime - ISO8601形式の日時
   * @param {string} name - 予約者名
   * @param {string} email - 予約者メール
   * @param {string} content - MTG内容（任意）
   * @param {string} userId - 将来のマルチユーザー対応用
   * @returns {Object} 作成結果
   */
  createBooking(datetime, name, email, content, userId = null) {
    const config = ConfigManager.getAll(userId);
    const calendar = CalendarApp.getCalendarById(config.calendarId);
    
    if (!calendar) {
      return { success: false, error: 'Calendar not found' };
    }

    try {
      const startTime = new Date(datetime);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + config.slotDurationMinutes);

      // 予定タイトル
      const title = `【面談】${name}様`;
      
      // 説明文
      const description = [
        `予約者: ${name}`,
        `メール: ${email}`,
        content ? `ご相談内容: ${content}` : '',
        '',
        '---',
        'ニジ看護予約システムにより作成'
      ].filter(Boolean).join('\n');

      // カレンダーイベント作成
      const event = calendar.createEvent(title, startTime, endTime, {
        description: description,
        guests: email,
        sendInvites: true
      });

      // Google Meetリンク生成を試みる
      let meetLink = null;
      try {
        meetLink = this._addGoogleMeet(event.getId(), config.calendarId);
      } catch (e) {
        console.log('Meet link generation not available:', e.message);
      }

      return {
        success: true,
        eventId: event.getId(),
        meetLink: meetLink,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

    } catch (e) {
      console.error('Error creating booking:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Google Meetリンクを追加
   * @private
   */
  _addGoogleMeet(eventId, calendarId) {
    if (typeof Calendar === 'undefined') {
      return null;
    }

    try {
      const plainEventId = eventId.split('@')[0];
      const event = Calendar.Events.get(calendarId, plainEventId);
      
      const conferenceData = {
        createRequest: {
          requestId: Utilities.getUuid(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };

      event.conferenceData = conferenceData;
      
      const updatedEvent = Calendar.Events.patch(event, calendarId, plainEventId, {
        conferenceDataVersion: 1
      });

      if (updatedEvent.conferenceData && updatedEvent.conferenceData.entryPoints) {
        const videoEntry = updatedEvent.conferenceData.entryPoints.find(
          ep => ep.entryPointType === 'video'
        );
        return videoEntry ? videoEntry.uri : null;
      }
    } catch (e) {
      console.error('Failed to add Google Meet:', e);
    }

    return null;
  },

  /**
   * 日付をフォーマット（YYYY-MM-DD）
   * @private
   */
  _formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 時間をフォーマット（HH:MM）
   * @private
   */
  _formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};
