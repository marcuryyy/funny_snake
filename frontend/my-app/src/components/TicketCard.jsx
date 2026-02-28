import { useState } from 'react';
import './TicketCard.css';

const STATUS_LABELS = {
  new: { label: 'Новый', color: 'status-new' },
  in_progress: { label: 'В работе', color: 'status-progress' },
  closed: { label: 'Закрыт', color: 'status-closed' },
};

function TicketCard({ ticket, onSelect }) {
  const status = ticket.status || 'new';
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.new;

  return (
    <div className="ticket-card" onClick={() => onSelect(ticket)}>
      <div className="ticket-header">
        <span className={`status-badge ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        <span className="emotion-badge">
          {ticket.emotion}
        </span>
      </div>
      <h3 className="ticket-issue">{ticket.issue}</h3>
      <p className="ticket-name">{ticket.fullName}</p>
      <p className="ticket-object">{ticket.object}</p>
      <div className="ticket-footer">
        {ticket.phone && <span className="ticket-phone">{ticket.phone}</span>}
        <span className="ticket-date">{ticket.date}</span>
      </div>
    </div>
  );
}

export default TicketCard;
