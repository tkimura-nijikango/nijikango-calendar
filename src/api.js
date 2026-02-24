// ==============================================================================
//  🌐 API クライアント
//  GASバックエンドとの通信
// ==============================================================================

// GAS WebアプリのURL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/AKfycbwgGfNXsduo1lZWAAbwJz-xdrAsXp3zTeiOx-KIrvtC4AK_09q7nV-ZYYRxoeIbXBrzqw/exec';

// モックデータを使用するかどうか
const USE_MOCK = false;

/**
 * 空き時間を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<Object>} 空きスロット情報
 */
export async function getAvailableSlots(userId = null) {
    if (USE_MOCK) {
        return getMockSlots();
    }

    const url = new URL(API_BASE_URL);
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
 * 予約を作成（フォームからname/phone/emailを送信）
 * @param {Object} bookingData - 予約データ
 * @param {string} bookingData.datetime - ISO8601形式の日時
 * @param {string} bookingData.name - お名前
 * @param {string} bookingData.phone - 電話番号
 * @param {string} bookingData.email - メールアドレス
 * @param {string} userId - LINE ユーザーID
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
                action: 'create_booking',
                datetime: bookingData.datetime,
                name: bookingData.name || '',
                phone: bookingData.phone || '',
                email: bookingData.email || '',
                userId,
            }),
        });

        console.log('[API] Response status:', response.status);

        const text = await response.text();
        console.log('[API] Response text:', text);

        try {
            const data = JSON.parse(text);
            console.log('[API] Parsed booking result:', data);
            return data;
        } catch (e) {
            console.error('[API] JSON parse error:', e);
            throw new Error('予約の作成に失敗しました');
        }
    } catch (error) {
        console.error('[API Error] createBooking:', error);
        throw error;
    }
}

// ==============================================================================
// モックデータ（開発用）
// ==============================================================================

function getMockSlots() {
    const slots = [];
    const now = new Date();

    for (let day = 1; day <= 30; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        date.setHours(0, 0, 0, 0);

        for (let hour = 9; hour < 21; hour++) {
            if (Math.random() > 0.3) {
                const slotDate = new Date(date);
                slotDate.setHours(hour, 0, 0, 0);

                slots.push({
                    date: formatDate(slotDate),
                    time: formatTime(slotDate),
                    datetime: slotDate.toISOString(),
                });
            }
        }
    }

    return {
        success: true,
        slots,
        config: {
            slotDuration: 60,
            timezone: 'Asia/Tokyo',
            ownerName: 'ニジ看護'
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
                endTime: new Date(new Date(bookingData.datetime).getTime() + 60 * 60 * 1000).toISOString(),
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
