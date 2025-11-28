import React from 'react';

const Button = ({ children, variant = 'primary', className = '', onClick, icon: Icon, ...props }) => {
    const baseStyles = "rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 active:scale-95";

    const variants = {
        primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        secondary: "border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600",
        ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-3 text-sm",
        lg: "px-6 py-4 text-base",
        icon: "p-3"
    };

    const sizeClass = props.size ? sizes[props.size] : sizes.md;

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {Icon && <Icon size={18} className={children ? "mr-2" : ""} />}
            {children}
        </button>
    );
};

export default Button;
