import { Obj } from "./Obj";

type SuggestedComputation = {
  name: string;
  expression: string;
};

type Extension = {
  extend: (obj: Obj) => void;
  suggestComputations?: (obj: Obj) => SuggestedComputation[];
};

const extensions: Extension[] = [];

export const registerExtension = (extension: Extension) => {
  extensions.push(extension);
};

export const applyExtensions = (obj: Obj) => {
  for (const extension of extensions) {
    extension.extend(obj);
  }
};

export const suggestComputations = (obj: Obj) => {
  for (const extension of extensions) {
    if (extension.suggestComputations) {
      return extension.suggestComputations(obj);
    }
  }
};
