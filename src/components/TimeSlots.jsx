import { useState, useMemo } from 'react';

/**
 * 時間選択コンポーネント
 * ドロップダウンで1時間枠を選択
 */
export default function TimeSlots({ slots, selectedDate, selectedTime, onSelectTime, onBack }) {
    const [selectedHour, setSelectedHour] = useState('');

    // 1時間枠の選択肢を生成（8:00〜19:00、当日は過ぎた時間を除外）
    const timeOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = selectedDate === todayStr;

        for (let h = 8; h <= 19; h++) {
            // 当日の場合、現在時刻以前のスロットはスキップ
            if (isToday && h <= now.getHours()) continue;

            const startHour = String(h).padStart(2, '0');
            const endHour = String(h + 1).padStart(2, '0');
            options.push({
                value: `${startHour}:00`,
                label: `${startHour}:00 〜 ${endHour}:00`,
            });
        }
        return options;
    }, [selectedDate]);

    // 選択した日付の既存スロットを確認（空きがある時間をハイライト用）
    const availableHours = useMemo(() => {
        const hours = new Set();
        slots.filter(slot => slot.date === selectedDate).forEach(slot => {
            const hour = slot.time.split(':')[0];
            hours.add(hour);
        });
        return hours;
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

    const handleSelect = (e) => {
        const time = e.target.value;
        setSelectedHour(time);
    };

    const handleConfirm = () => {
        if (!selectedHour) return;
        // 日付 + 時間 → datetime文字列を生成
        const datetime = `${selectedDate}T${selectedHour}:00`;
        onSelectTime(datetime);
    };

    return (
        <div className="time-slots fade-in">
            <button className="back-btn" onClick={onBack}>
                ← 日付を選び直す
            </button>

            <div className="time-slots__date">
                {formattedDate}
            </div>

            <div className="time-slots__dropdown">
                <label className="time-slots__label" htmlFor="timeSelect">
                    ご希望の時間帯を選択してください
                </label>
                <select
                    id="timeSelect"
                    className="time-slots__select"
                    value={selectedHour}
                    onChange={handleSelect}
                >
                    <option value="">-- 時間を選択 --</option>
                    {timeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}{availableHours.has(opt.value.split(':')[0]) ? ' ◎' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {selectedHour && (
                <button
                    className="btn btn--primary btn--full"
                    onClick={handleConfirm}
                    style={{ marginTop: '16px' }}
                >
                    この時間で予約する
                </button>
            )}
        </div>
    );
}
