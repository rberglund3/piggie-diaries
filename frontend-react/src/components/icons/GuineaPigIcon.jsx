function GuineaPigIcon({ size = 48, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse cx="50" cy="58" rx="38" ry="34" fill="currentColor" />
            <ellipse cx="24" cy="30" rx="10" ry="12" fill="currentColor" />
            <ellipse cx="76" cy="30" rx="10" ry="12" fill="currentColor" />
            <ellipse cx="27" cy="31" rx="5" ry="6" fill="var(--color-surface)" />
            <ellipse cx="73" cy="31" rx="5" ry="6" fill="var(--color-surface)" />
            <circle cx="36" cy="55" r="4" fill="var(--color-text)" />
            <circle cx="64" cy="55" r="4" fill="var(--color-text)" />
            <ellipse cx="50" cy="68" rx="7" ry="5" fill="var(--color-accent)" />
        </svg>
    );
}

export default GuineaPigIcon;
