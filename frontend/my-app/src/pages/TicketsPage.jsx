import { useState } from 'react';
import TicketsTable from '../components/TicketsTable';
import TicketDetail from '../components/TicketDetail';
import './TicketsPage.css';

function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);

  const handleTicketSelect = (ticket) => {
    // При открытии тикета меняем статус на "в работе", если он был "открыт"
    if (ticket.task_status === 'OPEN') {
      ticket.task_status = 'IN_PROGRESS';
    }
    setSelectedTicket(ticket);
  };

  const handleStatusChange = (ticketId, newStatus) => {
    // Обновляем статус в списке тикетов
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, task_status: newStatus } : t
    ));
    
    // Если выбран этот тикет, обновляем и его
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, task_status: newStatus });
    }
  };

  return (
    <div className="tickets-page">
      <TicketsTable onTicketSelect={handleTicketSelect} />
      {selectedTicket && (
        <TicketDetail 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default TicketsPage;
