// ==============================================================================
//  🌐 BookingAPI.gs
//  カレンダー予約機能コントローラー
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
   * 予約作成
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
      
      const { datetime, name, email, content, userId } = data;
      
      // バリデーション
      if (!datetime || !name || !email) {
        return this._createCorsResponse({
          success: false,
          error: '必須項目が不足しています（datetime, name, email）'
        });
      }
      
      // メールアドレスの簡易バリデーション
      if (!email.includes('@')) {
        return this._createCorsResponse({
          success: false,
          error: 'メールアドレスの形式が正しくありません'
        });
      }
      
      // 予約作成
      const bookingResult = CalendarService.createBooking(
        datetime, 
        name, 
        email, 
        content || '',
        userId || null
      );
      
      if (!bookingResult.success) {
        return this._createCorsResponse({
          success: false,
          error: bookingResult.error || '予約の作成に失敗しました'
        });
      }
      
      // 確認メール送信
      EmailService.sendConfirmation({
        name: name,
        email: email,
        startTime: bookingResult.startTime,
        endTime: bookingResult.endTime,
        meetLink: bookingResult.meetLink,
        content: content || ''
      });

      // 🔄 予約完了後のLINEメッセージ送信（ユーザー要望）
      if (userId) {
        try {
          // 完了メッセージ
          const completeMsg = {
            type: 'text',
            text: `${name}さん、面談予約ありがとうございます！🎉\n日程: ${new Date(datetime).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}\n\n当日お話しできるのを楽しみにしています！😊`
          };

          // 3つの選択肢
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
                    action: { type: 'uri', label: '📋 他の求人を見る', uri: `https://line-login-gateway.pages.dev/jobs/?uid=${userId}` },
                    style: 'primary', color: '#e85e15', margin: 'md', height: 'sm'
                  },
                  {
                    type: 'button',
                    action: { type: 'message', label: '👂 話を聞いてもらう', text: '話を聞いてほしい' },
                    style: 'secondary', margin: 'sm', height: 'sm'
                  },
                  {
                    type: 'button',
                    action: { type: 'message', label: '💬 相談する', text: '相談したい' },
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
   * CORS対応レスポンスを生成
   * @private
   */
  _createCorsResponse(data) {
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
};
