import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="mt-4 mb-20 py-4 px-6 border-t border-slate-100 dark:border-slate-900 flex justify-center">
      <p className="text-[10px] font-mono font-bold text-slate-300 dark:text-slate-800 uppercase tracking-[0.2em]">
        © {currentYear} TradingChango Pro • v2.5.0
      </p>
    </footer>
  );
};

export default Footer;