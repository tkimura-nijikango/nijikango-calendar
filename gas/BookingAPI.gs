// ==============================================================================
//  🌐 BookingAPI.gs
//  カレンダー予約機能コントローラー（name/email不要・面談予約シート対応版）
// ==============================================================================

const BookingAPI = {
  /**
   * 空き時間を取得
   * @param {Object} e - リクエストイベント
   */
  handleGetSlots(e) {
    try {
      const params = e.parameter || {};
      const userId = params.userId || null;

      // 取得期間を計算
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // 翌日から
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      const daysAhead = ConfigManager.get('DAYS_AHEAD', userId);
      endDate.setDate(endDate.getDate() + daysAhead);

      // 空きスロットを取得
      const slots = CalendarService.getAvailableSlots(startDate, endDate, userId);

      const response = {
        success: true,
        slots: slots,
        config: {
          slotDuration: ConfigManager.get('SLOT_DURATION_MINUTES', userId),
          timezone: ConfigManager.get('TIMEZONE', userId),
          ownerName: ConfigManager.get('OWNER_NAME', userId)
        }
      };

      return this._createCorsResponse(response);

    } catch (error) {
      console.error('handleGetSlots error:', error);
      return this._createCorsResponse({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * 予約作成（name/email不要 → userIdからスプレッドシートで取得）
   * @param {Object} e - リクエストイベント
   */
  handleCreateBooking(e) {
    try {
      // リクエストボディをパース
      let data;
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return this._createCorsResponse({ success: false, error: 'JSON parse error' });
      }

      const { datetime, userId } = data;

      // バリデーション
      if (!datetime) {
        return this._createCorsResponse({
          success: false,
          error: '日時が指定されていません'
        });
      }

      if (!userId) {
        return this._createCorsResponse({
          success: false,
          error: 'ユーザーIDが指定されていません'
        });
      }

      // ユーザー情報をスプレッドシートから取得
      let userName = 'ゲスト';
      let userEmail = '';
      let userPhone = '';
      try {
        const user = SheetManager.getUser(userId);
        if (user) {
          userName = user['本名'] || user['LINE名'] || 'ゲスト';
          userEmail = user['メール'] || '';
          userPhone = user['電話番号'] || '';
        }
      } catch (userErr) {
        emergencyLog(`⚠️ User lookup failed for ${userId}: ${userErr.toString()}`);
      }

      // Googleカレンダーに予約作成
      const bookingResult = CalendarService.createBooking(
        datetime,
        userName,
        userEmail,
        '',
        userId
      );

      if (!bookingResult.success) {
        return this._createCorsResponse({
          success: false,
          error: bookingResult.error || '予約の作成に失敗しました'
        });
      }

      // 面談予約シートに書き込み
      this._saveToBookingSheet(userId, userName, userEmail, userPhone, datetime, bookingResult);

      // 確認メール送信（メールがある場合のみ）
      if (userEmail) {
        try {
          EmailService.sendConfirmation({
            name: userName,
            email: userEmail,
            startTime: bookingResult.startTime,
            endTime: bookingResult.endTime,
            meetLink: bookingResult.meetLink,
            content: ''
          });
        } catch (emailErr) {
          emergencyLog(`⚠️ Email send failed: ${emailErr.toString()}`);
        }
      }

      // 予約完了後のLINEメッセージ送信
      if (userId) {
        try {
          const dateObj = new Date(datetime);
          const dateStr = dateObj.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });

          const completeMsg = {
            type: 'text',
            text: `${userName}さん、面談予約ありがとうございます！🎉\n日程: ${dateStr}\n\n当日お話しできるのを楽しみにしています！😊`
          };

          const nextActionMsg = {
            type: 'flex',
            altText: '次のステップ',
            contents: {
              type: 'bubble',
              size: 'kilo',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: '面談までの間、どうしますか？', weight: 'bold', size: 'sm', align: 'center' },
                  {
                    type: 'button',
                    action: { type: 'uri', label: '📋 他の求人を見る', uri: `https://nijikango-jobs.pages.dev/?uid=${userId}` },
                    style: 'primary', color: '#f88caa', margin: 'md', height: 'sm'
                  },
                  {
                    type: 'button',
                    action: { type: 'message', label: '👂 状況を整理する', text: '状況整理チャット' },
                    style: 'secondary', margin: 'sm', height: 'sm'
                  },
                  {
                    type: 'button',
                    action: { type: 'message', label: '💬 悩みを相談する', text: '悩み相談チャット' },
                    style: 'secondary', margin: 'sm', height: 'sm'
                  }
                ],
                paddingAll: '15px'
              }
            }
          };

          LineClient.push(userId, [completeMsg, nextActionMsg]);
        } catch (lineError) {
          console.error('Failed to send LINE completion message:', lineError);
        }
      }

      // ユーザー管理シートのフェーズ更新
      try {
        SheetManager.updateUser(userId, {
          [CONFIG.USERS_COL.PHASE[0]]: CONFIG.PHASE.APPOINTMENT_BOOKED,
          [CONFIG.USERS_COL.STATUS[0]]: CONFIG.STATUS.APPOINTMENT_BOOKED,
          [CONFIG.USERS_COL.SCHEDULED_DATE[0]]: new Date(datetime)
        });
      } catch (updateErr) {
        emergencyLog(`⚠️ User phase update failed: ${updateErr.toString()}`);
      }

      return this._createCorsResponse({
        success: true,
        eventId: bookingResult.eventId,
        meetLink: bookingResult.meetLink,
        startTime: bookingResult.startTime,
        endTime: bookingResult.endTime
      });

    } catch (error) {
      console.error('handleCreateBooking error:', error);
      return this._createCorsResponse({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * 面談予約シートに書き込み
   * @private
   */
  _saveToBookingSheet(userId, userName, email, phone, datetime, bookingResult) {
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      let sheet = ss.getSheetByName('面談予約');

      // シートがなければ作成
      if (!sheet) {
        sheet = ss.insertSheet('面談予約');
        sheet.appendRow([
          '予約日時', '予約作成日', 'LINEID', '氏名', 'メール', '電話番号',
          '開始時間', '終了時間', 'Meet URL', 'カレンダーイベントID', 'ステータス'
        ]);
        // ヘッダー行の書式設定
        sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
        emergencyLog('📅 面談予約シートを新規作成しました');
      }

      const startTime = bookingResult.startTime ? new Date(bookingResult.startTime) : new Date(datetime);
      const endTime = bookingResult.endTime ? new Date(bookingResult.endTime) : new Date(new Date(datetime).getTime() + 60 * 60 * 1000);

      sheet.appendRow([
        new Date(datetime),           // 予約日時
        new Date(),                    // 予約作成日
        userId,                        // LINEID
        userName,                      // 氏名
        email,                         // メール
        phone,                         // 電話番号
        startTime,                     // 開始時間
        endTime,                       // 終了時間
        bookingResult.meetLink || '',  // Meet URL
        bookingResult.eventId || '',   // カレンダーイベントID
        '予約済み'                      // ステータス
      ]);

      emergencyLog(`📅 面談予約をシートに保存: ${userName} (${userId}) - ${datetime}`);
    } catch (sheetErr) {
      emergencyLog(`❌ 面談予約シート書き込みエラー: ${sheetErr.toString()}`);
    }
  },

  /**
   * CORS対応レスポンスを生成
   * @private
   */
  _createCorsResponse(data) {
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
};
