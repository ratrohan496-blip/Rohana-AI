import React from 'react';

const UserIcon: React.FC = () => (
    <div className="w-9 h-9 rounded-full bg-[var(--c-solid)] flex items-center justify-center flex-shrink-0 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
           <circle cx="12" cy="7" r="4"></circle>
        </svg>
    </div>
);

export default UserIcon;
