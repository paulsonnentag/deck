import { createRoot } from "react-dom/client";
import { Editor } from "./App";
import { Card } from "./Card";
import "./index.css";

const rootCard = Card.copy();

const root = createRoot(document.getElementById("root")!);
root.render(<Editor rootCard={rootCard} />);
