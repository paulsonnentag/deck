import Anthropic from "@anthropic-ai/sdk";
import { outdent } from "outdent";
import { Card } from "./card";
import { useEffect } from "react";
import { Node } from "./node";
import { Field } from "./field";

const getGenerateRulePrompt = (explanation: string, card: Card) => {
  return outdent`
    You are a coding assistant that helps write little code snippets to add
    dynamic behavior to a white board app. You will get an arrangement of 
    the cards on screen and a user explanation that describes why the shapes
    look that way. Based on that you should infer a rule that would generate
    that would add that appearance dynamically to other shapes that match this
    description.

    # Example

    Scene:

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

    \`\`\`Javascript
    addRule((obj) => {
      const slider = getNode("card1")
      const knob = getNode("card2")
      const field = getNode("field1")

      if (field.isCopyOf(slider) && field.parent.isCopyOf(knob) && obj.parent.isCopyOf(slider)) {

        debugger // add a debugger when the rule is applied
        const knob = field.parent
        const slider = knob.parent

        field.value = (knob.x + knob.width / 2) / slider.width * 100      
      }
    })

    Now apply this to the following request:

    Scene: 

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

  api.addRule((obj) => {
    const slider = api.getNode("d54c986b-d02c-41e7-89c8-fe4ab9fe68e0") as Card;
    const knob = api.getNode("712c60cb-0009-409a-a02c-e6b435c88c75") as Card;
    const field = api.getNode("2578e729-922e-4a21-9b9f-4db09cc34e8d") as Field;

    if (obj.isCopyOf(slider)) {
      const knobCopy = obj.children.find((child) => child.isCopyOf(knob));
      const fieldCopy = obj.children.find((child) => child.isCopyOf(field));

      const minValue = 0;
      const maxValue = 50;

      const sliderWidth = slider.width;
      const knobWidth = knobCopy.width;
      const knobPosition = knobCopy.x;

      const value = Math.round(
        ((knobPosition + knobWidth / 2) / sliderWidth) * (maxValue - minValue) +
          minValue
      );

      console.log("value", value, maxValue, minValue, knobPosition);
      fieldCopy.value = value.toString();
    }
  });

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
