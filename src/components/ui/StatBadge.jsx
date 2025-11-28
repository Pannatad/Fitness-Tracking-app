import React from 'react';

const StatBadge = ({ label, value, icon: Icon, color = 'emerald' }) => {
    const colors = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
        zinc: "text-zinc-400 bg-zinc-800 border-zinc-700"
    };

    return (
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colors[color]}`}>
            {Icon && <Icon size={12} />}
            {label && <span className="uppercase tracking-wider opacity-70">{label}</span>}
            <span className="font-bold">{value}</span>
        </div>
    );
};

export default StatBadge;
