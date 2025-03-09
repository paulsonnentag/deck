import { useEffect, useState } from "react";
import { editorState } from "./core";

type EditorProps = {
  root: any;
};

const useForceUpdate = () => {
  const [, setState] = useState(0);
  return () => setState((state) => state + 1);
};

const Editor = ({ root }: EditorProps) => {
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    editorState.addChangeListener(forceUpdate);
    return () => editorState.removeChangeListener(forceUpdate);
  }, [forceUpdate]);

  console.log("render", editorState.selectedNode?.name);

  return <div className="w-screen h-screen">{root.$view()}</div>;
};

export default Editor;
