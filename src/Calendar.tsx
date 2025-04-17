import { uuid } from "@automerge/automerge";
import { colorToHex } from "./Inspector";
import { Color, colorToBackgroundColorHex } from "./Inspector";
import {
  BaseProps,
  Obj,
  ObjView,
  ObjViewProps,
  PersistedObject,
  create,
  getObjectById,
  updateExtension,
} from "./Obj";
import { Card, CardProps } from "./Card";
import { Field } from "./Field";

export type WeekInfo = {
  week: number;
};

const getWeekInfo = (props: any): WeekInfo | undefined => {
  if (props.week) {
    return props as WeekInfo;
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
        console.log("next");
      } else if (
        obj
          .children()
          .find((child) => child instanceof Field && child.props.value == "⏴")
      ) {
        console.log("prev");
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
