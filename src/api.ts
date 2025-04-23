import { Card, CardProps } from "./Card";
import { Field } from "./Field";
import { create, findOrCreate } from "./Obj";

export const addDay = (date: Date, days: number) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

export const addWeek = (date: Date, weeks: number) => {
  return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
};

export const dayCard = (date: Date) => {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  return findOrCreate<Card, CardProps>(
    Card,
    {
      type: "card",
      id: `day-${year}-${month}-${day}`,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      childIds: {},
    },
    (card) => {
      const field = create(Field, {
        type: "field",
        x: 0,
        y: 0,
        value: `${year}-${month}-${day}`,
      });

      card.addChild(field);
    }
  );
};
