import "./index.css";
import { createRoot } from "react-dom/client";
import { Card, Computed, Field } from "./core";

const eventTitle = Field.$extend({
  x: 10,
  y: 10,
  value: "Meeting with John",
});

const eventStart = Field.$extend({
  x: 10,
  y: 50,
  value: "10:00",
  width: 50,
});

const eventEnd = Field.$extend({
  x: 100,
  y: 50,
  value: "11:00",
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
  height: 150,
  x: 100,
  y: 100,
  children: [eventTitle, eventStart, eventDash, eventEnd],
});

const event2 = event.$extend(
  {
    x: 100,
    y: 300,
  },
  [
    [eventTitle, { value: "Another meeting" }],
    [eventStart, { value: Computed.$extend({ source: `Math.random()` }) }],
    [eventEnd, { value: "13:00" }],
  ]
);

const main = Card.$extend({
  children: [event, event2],
});

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(main.$view());
