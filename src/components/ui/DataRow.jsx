import React from 'react';

const DataRow = ({ left, right, subtext, icon: Icon, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0 ${onClick ? 'cursor-pointer group' : ''}`}
        >
            <div className="flex items-center space-x-3">
                {Icon && (
                    <div className="text-zinc-500 group-hover:text-emerald-400 transition-colors">
                        <Icon size={16} />
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-zinc-200 font-medium text-sm">{left}</span>
                    {subtext && <span className="text-zinc-500 text-xs">{subtext}</span>}
                </div>
            </div>
            <div className="text-right">
                {right}
            </div>
        </div>
    );
};

export default DataRow;
