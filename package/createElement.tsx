import { isEvent, isGone, isNew, isProperty } from "./utils";

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
  return result;
}

export function createTextElement(text: string): JSX.Element {
  return {
    key: "",
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function updateDom(dom: HTMLElement, oldProps: any, newProps: any) {
  // remove event
  Object.keys(oldProps)
    .filter(isEvent)
    .filter((key) => !(key in newProps) || isNew(oldProps, newProps)(key))
    .forEach((key) => {
      const eventName = key.toLowerCase().substring(2);
      dom.removeEventListener(eventName, oldProps[key]);
    });

  // 删除旧prop
  Object.keys(oldProps)
    .filter(isProperty)
    .filter((key) => isGone(key, oldProps))
    .forEach((key) => (dom as any)[key] == "");

  // add event
  Object.keys(newProps)
    .filter(isEvent)
    .filter(isNew(oldProps, newProps))
    .forEach((key) => {
      const eventName = key.toLowerCase().substring(2);
      dom.addEventListener(eventName, newProps[key]);
    });

  // 添加新prop
  Object.keys(newProps)
    .filter(isProperty)
    .filter(isNew(oldProps, newProps))
    .forEach((key) => ((dom as any)[key] = newProps[key]));
}

export function createDom(fiber: any): HTMLElement {
  const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}
