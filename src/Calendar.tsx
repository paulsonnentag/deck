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

  obj.props.color = "red";
};
