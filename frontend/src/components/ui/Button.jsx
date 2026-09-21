import { Link } from 'react-router-dom';

const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-full whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

const sizes = {
    sm: "text-xs px-4 py-2",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
};

const variants = {
    primary:   "bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md",
    secondary: "bg-secondary hover:bg-secondary-dark text-white shadow-sm hover:shadow-md",
    outline:   "bg-white text-ink border border-gray-200 hover:border-primary hover:text-primary",
    ghost:     "bg-transparent text-ink hover:bg-primary-soft",
    dark:      "bg-ink text-white hover:bg-gray-800",
};

const Button = ({
    variant = 'primary',
    size = 'md',
    to,
    href,
    className = '',
    children,
    ...rest
}) => {
    const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

    if (to) {
        return <Link to={to} className={cls} {...rest}>{children}</Link>;
    }
    if (href) {
        return <a href={href} className={cls} {...rest}>{children}</a>;
    }
    return <button className={cls} {...rest}>{children}</button>;
};

export default Button;
