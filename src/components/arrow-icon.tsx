type ArrowIconProps = {
    direction?: "up-right" | "down" | "left" | "right";
    className?: string;
};

const paths = {
    "up-right": "M5 19 19 5M7 5h12v12",
    down: "M12 4v16m-6-6 6 6 6-6",
    left: "M20 12H4m6-6-6 6 6 6",
    right: "M4 12h16m-6-6 6 6-6 6",
};

export default function ArrowIcon({ direction = "up-right", className = "h-4 w-4" }: ArrowIconProps) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" className={`shrink-0 ${className}`}>
            <path d={paths[direction]} />
        </svg>
    );
}
