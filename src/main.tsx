import { createRoot } from "react-dom/client";
import { Editor } from "./Editor";
import { Card } from "./card";
import "./index.css";

const rootCard = Card.copy();

const root = createRoot(document.getElementById("root")!);
root.render(<Editor rootCard={rootCard} />);
