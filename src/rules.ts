import Anthropic from "@anthropic-ai/sdk";
import { outdent } from "outdent";
import { Card } from "./card";
import { useEffect } from "react";
import { Node } from "./node";
import { Field } from "./field";

const getGenerateRulePrompt = (explanation: string, card: Card) => {
  return outdent`
    You are a coding assistant that helps write rules to add dynamic behavior to a white board app. 

    Here is how the white board works:

    - A white board consists of nested cards and fields
    - A card can contain other cards or fields
    - cards and fields store their position relative to their parent card
    - cards and fields can be copied and pasted 
    - If a card or field is copied it remembers from which object it was copied from
    - There is a single root card that contains the entire white board content

    Here is the schema of the objects on the white board:

    \`\`\`javascript

    type Card = {
      id: string;
      parent: Card;
      children: Card | Field[];
      x: number;
      y: number;
      width: number;
      height: number;
      color: Color;
    }

    type Field = {
      id: string;
      parent: Card;
      x: number;
      y: number;
      value: string;
      fontSize: number;
      color: Color;
    }

    type Color = 
    
    \`\`\`


    Here is how dynamic behavior is added to the white board:


    - The user creates little example scenarios as a card that illustrate a dynamic behavior they want
    - The user explains why the cards in the example should look the way they do on the example card
    - You have to generate a javascript function that implements that dynamic behavior
    - This function can reference the objects in the example card
    - The function is then called for all objects on the white board
    - the function should check if the object matches the scenario on the example card
    - The function should consider objects matching if they are a copy of the object in the example card
    - The function should also check if the object has the correct parent / sibling relationship as in the example card
    - If the object is a match the function should mutate the object to match the scenario on the example card
    
    # Examples

    Example Card:

    ${JSON.stringify([
      {
        type: "card",
        id: "card1",
        x: 125,
        y: 100,
        width: 449,
        height: 52,
        children: [
          {
            type: "card",
            id: "card2",
            x: 162,
            y: 7,
            width: 44,
            height: 36,
            children: [
              {
                type: "field",
                id: "field1",
                x: 9.4921875,
                y: 5.96484375,
                value: "50",
              },
            ],
          },
        ],
      },
    ])}

    User explanation: "the knob shows the percentage value of the slider"

    Response:

    \`\`\`javascript
    const exampleSlider = getNode("card1")
    const exampleKnob = getNode("card2")
    const exampleField = getNode("field1")

    addRule((obj) => {
      const field = obj
      if (!field.isCopyOf(exampleField)) {
        return
      }

      const knob = field.parent
      if (!knob || !knob.isCopyOf(exampleKnob)) {
        return
      }

      const slider = knob.parent
      if (!slider || !slider.isCopyOf(exampleSlider)) {
        return
      }

      field.value = (knob.x + knob.width / 2) / slider.width * 100          
    })
    \`\`\`

    Now apply this to the following request:

    Example Card: 

    ${JSON.stringify(card.serializeWithChildren())}

    User explanation: "${explanation}"
  `;
};

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const generateRuleSource = async (explanation: string, card: Card) => {
  // Generate a haiku
  const message = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: getGenerateRulePrompt(explanation, card),
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return getCode(content.text);
  }
};

const getCode = (response: string) => {
  const code = response.match(/```javascript(?<code>[\s\S]*?)```/);
  if (code) {
    return code.groups?.code;
  }
};

type Rule = (node: Node) => void;

type RuleApi = {
  addRule: (rule: Rule) => void;
  getNode: (id: string) => Node;
};

const getRuleApi = (Nodes: Record<string, Node>, rules: Rule[]) => {
  return {
    addRule: (rule: Rule) => {
      rules.push(rule);
    },
    getNode: (id: string) => Nodes[id],
  };
};

const evalRule = (api: RuleApi, source: string) => {
  console.log("evalRule", source);

  try {
    const fn = new Function("api", `with(api) { ${source} }`);
    fn(api);
  } catch (error) {
    console.error(error);
  }
};

export const applyRules = (nodes: Record<string, Node>) => {
  const rules: Rule[] = [];
  const api = getRuleApi(nodes, rules);

  for (const node of Object.values(nodes)) {
    if (node instanceof Field && node.rule?.type === "source") {
      const source = node.rule.source;
      evalRule(api, source);
    }
  }

  for (const node of Object.values(nodes)) {
    for (const rule of rules) {
      try {
        rule(node);
      } catch (error) {
        console.error(error);
      }
    }
  }
};
