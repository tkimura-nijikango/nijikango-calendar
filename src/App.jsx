import { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import TimeSlots from './components/TimeSlots';
import BookingForm from './components/BookingForm';
import Confirmation from './components/Confirmation';
import { getAvailableSlots, createBooking } from './api';

// ステップ定義
const STEPS = {
    CALENDAR: 1,
    TIME_SELECT: 2,
    FORM: 3,
    CONFIRMATION: 4,
};

/**
 * メインアプリケーション
 * アノキャリア予約フロー
 */
export default function App() {
    const [step, setStep] = useState(STEPS.CALENDAR);
    const [slots, setSlots] = useState([]);
    const [ownerName, setOwnerName] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // URLパラメータからユーザーIDを取得
    const userId = new URLSearchParams(window.location.search).get('userId');

    // 空き時間を取得
    useEffect(() => {
        async function fetchSlots() {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getAvailableSlots(userId);
                if (data.success) {
                    setSlots(data.slots || []);
                    if (data.config && data.config.ownerName) {
                        setOwnerName(data.config.ownerName);
                    }
                } else {
                    setError(data.error || '空き時間の取得に失敗しました');
                }
            } catch (err) {
                setError('空き時間の取得に失敗しました。再度お試しください。');
                console.error('Fetch slots error:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSlots();
    }, [userId]);

    // 日付選択
    const handleSelectDate = (date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        setStep(STEPS.TIME_SELECT);
    };

    // 時間選択
    const handleSelectTime = (datetime) => {
        setSelectedTime(datetime);
        setStep(STEPS.FORM);
    };

    // 予約送信
    const handleSubmit = async (formData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createBooking(formData, userId);

            if (result.success) {
                setBooking({
                    ...formData,
                    ...result,
                });
                setStep(STEPS.CONFIRMATION);
            } else {
                setError(result.error || '予約の作成に失敗しました');
            }
        } catch (err) {
            setError('予約の作成に失敗しました。再度お試しください。');
            console.error('Create booking error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 新しい予約を開始
    const handleNewBooking = () => {
        setStep(STEPS.CALENDAR);
        setSelectedDate(null);
        setSelectedTime(null);
        setBooking(null);
        setError(null);
    };

    // 戻る
    const handleBackToCalendar = () => {
        setSelectedDate(null);
        setStep(STEPS.CALENDAR);
    };

    const handleBackToTimeSelect = () => {
        setSelectedTime(null);
        setStep(STEPS.TIME_SELECT);
    };

    // 現在のステップ番号
    const currentStepNumber = () => {
        switch (step) {
            case STEPS.CALENDAR: return 1;
            case STEPS.TIME_SELECT: return 2;
            case STEPS.FORM: return 3;
            case STEPS.CONFIRMATION: return 4;
            default: return 1;
        }
    };

    return (
        <div className="app">
            {/* ヘッダー */}
            <header className="header">
                <img
                    src="/logo.jpg"
                    alt="アノキャリア"
                    className="header__logo"
                />
                <h1 className="header__title">面談予約</h1>
                <p className="header__subtitle">ご都合の良い日時をお選びください</p>
            </header>

            {/* プログレスステップ（確認画面以外） */}
            {step !== STEPS.CONFIRMATION && (
                <div className="progress">
                    <div className={`progress__step ${currentStepNumber() >= 1 ? 'progress__step--completed' : ''} ${currentStepNumber() === 1 ? 'progress__step--active' : ''}`}>1</div>
                    <div className={`progress__line ${currentStepNumber() > 1 ? 'progress__line--completed' : ''}`}></div>
                    <div className={`progress__step ${currentStepNumber() >= 2 ? 'progress__step--completed' : ''} ${currentStepNumber() === 2 ? 'progress__step--active' : ''}`}>2</div>
                    <div className={`progress__line ${currentStepNumber() > 2 ? 'progress__line--completed' : ''}`}></div>
                    <div className={`progress__step ${currentStepNumber() >= 3 ? 'progress__step--completed' : ''} ${currentStepNumber() === 3 ? 'progress__step--active' : ''}`}>3</div>
                </div>
            )}

            {/* エラーメッセージ */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* ローディング */}
            {isLoading && (
                <div className="loading">
                    <div className="loading__spinner"></div>
                    <span>空き時間を取得中...</span>
                </div>
            )}

            {/* メインコンテンツ */}
            {!isLoading && (
                <>
                    {step === STEPS.CALENDAR && (
                        <div className="card fade-in">
                            <h2 className="card__title">📅 日付を選択</h2>
                            <Calendar
                                slots={slots}
                                selectedDate={selectedDate}
                                onSelectDate={handleSelectDate}
                            />
                        </div>
                    )}

                    {step === STEPS.TIME_SELECT && (
                        <div className="card">
                            <TimeSlots
                                slots={slots}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                onSelectTime={handleSelectTime}
                                onBack={handleBackToCalendar}
                            />
                        </div>
                    )}

                    {step === STEPS.FORM && (
                        <BookingForm
                            selectedTime={selectedTime}
                            onSubmit={handleSubmit}
                            onBack={handleBackToTimeSelect}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {step === STEPS.CONFIRMATION && (
                        <div className="card">
                            <Confirmation
                                booking={booking}
                                onNewBooking={handleNewBooking}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
