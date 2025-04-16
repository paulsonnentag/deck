import { createRoot } from "react-dom/client";
import "./index.css";
import { Editor } from "./Editor";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { DocumentId, Repo } from "@automerge/automerge-repo";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { createObjectDoc, ObjectDoc, registerObjectsDocHandle } from "./Obj";

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
  // window.location.hash = documentId;
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
