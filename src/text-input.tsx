import React, { useRef, useEffect, useState } from "react";
import { useStaticCallback } from "./hooks";

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
  const [measureDiv, setMeasureDiv] = useState<HTMLDivElement | null>(null);
  const [textareaElement, setTextareaElement] =
    useState<HTMLTextAreaElement | null>(null);

  // Function to adjust the dimensions of the textarea
  const adjustDimensions = useStaticCallback(() => {
    if (!textareaElement || !measureDiv) return;

    // Handle content for measurement, adding zero-width space for trailing newlines
    let content = textareaElement.value || textareaElement.placeholder || "";
    if (content.endsWith("\n")) {
      content += "\u200B"; // Append zero-width space
    }
    measureDiv.textContent = content;

    // Get the computed style of the textarea
    const computedStyle = window.getComputedStyle(textareaElement);

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
    textareaElement.style.height = "auto";
    textareaElement.style.width = "auto";

    // Set textarea dimensions to match the measure div exactly
    const measureRect = measureDiv.getBoundingClientRect();
    textareaElement.style.height = `${measureRect.height}px`;
    textareaElement.style.width = `${measureRect.width}px`;

    // Ensure textarea has the same padding and border
    textareaElement.style.padding = computedStyle.padding;
    textareaElement.style.border = computedStyle.border;
  });

  // Adjust dimensions when value changes
  useEffect(() => {
    console.log("adjusting dimensions");
    adjustDimensions();
  }, [value, className, measureDiv, adjustDimensions]);

  useEffect(() => {
    if (focus) {
      setTimeout(() => {
        textareaElement?.focus();
      }, 100);
    }
  }, [focus, textareaElement]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={setMeasureDiv} />
      <textarea
        ref={setTextareaElement}
        value={value}
        onKeyDown={onKeyDown}
        onChange={handleChange}
        placeholder={placeholder}
        className={`resize-none overflow-hidden ${className}`}
        style={{
          boxSizing: "border-box",
          verticalAlign: "top",
        }}
      />
    </div>
  );
};
