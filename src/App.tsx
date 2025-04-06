import { DocumentId } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useEffect, useMemo, useRef } from "react";
import { useObjects } from "./core";

type AppProps = {
  documentId: DocumentId;
};

export const App = ({ documentId }: AppProps) => {
  const { objects, createObject } = useObjects(documentId);

  console.log(objects);

  return (
    <div
      className="w-screen h-screen overflow-auto bg-gray-50"
      onPointerDown={(e) => {
        createObject(
          objects.Card.extend({ props: { x: e.clientX, y: e.clientY } })
        );
      }}
    >
      {Object.values(objects).map((object) => (
        <ObjectView key={object.id} object={object} />
      ))}
    </div>
  );
};

const ObjectView = ({ object }: { object: any }) => {
  return object.view();
};
