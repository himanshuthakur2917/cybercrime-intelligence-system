import * as React from "react";

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "default" | "outline" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default: "bg-blue-600 hover:bg-blue-700 text-white",
  outline:
    "border border-white/20 text-white bg-transparent hover:bg-white/5",
  secondary: "bg-[#1e293b] hover:bg-[#243049] text-white",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition",
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
