// ==============================================================================
//  🌐 BookingAPI.gs
//  Webアプリ エントリポイント（CORS対応）
// ==============================================================================

/**
 * GETリクエスト - 空き時間取得
 * @param {Object} e - リクエストイベント
 */
function doGet(e) {
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
    
    return createCorsResponse(response);
    
  } catch (error) {
    console.error('doGet error:', error);
    return createCorsResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * POSTリクエスト - 予約作成
 * @param {Object} e - リクエストイベント
 */
function doPost(e) {
  try {
    // リクエストボディをパース
    const data = JSON.parse(e.postData.contents);
    
    const { datetime, name, email, content, userId } = data;
    
    // バリデーション（contentは任意なので必須チェックから除外）
    if (!datetime || !name || !email) {
      return createCorsResponse({
        success: false,
        error: '必須項目が不足しています（datetime, name, email）'
      });
    }
    
    // メールアドレスの簡易バリデーション
    if (!email.includes('@')) {
      return createCorsResponse({
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
      return createCorsResponse({
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
    
    return createCorsResponse({
      success: true,
      eventId: bookingResult.eventId,
      meetLink: bookingResult.meetLink,
      startTime: bookingResult.startTime,
      endTime: bookingResult.endTime
    });
    
  } catch (error) {
    console.error('doPost error:', error);
    return createCorsResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * CORS対応レスポンスを生成
 * @param {Object} data - レスポンスデータ
 * @returns {TextOutput} CORS対応のJSONレスポンス
 */
function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // CORSヘッダーを追加
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return output;
}

/**
 * OPTIONSリクエスト - CORSプリフライト対応
 * @param {Object} e - リクエストイベント
 */
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  output.setHeader('Access-Control-Max-Age', '3600');
  return output;
}

// ==============================================================================
//  🔧 ユーティリティ関数（テスト・デバッグ用）
// ==============================================================================

/**
 * 空きスロット取得テスト
 */
function testGetSlots() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  
  const slots = CalendarService.getAvailableSlots(startDate, endDate);
  console.log('Available slots:', JSON.stringify(slots, null, 2));
}

/**
 * 予約作成テスト
 */
function testCreateBooking() {
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 3);
  testDate.setHours(14, 0, 0, 0);
  
  const result = CalendarService.createBooking(
    testDate.toISOString(),
    'テスト太郎',
    'test@example.com',
    '' // 話す内容は空でOK
  );
  
  console.log('Booking result:', JSON.stringify(result, null, 2));
}

/**
 * 設定確認テスト
 */
function testConfig() {
  const config = ConfigManager.getAll();
  console.log('Current config:', JSON.stringify(config, null, 2));
}
