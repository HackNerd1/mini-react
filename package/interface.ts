/**
 * 为每个元素提供一个fiber
 * 每个fiber都有child parent silbing指针 使查找下一个工作单元变得容易。
 * 每个fiber即为一个工作单元
 */

export interface Fiber {
  type?: any;
  dom: HTMLElement;
  parent?: Fiber;
  child?: Fiber;
  sibling?: Fiber;
  props: any;
  alternate?: Fiber;
  children?: Fiber[];
  hooks?: Hooks[];
  effectTag?: "UPDATE" | "DELETION" | "PLACEMENT";
}

export interface Hooks {
  state: any;
  quene: Function[];
}
