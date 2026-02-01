// ==============================================================================
//  🌐 API クライアント
//  GASバックエンドとの通信
// ==============================================================================

// GAS WebアプリのURL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbyW2DFQ1EihC98tpz1tH0kvs-KUYc8byTizvPoedhosEp9lHP-Xyi9lywzuEfDk29qMlg/exec';

// モックデータを使用するかどうか
// GAS側のWebアプリがCORS対応したらfalseに変更
const USE_MOCK = false;

/**
 * 空き時間を取得
 * @param {string} userId - 将来のマルチユーザー対応用
 * @returns {Promise<Object>} 空きスロット情報
 */
export async function getAvailableSlots(userId = null) {
    if (USE_MOCK) {
        return getMockSlots();
    }

    const url = new URL(API_BASE_URL);
    // Main.gsでのルーティング用
    url.searchParams.append('action', 'get_slots');

    if (userId) {
        url.searchParams.append('userId', userId);
    }

    console.log('[API] Fetching slots from:', url.toString());

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        console.log('[API] Response status:', response.status);
        console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Error response:', errorText);
            throw new Error(`空き時間の取得に失敗しました (status: ${response.status})`);
        }

        const data = await response.json();
        console.log('[API] Received data:', data);
        return data;
    } catch (error) {
        console.error('[API Error] getAvailableSlots:', error);
        throw error;
    }
}

/**
 * 予約を作成
 * @param {Object} bookingData - 予約データ
 * @param {string} bookingData.datetime - ISO8601形式の日時
 * @param {string} bookingData.name - 予約者名
 * @param {string} bookingData.email - メールアドレス
 * @param {string} bookingData.content - MTG内容（任意）
 * @param {string} userId - 将来のマルチユーザー対応用
 * @returns {Promise<Object>} 予約結果
 */
export async function createBooking(bookingData, userId = null) {
    if (USE_MOCK) {
        return getMockBookingResult(bookingData);
    }

    console.log('[API] Creating booking at:', API_BASE_URL);
    console.log('[API] Booking data:', { ...bookingData, userId });

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                ...bookingData,
                userId,
            }),
        });

        console.log('[API] Response status:', response.status);
        console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('[API] Response text:', text);

        try {
            const data = JSON.parse(text);
            console.log('[API] Parsed booking result:', data);
            return data;
        } catch (e) {
            console.error('[API] JSON parse error:', e);
            console.error('[API] Raw text:', text);
            throw new Error('予約の作成に失敗しました');
        }
    } catch (error) {
        console.error('[API Error] createBooking:', error);
        throw error;
    }
}

// ==============================================================================
//  モックデータ（開発用） - アノキャリア仕様: 土曜除外、11-20時
// ==============================================================================

function getMockSlots() {
    const slots = [];
    const now = new Date();

    // 30日分のスロットを生成
    for (let day = 1; day <= 30; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        date.setHours(0, 0, 0, 0);

        const dayOfWeek = date.getDay();

        // 土曜日（6）を除外
        if (dayOfWeek === 6) continue;

        // 11:00〜20:00のスロット（30分間隔でランダムに空きを作成）
        for (let hour = 11; hour < 20; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // 70%の確率で空き
                if (Math.random() > 0.3) {
                    const slotDate = new Date(date);
                    slotDate.setHours(hour, minute, 0, 0);

                    slots.push({
                        date: formatDate(slotDate),
                        time: formatTime(slotDate),
                        datetime: slotDate.toISOString(),
                    });
                }
            }
        }
    }

    return {
        success: true,
        slots,
        config: {
            slotDuration: 30,
            timezone: 'Asia/Tokyo',
            ownerName: 'アノキャリア'
        },
    };
}

function getMockBookingResult(bookingData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                eventId: 'mock-event-' + Date.now(),
                meetLink: 'https://meet.google.com/xxx-xxxx-xxx',
                startTime: bookingData.datetime,
                endTime: new Date(new Date(bookingData.datetime).getTime() + 30 * 60 * 1000).toISOString(),
            });
        }, 1500);
    });
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
