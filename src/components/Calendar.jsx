import { useState, useMemo } from 'react';

/**
 * カレンダーコンポーネント
 * 空き日をハイライト表示し、日付選択を可能に
 */
export default function Calendar({ slots, selectedDate, onSelectDate }) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    // 空きがある日付のSet
    const availableDates = useMemo(() => {
        const dates = new Set();
        slots.forEach(slot => {
            dates.add(slot.date);
        });
        return dates;
    }, [slots]);

    // カレンダーの日付を生成
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // 月の最初の日の曜日（0=日曜）
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        // 月の最終日
        const lastDate = new Date(year, month + 1, 0).getDate();

        const days = [];

        // 前月の空白
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ date: null, type: 'empty' });
        }

        // 当月の日付
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 当日予約ブロック判定
        const now = new Date();
        const todayDayOfWeek = now.getDay(); // 0=日, 6=土
        const isTodayBlocked = now.getHours() >= 20 || todayDayOfWeek === 0 || todayDayOfWeek === 6;

        for (let day = 1; day <= lastDate; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDateStr(date);

            let type = 'normal';

            if (date < today) {
                type = 'past';
            } else if (date.getTime() === today.getTime() && isTodayBlocked) {
                type = 'past';
            } else if (availableDates.has(dateStr)) {
                type = 'available';
            } else if (date.getTime() === today.getTime()) {
                type = 'today';
            } else {
                type = 'unavailable';
            }

            days.push({
                date: dateStr,
                day,
                type,
                isToday: date.getTime() === today.getTime(),
                isSelected: dateStr === selectedDate,
            });
        }

        return days;
    }, [currentMonth, availableDates, selectedDate]);

    const monthLabel = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        return `${year}年${month}月`;
    }, [currentMonth]);

    const canGoPrev = useMemo(() => {
        const today = new Date();
        return currentMonth > new Date(today.getFullYear(), today.getMonth(), 1);
    }, [currentMonth]);

    const canGoNext = useMemo(() => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 90);
        return currentMonth < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        if (day.type !== 'past' && day.type !== 'empty') {
            onSelectDate(day.date);
        }
    };

    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <div className="calendar">
            <div className="calendar__header">
                <button
                    className="calendar__nav-btn"
                    onClick={handlePrevMonth}
                    disabled={!canGoPrev}
                    aria-label="前月"
                >
                    ◀
                </button>
                <span className="calendar__month">{monthLabel}</span>
                <button
                    className="calendar__nav-btn"
                    onClick={handleNextMonth}
                    disabled={!canGoNext}
                    aria-label="翌月"
                >
                    ▶
                </button>
            </div>

            <div className="calendar__weekdays">
                {weekdays.map((day, index) => (
                    <div
                        key={day}
                        className={`calendar__weekday ${index === 0 || index === 6 ? 'calendar__weekday--weekend' : ''}`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar__days">
                {calendarDays.map((day, index) => (
                    <button
                        key={index}
                        className={`calendar__day 
              ${day.type === 'empty' ? 'calendar__day--empty' : ''}
              ${day.type === 'past' ? 'calendar__day--past' : ''}
              ${day.type === 'available' ? 'calendar__day--available' : ''}
              ${day.type === 'unavailable' ? 'calendar__day--unavailable' : ''}
              ${day.isToday ? 'calendar__day--today' : ''}
              ${day.isSelected ? 'calendar__day--selected' : ''}
            `}
                        onClick={() => day.date && handleDayClick(day)}
                        disabled={day.type === 'empty' || day.type === 'past'}
                    >
                        {day.day || ''}
                    </button>
                ))}
            </div>
        </div>
    );
}

function formatDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
