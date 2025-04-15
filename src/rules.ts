import Anthropic from "@anthropic-ai/sdk";
import { outdent } from "outdent";
import { Card } from "./Card";
import { Field } from "./Field";
import { Obj } from "./Obj";

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

    type Obj = {
      props: {
        id: string;
        x: number;
        y: number;
      }
      isCopyOf: (obj: Obj) => boolean;
      parent: () => Card | null;
    }

    type Card = Obj & {
      props: {
        width: number;
        height: number;
        fillMode: "solid" | "none";
        color: Color;
      }
      children: () => (Card | Field)[];
    }

    type Field = Obj & {
      props: {       
        value: string;
        fontSize: number;
        color: Color;
      }
    }

    type Color = "black" | "gray" | "purple" | "violet" | "blue" | "lightBlue" | "amber" | "orange" | "green" | "emerald" | "pink" | "red"
    
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

    <card id="example" width="550" height="221" x="115" y="882" parentId="root">
      <card id="card1" width="434" height="58" x="60" y="77" parentId="example">
        <card id="card2" width="71" height="34" x="146" y="10" parentId="card1">
          <field id="field1" x="20" y="3" value="50" parentId="card2" />
        </card>
      </card>
    </card>

    User explanation: 
    
    "the knob shows the percentage value of the slider"

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

      field.props.value = (knob.props.x + knob.props.width / 2) / slider.props.width * 100          
    })
    \`\`\`

    Now apply this to the following request:

    Example Card: 

    ${card.toPromptXml()}

    User explanation: "${explanation}"
  `;
};

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const generateRuleSource = async (explanation: string, card: Card) => {
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

type Rule = (node: Obj) => void;

type RuleApi = {
  addRule: (rule: Rule) => void;
  getNode: (id: string) => Obj;
};

const getRuleApi = (Nodes: Record<string, Obj>, rules: Rule[]) => {
  return {
    addRule: (rule: Rule) => {
      rules.push(rule);
    },
    getNode: (id: string) => Nodes[id],
  };
};

const evalRule = (api: RuleApi, source: string) => {
  try {
    const fn = new Function("api", `with(api) { ${source} }`);
    fn(api);
  } catch (error) {
    console.error(error);
  }
};

export const applyRules = (nodes: Record<string, Obj>) => {
  const rules: Rule[] = [];
  const api = getRuleApi(nodes, rules);

  for (const node of Object.values(nodes)) {
    if (node instanceof Field && node.props.rule?.type === "source") {
      const source = node.props.rule.source;

      console.log("applyRules", source);
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

export const objToXML = (
  name: string,
  attributes: Record<string, any>,
  content = ""
) => {
  const attributeString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${JSON.stringify(value)}"`)
    .join(" ");

  if (content) {
    return `<${name} ${attributeString}>${content}</${name}>`;
  }

  return `<${name} ${attributeString} />`;
};
