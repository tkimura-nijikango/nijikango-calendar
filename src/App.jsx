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
    SUBMITTING: 4,      // 送信中（新規追加）
    CONFIRMATION: 5,
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
    const userId = new URLSearchParams(window.location.search).get('userId') ||
        new URLSearchParams(window.location.search).get('uid');

    // 空き時間を取得
    useEffect(() => {
        async function fetchSlots() {
            console.log('[App] Starting fetchSlots...');
            console.log('[App] userId:', userId);
            setIsLoading(true);
            setError(null);

            try {
                console.log('[App] Calling getAvailableSlots...');
                const data = await getAvailableSlots(userId);
                console.log('[App] getAvailableSlots returned:', data);

                if (data.success) {
                    console.log('[App] Success! Slots:', data.slots?.length || 0, 'items');
                    console.log('[App] Config:', data.config);
                    setSlots(data.slots || []);
                    if (data.config && data.config.ownerName) {
                        setOwnerName(data.config.ownerName);
                    }
                } else {
                    console.error('[App] API returned error:', data.error);
                    setError(data.error || '空き時間の取得に失敗しました');
                }
            } catch (err) {
                console.error('[App] Fetch error:', err);
                console.error('[App] Error stack:', err.stack);
                setError('空き時間の取得に失敗しました。再度お試しください。');
            } finally {
                console.log('[App] fetchSlots completed, isLoading -> false');
                setIsLoading(false);
            }
        }

        console.log('[App] useEffect triggered');
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

    // 予約送信（先に送信中画面を表示し、裏で処理を続ける）
    const handleSubmit = async (formData) => {
        console.log('[App] handleSubmit called with:', formData);
        setIsSubmitting(true);
        setError(null);

        // 先に送信中画面を表示
        setStep(STEPS.SUBMITTING);

        // 1秒待つ（体験のため）
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 予約データを先にセット（Confirmationで使う）
        const tempBooking = {
            ...formData,
            startTime: formData.datetime,
            meetLink: null, // 後で更新される可能性あり
        };
        setBooking(tempBooking);

        // 先にサンクスページを表示
        console.log('[App] Showing confirmation screen');
        setStep(STEPS.CONFIRMATION);
        setIsSubmitting(false);

        // 裏側でAPIリクエストを実行（投げっぱなし）
        console.log('[App] Starting background booking API call...');
        createBooking(formData, userId)
            .then(result => {
                console.log('[App] Background booking result:', result);
                if (result.success) {
                    // 成功したらmeetLinkを更新
                    setBooking(prev => ({
                        ...prev,
                        ...result,
                    }));
                } else {
                    console.error('[App] Background booking failed:', result.error);
                }
            })
            .catch(err => {
                console.error('[App] Background booking error:', err);
            });
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

    // 現在のステップ番号（表示用）
    const currentStepNumber = () => {
        switch (step) {
            case STEPS.CALENDAR: return 1;
            case STEPS.TIME_SELECT: return 2;
            case STEPS.FORM: return 3;
            case STEPS.SUBMITTING: return 3;
            case STEPS.CONFIRMATION: return 4;
            default: return 1;
        }
    };

    return (
        <div className="app">
            {/* ヘッダー */}
            <header className="header">
                <img
                    src="./logo.jpg"
                    alt="アノキャリア"
                    className="header__logo"
                />
                <h1 className="header__title">面談予約</h1>
                <p className="header__subtitle">ご都合の良い日時をお選びください</p>
            </header>

            {/* プログレスステップ（確認画面以外） */}
            {step !== STEPS.CONFIRMATION && step !== STEPS.SUBMITTING && (
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

            {/* ローディング（空き日程取得中） */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-overlay__content">
                        <div className="loading-overlay__spinner"></div>
                        <p className="loading-overlay__text">
                            空き日程を取得中<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                        </p>
                    </div>
                </div>
            )}

            {/* 送信中オーバーレイ */}
            {step === STEPS.SUBMITTING && (
                <div className="loading-overlay">
                    <div className="loading-overlay__content">
                        <div className="loading-overlay__spinner"></div>
                        <p className="loading-overlay__text">
                            送信中<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                        </p>
                    </div>
                </div>
            )}

            {/* メインコンテンツ */}
            {!isLoading && step !== STEPS.SUBMITTING && (
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
