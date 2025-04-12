import { createRoot } from "react-dom/client";
import "./index.css";
import { Editor } from "./editor";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { DocumentId, Repo } from "@automerge/automerge-repo";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { NodesDoc } from "./nodes";
import { Card } from "./card";

const repo = new Repo({
  network: [new BrowserWebSocketClientAdapter("wss://sync.automerge.org")],
  storage: new IndexedDBStorageAdapter(),
});

// Get document ID from URL hash if available
let documentId = window.location.hash.slice(1) as DocumentId;

if (!documentId) {
  const handle = repo.create<NodesDoc>();

  handle.change((doc) => {
    doc.nodes = {};
  });

  const rootCard = Card.create(handle, {
    x: 0,
    y: 0,
    width: "100%",
    height: "100%",
  });

  handle.change((doc) => {
    doc.nodes[rootCard.id] = rootCard.serialize();

    doc.rootNodeId = rootCard.id;
  });

  documentId = handle.documentId;

  // Update URL with the new document ID
  window.location.hash = documentId;
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <RepoContext.Provider value={repo}>
    <Editor documentId={documentId} />
  </RepoContext.Provider>
);
