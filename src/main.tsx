import { uuid } from "@automerge/automerge";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Editor } from "./Editor";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { ObjectDoc, registerObjectsDocHandle } from "./Obj";
import { FieldProps } from "./Field";
import { CardProps } from "./Card";
import "./calendarExtension";
import { CalendarCardState } from "./calendarExtension";

const createObjectDoc = (repo: Repo): DocHandle<ObjectDoc> => {
  const nextLabel: FieldProps = {
    id: uuid(),
    x: 15,
    y: 0,
    type: "field",
    value: "⏵",
    fontSize: "l",
  };

  const prevLabel: FieldProps = {
    id: uuid(),
    x: 0,
    y: 0,
    type: "field",
    value: "⏴",
    fontSize: "l",
  };

  const nextButton: CardProps = {
    id: uuid(),
    x: 200,
    y: 10,
    type: "card",
    width: 50,
    height: 50,
    fillMode: "solid",
    childIds: {
      [nextLabel.id]: true,
    },
    color: "blue",
    isLocked: true,
  };

  const prevButton: CardProps = {
    id: uuid(),
    x: 10,
    y: 10,
    type: "card",
    width: 50,
    height: 50,
    fillMode: "solid",
    childIds: {
      [prevLabel.id]: true,
    },
    color: "blue",
    isLocked: true,
  };

  const weekNumberField: FieldProps = {
    id: uuid(),
    x: 70,
    y: 15,
    type: "field",
    value: { expression: "`week # ${week}`" },
    fontSize: "m",
  };

  const calendarCard: CardProps & CalendarCardState = {
    id: uuid(),
    x: 100,
    y: 100,
    type: "card",
    width: 500,
    height: 200,
    fillMode: "solid",
    childIds: {
      [weekNumberField.id]: true,
      [nextButton.id]: true,
      [prevButton.id]: true,
    },
    week: 1,
  };

  const rootCard: CardProps = {
    id: uuid(),
    x: 0,
    y: 0,
    type: "card",
    width: 0,
    height: 0,
    color: "black",
    childIds: {
      [calendarCard.id]: true,
    },
  };

  return repo.create({
    rootObjectId: rootCard.id,
    objects: {
      [rootCard.id]: rootCard,
      [calendarCard.id]: calendarCard,
      [nextButton.id]: nextButton,
      [prevButton.id]: prevButton,
      [nextLabel.id]: nextLabel,
      [prevLabel.id]: prevLabel,
      [weekNumberField.id]: weekNumberField,
    },
  });
};

const repo = new Repo({
  network: [new BrowserWebSocketClientAdapter("wss://sync.automerge.org")],
  storage: new IndexedDBStorageAdapter(),
});

// Get document ID from URL hash if available
let documentId = window.location.hash.slice(1) as DocumentId;

if (!documentId) {
  const handle = createObjectDoc(repo);
  registerObjectsDocHandle(handle);
  documentId = handle.documentId;

  (window as any).docHandle = handle;

  // Update URL with the new document ID
  window.location.hash = documentId;
} else {
  const handle = repo.find<ObjectDoc>(documentId);
  (window as any).docHandle = handle;
  registerObjectsDocHandle(handle);
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <RepoContext.Provider value={repo}>
    <Editor documentId={documentId} />
  </RepoContext.Provider>
);
