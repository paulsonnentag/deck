import { Obj } from "./Obj";

type Extension = (ob: Obj) => void;

const extensions: Extension[] = [];

export const registerExtension = (extension: Extension) => {
  extensions.push(extension);
};

export const applyExtensions = (obj: Obj) => {
  for (const extension of extensions) {
    extension(obj);
  }
};
