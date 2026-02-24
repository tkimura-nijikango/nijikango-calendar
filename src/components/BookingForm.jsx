import { useState, useMemo } from 'react';

/**
 * 予約フォームコンポーネント
 * 名前・電話番号・メールアドレスを入力
 */
export default function BookingForm({
    selectedTime,
    onSubmit,
    onBack,
    isSubmitting
}) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
    });
    const [errors, setErrors] = useState({});

    // 選択時間をフォーマット
    const formattedTime = useMemo(() => {
        if (!selectedTime) return '';
        const date = new Date(selectedTime);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        // 1時間後の終了時間
        const endDate = new Date(date.getTime() + 60 * 60 * 1000);
        const endHours = String(endDate.getHours()).padStart(2, '0');
        const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
        return `${year}年${month}月${day}日（${dayOfWeek}） ${hours}:${minutes}〜${endHours}:${endMinutes}`;
    }, [selectedTime]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // エラーをクリア
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'お名前を入力してください';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = '電話番号を入力してください';
        } else if (!/^0[789]0\d{8}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
            newErrors.phone = '正しい携帯電話番号を入力してください（例: 09012345678）';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'メールアドレスを入力してください';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '正しいメールアドレスを入力してください';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        onSubmit({
            datetime: selectedTime,
            name: formData.name.trim(),
            phone: formData.phone.replace(/[-\s]/g, '').trim(),
            email: formData.email.trim(),
        });
    };

    return (
        <div className="fade-in">
            <button className="back-btn" onClick={onBack}>
                ← 時間を選び直す
            </button>

            <div className="card">
                <h2 className="card__title">📝 ご予約情報</h2>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="form__selected-time">
                        {formattedTime}
                    </div>

                    <div className="form__group">
                        <label className="form__label form__label--required" htmlFor="name">
                            お名前
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form__input"
                            placeholder="山田 太郎"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                        {errors.name && <span className="form__error">{errors.name}</span>}
                    </div>

                    <div className="form__group">
                        <label className="form__label form__label--required" htmlFor="phone">
                            電話番号
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className="form__input"
                            placeholder="09012345678"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                        {errors.phone && <span className="form__error">{errors.phone}</span>}
                    </div>

                    <div className="form__group">
                        <label className="form__label form__label--required" htmlFor="email">
                            メールアドレス
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form__input"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                        {errors.email && <span className="form__error">{errors.email}</span>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn--primary btn--full btn--lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner"></span>
                                予約中...
                            </>
                        ) : (
                            '予約を確定する'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
