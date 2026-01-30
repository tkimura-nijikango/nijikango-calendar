import { useMemo } from 'react';

/**
 * 時間枠選択コンポーネント
 * 選択した日付の空き時間を表示
 */
export default function TimeSlots({ slots, selectedDate, selectedTime, onSelectTime, onBack }) {
    // 選択された日付のスロットをフィルタリング
    const dateSlots = useMemo(() => {
        return slots.filter(slot => slot.date === selectedDate);
    }, [slots, selectedDate]);

    // 日付をフォーマット
    const formattedDate = useMemo(() => {
        if (!selectedDate) return '';
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        return `${year}年${month}月${day}日（${dayOfWeek}）`;
    }, [selectedDate]);

    return (
        <div className="time-slots fade-in">
            <button className="back-btn" onClick={onBack}>
                ← 日付を選び直す
            </button>

            <div className="time-slots__date">
                {formattedDate}
            </div>

            {dateSlots.length > 0 ? (
                <div className="time-slots__grid">
                    {dateSlots.map((slot) => (
                        <button
                            key={slot.datetime}
                            className={`time-slot ${selectedTime === slot.datetime ? 'time-slot--selected' : ''}`}
                            onClick={() => onSelectTime(slot.datetime)}
                        >
                            {slot.time}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="time-slots__empty">
                    この日に空き時間はありません
                </div>
            )}
        </div>
    );
}
