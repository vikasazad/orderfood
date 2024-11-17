import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// OTP Input Component
interface OTPInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  className?: string;
}

export const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  (
    { value = "", onChange, length = 6, className, disabled, ...props },
    ref
  ) => {
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleInputChange = (index: number, inputValue: string) => {
      const newValue = value.split("");
      const sanitizedValue = inputValue.replace(/[^0-9]/g, "");
      newValue[index] = sanitizedValue;

      const updatedValue = newValue.join("");
      onChange(updatedValue);

      if (sanitizedValue && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Backspace") {
        if (!value[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
          // Clear the previous value when backspace is pressed
          const newValue = value.split("");
          newValue[index - 1] = "";
          onChange(newValue.join(""));
        } else {
          // Clear current value
          const newValue = value.split("");
          newValue[index] = "";
          onChange(newValue.join(""));
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
      const sanitizedValue = pastedData.replace(/[^0-9]/g, "");

      // Create a new array with the pasted values
      const newValue = Array(length).fill("");
      sanitizedValue.split("").forEach((char, index) => {
        if (index < length) newValue[index] = char;
      });

      onChange(newValue.join(""));

      if (sanitizedValue.length > 0) {
        inputRefs.current[Math.min(sanitizedValue.length, length - 1)]?.focus();
      }
    };

    return (
      <div ref={ref} className={cn("flex gap-2", className)}>
        {Array.from({ length }, (_, i) => (
          <Input
            key={i}
            ref={(el: any) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[i] || ""}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(-1)}
            disabled={disabled}
            className={cn(
              "w-10 h-10 text-center p-0",
              focusedIndex === i &&
                "ring-2 ring-ring ring-offset-2 ring-offset-background",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            {...props}
          />
        ))}
      </div>
    );
  }
);
OTPInput.displayName = "OTPInput";
