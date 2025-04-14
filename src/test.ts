type Obj = {
  props: {
    id: string;
    x: number;
    y: number;
  };
};

type Card = Obj & {
  props: {
    width: number;
    height: number;
    fillMode: "solid" | "none";
  };
};

const a: Card = {
  props: {
    id: "1",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fillMode: "solid",
  },
};
