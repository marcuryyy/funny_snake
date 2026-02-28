import { useState, useEffect } from 'react';
import './TicketDetail.css';

const API_URL = 'http://localhost:8000/api/sendMail';

function TicketDetail({ ticket, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const defaultSubject = `Ответ на обращение: ${ticket.issue.substring(0, 50)}${ticket.issue.length > 50 ? '...' : ''}`;
    setSubject(defaultSubject);
    setBody(ticket.letterText || '');
    setLoading(false);
  }, [ticket]);

  const handleSendMail = async () => {
    if (!subject.trim()) {
      alert('Введите тему письма');
      return;
    }
    if (!body.trim()) {
      alert('Введите текст письма');
      return;
    }
    if (!ticket.email) {
      alert('У клиента не указан email');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_emails: [ticket.email],
          subject,
          body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка HTTP: ${response.status}`);
      }

      alert('Письмо отправлено');
      onClose();
    } catch (error) {
      console.error('Ошибка отправки письма:', error);
      alert(`Ошибка при отправке: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="ticket-detail-overlay" onClick={onClose}>
        <div className="ticket-detail">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-overlay" onClick={onClose}>
      <div className="ticket-detail" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-detail-header">
          <h2>Обращение #{ticket.id}</h2>
          <button className="btn-close" onClick={onClose} disabled={sending}>
            Закрыть
          </button>
        </div>

        <div className="ticket-info-grid">
          <div className="info-item full-width">
            <label>ФИО:</label>
            <span>{ticket.fullName}</span>
          </div>
          <div className="info-item">
            <label>Объект:</label>
            <span>{ticket.object}</span>
          </div>
          <div className="info-item">
            <label>Телефон:</label>
            <span>{ticket.phone || '—'}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{ticket.email || '—'}</span>
          </div>
          <div className="info-item">
            <label>Устройство:</label>
            <span>{ticket.deviceType}</span>
          </div>
          <div className="info-item">
            <label>Заводской номер:</label>
            <span>{ticket.factoryNumber || '—'}</span>
          </div>
          <div className="info-item">
            <label>Эмоция:</label>
            <span className="emotion-badge-detail">{ticket.emotion}</span>
          </div>
          <div className="info-item">
            <label>Дата:</label>
            <span>{ticket.date}</span>
          </div>
          <div className="info-item full-width">
            <label>Проблема:</label>
            <span className="issue-text">{ticket.issue}</span>
          </div>
        </div>

        <div className="mail-section">
          <h3>Ответ на обращение</h3>
          
          <div className="form-group">
            <label htmlFor="subject">Тема письма</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Тема письма"
              className="input-field"
              disabled={sending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">Текст письма</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Текст письма..."
              rows={10}
              className="textarea-field"
              disabled={sending}
            />
          </div>

          <div className="action-buttons">
            <button
              className="btn-send"
              onClick={handleSendMail}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {sending ? 'Отправка...' : 'Отправить письмо'}
            </button>
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={sending}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;
