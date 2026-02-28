import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
