import { useState, useMemo } from 'react';

/**
 * 予約フォームコンポーネント
 * 名前・メールを入力（話す内容は任意）
 */
export default function BookingForm({
    selectedTime,
    onSubmit,
    onBack,
    isSubmitting
}) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        content: '',
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
        // 30分後の終了時間
        const endDate = new Date(date.getTime() + 30 * 60 * 1000);
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

        if (!formData.email.trim()) {
            newErrors.email = 'メールアドレスを入力してください';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '正しいメールアドレスを入力してください';
        }

        // content（話す内容）は任意なのでバリデーション不要

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        onSubmit({
            datetime: selectedTime,
            name: formData.name.trim(),
            email: formData.email.trim(),
            content: formData.content.trim(),
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

                    <div className="form__group">
                        <label className="form__label" htmlFor="content">
                            ご相談内容（任意）
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            className="form__textarea"
                            placeholder="事前にご相談されたいことがあればご記入ください"
                            value={formData.content}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
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
