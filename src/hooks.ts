import { useEffect, useState } from "react";
import { Card } from "./card";

export const useCard = (card: Card) => {
  const [_, setState] = useState({});

  useEffect(() => {
    const forceRerender = () => setState({});

    card.on("changed", forceRerender);
    card.on("childAdded", forceRerender);
    card.on("childRemoved", forceRerender);

    return () => {
      card.off("changed", forceRerender);
      card.off("childAdded", forceRerender);
      card.off("childRemoved", forceRerender);
    };
  }, [card]);
};
