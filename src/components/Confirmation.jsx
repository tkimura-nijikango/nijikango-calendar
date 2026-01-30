import { useMemo } from 'react';

/**
 * 予約完了画面コンポーネント
 * Meetリンクと予約詳細を表示
 */
export default function Confirmation({ booking, onNewBooking }) {
    // 日時をフォーマット
    const formattedDateTime = useMemo(() => {
        if (!booking.startTime) return '';
        const date = new Date(booking.startTime);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        return `${year}年${month}月${day}日（${dayOfWeek}）${hours}:${minutes}`;
    }, [booking.startTime]);

    return (
        <div className="confirmation fade-in">
            <div className="confirmation__icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h1 className="confirmation__title">ご予約ありがとうございます！</h1>
            <p className="confirmation__message">
                確認メールをお送りしました。<br />
                当日お話できることを楽しみにしております。
            </p>

            <div className="confirmation__details">
                <div className="confirmation__detail">
                    <span className="confirmation__detail-label">日時</span>
                    <span className="confirmation__detail-value">{formattedDateTime}</span>
                </div>
                <div className="confirmation__detail">
                    <span className="confirmation__detail-label">お名前</span>
                    <span className="confirmation__detail-value">{booking.name}</span>
                </div>
                <div className="confirmation__detail">
                    <span className="confirmation__detail-label">メール</span>
                    <span className="confirmation__detail-value">{booking.email}</span>
                </div>
                {booking.content && (
                    <div className="confirmation__detail">
                        <span className="confirmation__detail-label">ご相談内容</span>
                        <span className="confirmation__detail-value">{booking.content}</span>
                    </div>
                )}
            </div>

            {booking.meetLink && (
                <div className="confirmation__meet-link">
                    <strong>🎥 Google Meet</strong><br />
                    <a href={booking.meetLink} target="_blank" rel="noopener noreferrer">
                        {booking.meetLink}
                    </a>
                </div>
            )}

            <button
                className="btn btn--secondary btn--full"
                onClick={onNewBooking}
            >
                新しい予約をする
            </button>
        </div>
    );
}
