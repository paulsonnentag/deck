import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { DocumentId, Repo } from "@automerge/automerge-repo";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { ObjectDoc } from "./core";

const repo = new Repo({
  network: [],
  storage: new IndexedDBStorageAdapter(),
});

let documentId = localStorage.getItem("documentId") as DocumentId;

if (!documentId) {
  const handle = repo.create<ObjectDoc>();

  handle.change((doc) => {
    doc.objects = {};
  });

  documentId = handle.documentId;
  localStorage.setItem("documentId", handle.documentId);
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <RepoContext.Provider value={repo}>
    <App documentId={documentId} />
  </RepoContext.Provider>
);
