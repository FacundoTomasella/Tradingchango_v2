import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-8 mb-24 px-6 py-8 border-t border-neutral-100 dark:border-neutral-900">
      <div className="flex flex-col items-center text-center">
        <p className="text-[10px] font-mono font-bold text-neutral-300 dark:text-neutral-700 uppercase tracking-[0.2em]">
          © {currentYear} TradingChango Pro • v2.5.0-flash
        </p>
      </div>
    </footer>
  );
};

export default Footer;