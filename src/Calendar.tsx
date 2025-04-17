import { Card } from "./Card";
import { Field } from "./Field";
import { BaseProps, Obj, ObjViewProps, updateExtension } from "./Obj";

export type WeekInfo = {
  week: number;
};

const getWeekInfo = (props: any): (WeekInfo & BaseProps) | undefined => {
  if (props.week) {
    return props as WeekInfo & BaseProps;
  }

  return undefined;
};

export const applyCalendar = (obj: Obj) => {
  if (!(obj instanceof Card)) {
    return;
  }

  const weekInfo = getWeekInfo(obj.props);

  if (!weekInfo) {
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
        updateExtension<WeekInfo>(weekInfo, (props) => {
          props.week = props.week + 1;
        });
      } else if (
        obj
          .children()
          .find((child) => child instanceof Field && child.props.value == "⏴")
      ) {
        updateExtension<WeekInfo>(weekInfo, (props) => {
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
};
