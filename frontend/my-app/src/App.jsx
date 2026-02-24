import React, { useState, useEffect } from 'react';

const emptyForm = {
  date: '',
  fullName: '',
  object: '',
  phone: '',
  email: '',
  serialNumbers: '',
  deviceType: '',
  emotion: '',
  issue: ''
};

export default function RequestsTable() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/requests');
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const createdRecord = await response.json();
      
      setRecords([...records, createdRecord]);
      setFormData(emptyForm); 
    } catch (error) {
      console.error("Ошибка при сохранении данных:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Журнал обращений</h2>

      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Добавить новую запись</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
          <input type="text" name="fullName" placeholder="ФИО" value={formData.fullName} onChange={handleInputChange} required />
          <input type="text" name="object" placeholder="Объект" value={formData.object} onChange={handleInputChange} required />
          <input type="tel" name="phone" placeholder="Телефон" value={formData.phone} onChange={handleInputChange} />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
          <input type="text" name="serialNumbers" placeholder="Заводские номера" value={formData.serialNumbers} onChange={handleInputChange} />
          <input type="text" name="deviceType" placeholder="Тип приборов" value={formData.deviceType} onChange={handleInputChange} />
          <select name="emotion" value={formData.emotion} onChange={handleInputChange} required>
            <option value="" disabled>Эмоциональный окрас</option>
            <option value="Позитивный">Позитивный</option>
            <option value="Нейтральный">Нейтральный</option>
            <option value="Негативный">Негативный</option>
            <option value="Агрессивный">Агрессивный</option>
          </select>
          <input type="text" name="issue" placeholder="Суть вопроса" value={formData.issue} onChange={handleInputChange} style={{ flexGrow: 1 }} required />
          
          <button type="submit" style={{ padding: '5px 15px', cursor: 'pointer' }}>Добавить</button>
        </form>
      </div>

      {loading ? (
        <p>Загрузка данных...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#080303ff', borderBottom: '2px solid #ddd', color: '#fff' }}>
              <th style={thStyle}>Дата</th>
              <th style={thStyle}>ФИО</th>
              <th style={thStyle}>Объект</th>
              <th style={thStyle}>Телефон</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Заводские номера</th>
              <th style={thStyle}>Тип приборов</th>
              <th style={thStyle}>Эмоциональный окрас</th>
              <th style={thStyle}>Суть вопроса</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '10px' }}>Нет записей</td>
              </tr>
            ) : (
              records.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{record.date}</td>
                  <td style={tdStyle}>{record.fullName}</td>
                  <td style={tdStyle}>{record.object}</td>
                  <td style={tdStyle}>{record.phone}</td>
                  <td style={tdStyle}>{record.email}</td>
                  <td style={tdStyle}>{record.serialNumbers}</td>
                  <td style={tdStyle}>{record.deviceType}</td>
                  <td style={tdStyle}>{record.emotion}</td>
                  <td style={tdStyle}>{record.issue}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = { padding: '10px', border: '1px solid #ddd' };
const tdStyle = { padding: '10px', border: '1px solid #ddd' };