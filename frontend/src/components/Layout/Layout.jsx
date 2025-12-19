import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

