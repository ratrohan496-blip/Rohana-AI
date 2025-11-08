import React from 'react';

const BotIcon: React.FC = () => (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--c-grad-from)] to-[var(--c-grad-to)] flex items-center justify-center flex-shrink-0 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M6.343 4.636l-.707-.707m12.728 10.002l-.707.707M6.343 14.364l-.707.707M12 21v-1m-6.364-1.636l.707-.707M18.364 9.636l.707-.707M12 16a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
    </div>
);

export default BotIcon;
