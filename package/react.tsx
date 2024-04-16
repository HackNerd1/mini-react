export function createElement(type: any, props: any, ...children: any[]): JSX.Element {
  const result = {
    key: "",
    type,
    props: {
      ...props,
      children: children.map((child) => {
        return typeof child === "object" ? child : createTextElement(child);
      }),
    },
  };
  debugger;
  return result;
}

export function createTextElement(text: string): JSX.Element {
  return {
    key: "",
    type: "TEXT_TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function render(element: JSX.Element, container: HTMLElement) {
  const dom: any =
    element.type === "TEXT_TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type);
  element.props.children.forEach((child: any) => {
    render(child, dom as any);
  });

  Object.keys(element.props)
    .filter((key) => key !== "children")
    .map((key) => {
      dom[key] = element.props[key];
    });
  container.appendChild(dom);
}

const React = {
  createElement,
  render,
};

export default React;
