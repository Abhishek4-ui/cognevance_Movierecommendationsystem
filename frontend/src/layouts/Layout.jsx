import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 relative selection:bg-electric-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-hero-glow pointer-events-none z-0" />
      <Navbar />
      <main className="flex-grow pt-20 z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
