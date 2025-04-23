import React, { useState, useMemo, useEffect } from "react";
import { ToolState } from "./Editor";
import { Card } from "./Card";
import { Field } from "./Field";
import { useStaticCallback } from "./hooks";
import colors from "tailwindcss/colors";
import { Obj } from "./Obj";

const COLORS = {
  black: colors.black,
  gray: colors.gray[500],
  purple: colors.purple[500],
  violet: colors.violet[500],
  blue: colors.blue[500],
  lightBlue: colors.sky[500],
  amber: colors.amber[500],
  orange: colors.orange[500],
  green: colors.green[500],
  emerald: colors.emerald[500],
  pink: colors.pink[500],
  red: colors.red[500],
};

const BACKGROUND_COLORS = {
  black: colors.gray[300],
  gray: "white",
  purple: colors.purple[300],
  violet: colors.violet[300],
  blue: colors.blue[300],
  lightBlue: colors.sky[300],
  amber: colors.amber[300],
  orange: colors.orange[300],
  green: colors.green[300],
  emerald: colors.emerald[300],
  pink: colors.pink[300],
  red: colors.red[300],
};

export type Color = keyof typeof COLORS;

export const colorToHex = (color?: Color) => {
  return COLORS[color ?? "gray"];
};

export const colorToBackgroundColorHex = (color?: Color) => {
  return BACKGROUND_COLORS[color ?? "gray"];
};

