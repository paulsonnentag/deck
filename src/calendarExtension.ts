import { Card } from "./Card";
import { Field } from "./Field";
import { BaseProps, Obj, ObjViewProps, updateExtensionState } from "./Obj";
import { registerExtension } from "./extensions";

export type CalendarCardState = {
  week: number;
};

const getCalendarCardState = (
  props: any
): (CalendarCardState & BaseProps) | undefined => {
  if (props.week) {
    return props as CalendarCardState & BaseProps;
  }

  return undefined;
};

registerExtension((obj: Obj) => {
  if (!(obj instanceof Card)) {
    return;
  }

  const calendarCardState = getCalendarCardState(obj.props);

  if (!calendarCardState) {
    return;
  }

  const originalView = obj.view.bind(obj);

  obj.view = ({
    draggedNode,
    selectedNode,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    isParentLocked,
  }: ObjViewProps) => {
    const _onPointerDown = (
      evt: React.PointerEvent<HTMLDivElement>,
      obj: Obj
    ) => {
      if (!(obj instanceof Card)) {
        return;
      }

      if (
        obj
          .children()
          .find((child) => child instanceof Field && child.props.value == "⏵")
      ) {
        updateExtensionState<CalendarCardState>(calendarCardState, (props) => {
          props.week = props.week + 1;
        });
      } else if (
        obj
          .children()
          .find((child) => child instanceof Field && child.props.value == "⏴")
      ) {
        updateExtensionState<CalendarCardState>(calendarCardState, (props) => {
          props.week = props.week - 1;
        });
      }

      onPointerDown(evt, obj);
    };

    return originalView({
      draggedNode,
      selectedNode,
      onPointerDown: _onPointerDown,
      onPointerMove,
      onPointerUp,
      isParentLocked,
    });
  };
});
