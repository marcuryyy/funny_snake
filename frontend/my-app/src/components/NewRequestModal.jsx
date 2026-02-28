import { useState } from 'react';
import './NewRequestModal.css';

const API_URL = 'http://localhost:8000/api/requests';

const emotionOptions = [
  { value: 'гнев', label: '😠 Гнев' },
  { value: 'раздражение', label: '😤 Раздражение' },
  { value: 'тревога', label: '😰 Тревога' },
  { value: 'разочарование', label: '😞 Разочарование' },
  { value: 'удивление', label: '😮 Удивление' },
  { value: 'спокойствие', label: '😌 Спокойствие' },
];

function NewRequestModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fullName: '',
    object: '',
    phone: '',
    email: '',
    serialNumbers: '',
    deviceType: '',
    emotion: '',
    issue: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Обязательное поле';
    if (!formData.object.trim()) newErrors.object = 'Обязательное поле';
    if (!formData.emotion) newErrors.emotion = 'Обязательное поле';
    if (!formData.issue.trim()) newErrors.issue = 'Обязательное поле';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      onSuccess();
    } catch (error) {
      console.error('Ошибка создания обращения:', error);
      alert('Ошибка при создании обращения: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Новое обращение</h2>
          <button className="btn-close" onClick={onClose} disabled={submitting}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="date">Дата</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emotion">Эмоция *</label>
              <select
                id="emotion"
                name="emotion"
                value={formData.emotion}
                onChange={handleChange}
                className={errors.emotion ? 'error' : ''}
              >
                <option value="">Выберите эмоцию</option>
                {emotionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.emotion && <span className="error-text">{errors.emotion}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="fullName">ФИО *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Иванов Иван Иванович"
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="object">Объект *</label>
              <input
                type="text"
                id="object"
                name="object"
                value={formData.object}
                onChange={handleChange}
                placeholder="Название объекта"
                className={errors.object ? 'error' : ''}
              />
              {errors.object && <span className="error-text">{errors.object}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="deviceType">Устройство</label>
              <input
                type="text"
                id="deviceType"
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                placeholder="Тип устройства"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Телефон</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.ru"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="serialNumbers">Серийный номер</label>
              <input
                type="text"
                id="serialNumbers"
                name="serialNumbers"
                value={formData.serialNumbers}
                onChange={handleChange}
                placeholder="Серийный номер устройства"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="issue">Проблема *</label>
              <textarea
                id="issue"
                name="issue"
                value={formData.issue}
                onChange={handleChange}
                placeholder="Опишите проблему..."
                rows={4}
                className={errors.issue ? 'error' : ''}
              />
              {errors.issue && <span className="error-text">{errors.issue}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Создание...' : 'Создать обращение'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewRequestModal;