interface ColorPickerProps {
  onChange: (value: Color) => void;
  value: Color | undefined;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  onChange,
  value,
}) => {
  return (
    <div className="grid grid-cols-4 gap-2 p-2 w-full">
      {Object.entries(COLORS).map(([name, color]) => (
        <button
          key={name}
          onClick={() => onChange(name as Color)}
          className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 m-auto ${
            value === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select ${name} color`}
        />
      ))}
    </div>
  );
};

export type FillMode = "solid" | "none";

export const FillModePicker: React.FC<{
  onChange: (mode: FillMode) => void;
  value?: FillMode;
}> = ({ onChange, value: fillMode = "none" }) => {
  const fillModes: { mode: FillMode; icon: React.ReactNode }[] = [
    {
      mode: "none",
      icon: <div className="w-4 h-4 border border-black rounded"></div>,
    },
    {
      mode: "solid",
      icon: <div className="w-4 h-4 bg-black rounded"></div>,
    },
  ];

  return (
    <div className="flex gap-2 p-2">
      {fillModes.map(({ mode, icon }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`p-3 text-sm ${
            mode === "solid" ? "uppercase" : ""
          } rounded cursor-pointer transition-all hover:bg-gray-100 flex items-center gap-2 ${
            fillMode === mode ? "bg-gray-200 font-medium" : ""
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

const FONT_SIZES = {
  s: "16px",
  m: "24px",
  l: "32px",
  xl: "48px",
};

export type FontSize = keyof typeof FONT_SIZES;

export const fontSizeToPx = (fontSize?: FontSize) => {
  return FONT_SIZES[fontSize ?? "s"];
};

export const FontSizePicker: React.FC<{
  onChange: (fontSize: FontSize) => void;
  fontSize?: FontSize;
}> = ({ onChange, fontSize = "s" }) => {
  const fontSizes: FontSize[] = ["s", "m", "l", "xl"];

  return (
    <div className="flex gap-2 p-2 pointer">
      {fontSizes.map((size) => (
        <button
          key={size}
          onClick={() => onChange(size)}
          className={`w-[40px] h-[40px] uppercase rounded cursor-pointer transition-all hover:bg-gray-100 ${
            fontSize === size ? "bg-gray-200 font-medium" : ""
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
};

type InspectorState = {
  color: Color;
  fontSize: FontSize | null;
  fillMode: FillMode | null;
  isLocked: boolean | null;
};

type InspectorContext = {
  state: InspectorState;
  setState: (state: InspectorState) => void;
};

export const useInspectorState = ({
  tool,
  selectedObject,
}: {
  tool: ToolState;
  selectedObject?: Obj;
}): [InspectorState, (state: Partial<InspectorState>) => void] => {
  const [_inspectorState, _setInspectorState] = useState<
    Omit<InspectorState, "isLocked">
  >({
    color: "black",
    fontSize: "s",
    fillMode: "none",
  });

  const inspectorState: InspectorState = useMemo(() => {
    if (selectedObject) {
      let color: Color;
      let fillMode: FillMode | null = null;
      let fontSize: FontSize | null = null;

      if (selectedObject instanceof Card) {
        const card = selectedObject as Card;
        color = (card.props.color as Color) || "black";
        fillMode = card.parent() ? card.props.fillMode || "none" : null;
      } else {
        const field = selectedObject as Field;
        color = (field.props.color as Color) || "black";
        fontSize = field.props.fontSize || "s";
      }

      return {
        color,
        fillMode,
        fontSize,
        isLocked: selectedObject.props.isLocked ?? false,
      };
    }

    switch (tool.type) {
      case "card":
        return {
          color: _inspectorState.color,
          fillMode: _inspectorState.fillMode,
          fontSize: null,
          isLocked: null,
        };

      case "field":
        return {
          color: _inspectorState.color,
          fillMode: null,
          fontSize: _inspectorState.fontSize,
          isLocked: null,
        };

      default:
        return {
          ..._inspectorState,
          isLocked: null,
        };
    }
  }, [selectedObject, tool, _inspectorState]);

  const setInspectorState = useStaticCallback(
    (state: Partial<InspectorState>) => {
      if (!selectedObject) {
        delete state.isLocked;

        _setInspectorState((prevState) => ({ ...prevState, ...state }));
        return;
      }

      if (selectedObject instanceof Card) {
        const card = selectedObject as Card;
        card.update((props) => {
          if (state.color) {
            props.color = state.color;
          }
          if (state.fillMode) {
            props.fillMode = state.fillMode;
          }

          if (state.isLocked === true || state.isLocked === false) {
            props.isLocked = state.isLocked;
          }
        });
      } else if (selectedObject instanceof Field) {
        const field = selectedObject as Field;
        field.update((props) => {
          if (state.color) {
            props.color = state.color;
          }
          if (state.fontSize) {
            props.fontSize = state.fontSize;
          }

          if (state.isLocked === true || state.isLocked === false) {
            props.isLocked = state.isLocked;
          }
        });
      }
    }
  );

  return [inspectorState, setInspectorState];
};

export const Inspector = ({
  state,
  setState,
}: {
  state: InspectorState;
  setState: (state: Partial<InspectorState>) => void;
}) => {
  const { color, fontSize, fillMode, isLocked } = state;

  const handleColorChange = (color: Color) => {
    setState({ color });
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    setState({ fontSize });
  };

  const handleFillModeChange = (fillMode: FillMode) => {
    setState({ fillMode });
  };

  const handleIsLockedChange = () => {
    setState({ isLocked: !isLocked });
  };

  return (
    <div className="flex flex-col gap-1 p-1 bg-white shadow-md rounded-md w-[210px]">
      <ColorPicker value={color} onChange={handleColorChange} />

      {fillMode !== null && (
        <>
          <InspectorDivider />
          <FillModePicker value={fillMode} onChange={handleFillModeChange} />
        </>
      )}
      {fontSize !== null && (
        <>
          <InspectorDivider />
          <FontSizePicker fontSize={fontSize} onChange={handleFontSizeChange} />
        </>
      )}

      {isLocked !== null && (
        <>
          <InspectorDivider />
          <div className="flex items-center gap-2 p-2">
            <button
              type="button"
              onClick={handleIsLockedChange}
              className={`w-[40px] h-[40px] rounded-md cursor-pointer transition-transform hover:scale-110 ${
                isLocked ? "bg-gray-200" : ""
              }`}
            >
              {isLocked ? "🔒" : "🔓"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const InspectorDivider = () => {
  return <div className="w-full h-[1px] bg-gray-200" />;
};
