import { useState, useEffect } from 'react';
import './TicketDetail.css';

const API_URL = 'http://localhost:8000/api/sendMail';

const STATUS_OPEN = 'OPEN';
const STATUS_IN_PROGRESS = 'IN_PROGRESS';
const STATUS_CLOSED = 'CLOSED';

const statusLabels = {
  [STATUS_OPEN]: 'Открыто',
  [STATUS_IN_PROGRESS]: 'В работе',
  [STATUS_CLOSED]: 'Закрыто',
};

function TicketDetail({ ticket, onClose, onStatusChange }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskStatus, setTaskStatus] = useState(ticket.task_status || STATUS_OPEN);
  const [hasSentAnswer, setHasSentAnswer] = useState(false);

  useEffect(() => {
    const defaultSubject = `Ответ на обращение: ${ticket.issue.substring(0, 50)}${ticket.issue.length > 50 ? '...' : ''}`;
    setSubject(defaultSubject);
    setBody(ticket.llm_answer || '');
    const initialStatus = ticket.task_status || STATUS_OPEN;
    setTaskStatus(initialStatus);
    
    // Если тикет уже закрыт, помечаем что ответ был отправлен
    if (initialStatus === STATUS_CLOSED) {
      setHasSentAnswer(true);
    }
    
    setLoading(false);
  }, [ticket]);

  const isClosed = taskStatus === STATUS_CLOSED;
  const isReadOnly = isClosed;

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
      const requestBody = {
        to_emails: [ticket.email],
        subject,
        body,
      };

      if (ticket.message_id) {
        requestBody.message_id = ticket.message_id;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка HTTP: ${response.status}`);
      }

      // После отправки меняем статус на CLOSED
      setTaskStatus(STATUS_CLOSED);
      setHasSentAnswer(true);
      if (onStatusChange) {
        onStatusChange(ticket.id, STATUS_CLOSED);
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

  const handleClose = () => {
    // Если закрыли без отправки ответа и тикет был в работе, возвращаем в OPEN
    if (!hasSentAnswer && taskStatus === STATUS_IN_PROGRESS) {
      setTaskStatus(STATUS_OPEN);
      if (onStatusChange) {
        onStatusChange(ticket.id, STATUS_OPEN);
      }
    }
    onClose();
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setTaskStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(ticket.id, newStatus);
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
    <div className="ticket-detail-overlay" onClick={handleClose}>
      <div className="ticket-detail" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-detail-header">
          <h2>Обращение #{ticket.id}</h2>
          <button className="btn-close" onClick={handleClose} disabled={sending}>
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
            <label>Статус:</label>
            <select
              value={taskStatus}
              onChange={handleStatusChange}
              className="status-select"
              disabled={isReadOnly}
            >
              <option value={STATUS_OPEN}>{statusLabels[STATUS_OPEN]}</option>
              <option value={STATUS_IN_PROGRESS}>{statusLabels[STATUS_IN_PROGRESS]}</option>
              <option value={STATUS_CLOSED}>{statusLabels[STATUS_CLOSED]}</option>
            </select>
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

          {isReadOnly && (
            <div className="readonly-notice">
              Обращение закрыто. Изменения недоступны.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="subject">Тема письма</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Тема письма"
              className="input-field"
              disabled={sending || isReadOnly}
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
              disabled={sending || isReadOnly}
            />
          </div>

          <div className="action-buttons">
            <button
              className="btn-send"
              onClick={handleSendMail}
              disabled={sending || !subject.trim() || !body.trim() || isReadOnly}
            >
              {sending ? 'Отправка...' : 'Отправить письмо'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleClose}
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
