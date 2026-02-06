// ==============================================================================
//  📧 EmailService.gs
//  確認メール送信サービス
// ==============================================================================

const EmailService = {
  /**
   * 予約確認メールを送信
   * @param {Object} data - 予約データ
   */
  sendConfirmation(data) {
    const { name, email, startTime, endTime, meetLink, content } = data;
    
    const startDate = new Date(startTime);
    const formattedDate = this._formatDateTime(startDate);
    
    const subject = `【ニジ看護】面談予約が完了しました - ${formattedDate}`;
    
    let body = `${name}様

この度は面談予約をいただき、誠にありがとうございます。

■ 予約詳細
━━━━━━━━━━━━━━━━━━━━━━
日時：${formattedDate}
━━━━━━━━━━━━━━━━━━━━━━`;

    if (meetLink) {
      body += `

■ Google Meet
${meetLink}
当日は上記リンクからご参加ください。`;
    }

    if (content) {
      body += `

■ ご相談内容
${content}`;
    }

    body += `

━━━━━━━━━━━━━━━━━━━━━━

ご不明な点がございましたら、お気軽にご連絡ください。
当日お話できることを楽しみにしております！

──────────────────────
ニジ看護
──────────────────────`;

    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body
      });
      console.log('Confirmation email sent to:', email);
    } catch (e) {
      console.error('Failed to send email:', e);
    }
  },

  /**
   * 日時をフォーマット
   * @private
   */
  _formatDateTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = dayNames[date.getDay()];
    
    return `${year}年${month}月${day}日（${dayOfWeek}） ${hours}:${minutes}`;
  }
};
