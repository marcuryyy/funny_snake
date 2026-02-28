import { useState } from 'react';
import TicketsTable from '../components/TicketsTable';
import TicketDetail from '../components/TicketDetail';
import './TicketsPage.css';

function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <div className="tickets-page">
      <TicketsTable onTicketSelect={setSelectedTicket} />
      {selectedTicket && (
        <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}

export default TicketsPage;
