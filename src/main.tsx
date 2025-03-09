import "./index.css";
import { createRoot } from "react-dom/client";
import { Card, computation, Computed, Field } from "./core";

const eventTitle = Field.$extend({
  x: 10,
  y: 10,
  value: "Meeting with John",
});

const eventStart = Field.$extend({
  x: 10,
  y: 50,
  value: computation(
    "Math.floor(8 + $parent.y / 50) + ':' + Math.floor(($parent.y % 50) / 50 * 60).toString().padStart(2, '0')"
  ),
  width: 50,
});

const eventEnd = Field.$extend({
  x: 100,
  y: 50,
  value: computation(
    "Math.floor(8 + ($parent.y + $parent.height) / 50) + ':' + Math.floor((($parent.y + $parent.height) % 50) / 50 * 60).toString().padStart(2, '0')"
  ),
  width: 50,
});

const eventDash = Field.$extend({
  x: 75,
  y: 50,
  readOnly: true,
  value: "-",
  width: 50,
});

const event = Card.$extend({
  width: 400,
  height: 100,
  x: 100,
  y: 100,
  children: [eventTitle, eventStart, eventDash, eventEnd],
});

const event2 = event.$extend(
  {
    x: 100,
    y: 210,
  },
  [[eventTitle, { value: "Another meeting" }]]
);

const main = Card.$extend({
  children: [event, event2],
});

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(main.$view());
