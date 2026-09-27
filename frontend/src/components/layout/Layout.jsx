import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
