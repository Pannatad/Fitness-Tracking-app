import React from 'react';

const Card = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-4 ${className} ${onClick ? 'cursor-pointer hover:bg-zinc-800/50 transition-colors' : ''}`}
        >
            {children}
        </div>
    );
};

export default Card;
