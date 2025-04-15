import React, { useRef, useEffect } from "react";

interface TextInputProps {
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  focus?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  placeholder,
  className = "",
  onChange,
  onKeyDown,
  focus,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Function to adjust the dimensions of the textarea
  const adjustDimensions = () => {
    const textarea = textareaRef.current;
    const measureDiv = measureRef.current;
    if (!textarea || !measureDiv) return;

    // Handle content for measurement, adding zero-width space for trailing newlines
    let content = textarea.value || textarea.placeholder || "";
    if (content.endsWith("\n")) {
      content += "\u200B"; // Append zero-width space
    }
    measureDiv.textContent = content;

    // Get the computed style of the textarea
    const computedStyle = window.getComputedStyle(textarea);

    // Copy all relevant styles to the measure div
    const stylesToCopy = [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "letterSpacing",
      "wordSpacing",
      "lineHeight",
      "padding",
      "border",
      "boxSizing",
      "whiteSpace",
      "wordBreak",
      "width",
      "minWidth",
      "maxWidth",
    ];

    stylesToCopy.forEach((style) => {
      measureDiv.style[style as any] = computedStyle[style as any];
    });

    // Additional styles for the measure div
    measureDiv.style.display = "inline-block";
    measureDiv.style.visibility = "hidden";
    measureDiv.style.position = "absolute";
    measureDiv.style.left = "-9999px";
    measureDiv.style.width = "auto";

    // Reset textarea dimensions
    textarea.style.height = "auto";
    textarea.style.width = "auto";

    // Set textarea dimensions to match the measure div exactly
    const measureRect = measureDiv.getBoundingClientRect();
    textarea.style.height = `${measureRect.height}px`;
    textarea.style.width = `${measureRect.width}px`;

    // Ensure textarea has the same padding and border
    textarea.style.padding = computedStyle.padding;
    textarea.style.border = computedStyle.border;
  };

  // Adjust dimensions when value changes
  useEffect(() => {
    adjustDimensions();
  }, [value]);

  useEffect(() => {
    if (focus) {
      textareaRef.current?.focus();
    }
  }, [focus]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={measureRef} />
      <textarea
        ref={textareaRef}
        value={value}
        onKeyDown={onKeyDown}
        onChange={handleChange}
        placeholder={placeholder}
        className={`resize-none overflow-hidden ${className}`}
        style={{
          minHeight: "1.5em",
          minWidth: "2em",
          boxSizing: "border-box",
          verticalAlign: "top",
        }}
      />
    </div>
  );
};
