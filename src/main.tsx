import "./index.css";
import { createRoot } from "react-dom/client";

const card = {
  view() {
    const { width, height, x, y, children } = this as any;

    const style = {
      width: width !== undefined ? `${width}px` : "100%",
      height: height !== undefined ? `${height}px` : "100%",
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
    };

    return (
      <div style={style} className="border border-gray-300 absolute">
        <div className="w-full h-full relative">
          {children ? children.map((child: any) => child.view()) : null}
        </div>
      </div>
    );
  },
};

const field = {
  view() {
    const self = this as any;
    const { width, x, y, value, readonly } = self;

    const style: React.CSSProperties = {
      transform: `translate(${x ?? 0}px, ${y ?? 0}px)`,
    };

    if (width !== undefined) {
      style.width = `${width}px`;
    }

    return (
      <div style={style} className="absolute">
        {readonly ? (
          <div className="w-full">{value}</div>
        ) : (
          <input
            className="w-full"
            readOnly={readonly}
            type="text"
            value={value}
            onChange={() => (self.value = event.target.value)}
          />
        )}
      </div>
    );
  },
};

const eventTitle = Object.create(field);
eventTitle.x = 10;
eventTitle.y = 10;
eventTitle.value = "Meeting with John";

const eventStart = Object.create(field);
eventStart.x = 10;
eventStart.y = 50;
eventStart.value = "10:00";
eventStart.width = 50;

const eventEnd = Object.create(field);
eventEnd.x = 100;
eventEnd.y = 50;
eventEnd.value = "11:00";
eventEnd.width = 50;

const eventDash = Object.create(field);
eventDash.x = 75;
eventDash.y = 50;
eventDash.readonly = true;
eventDash.value = "-";
eventDash.width = 50;

const event = Object.create(card);
event.width = 400;
event.height = 150;
event.x = 100;
event.y = 100;
event.children = [eventTitle, eventStart, eventDash, eventEnd];

const main = Object.create(card);
main.children = [event];

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(main.view());
