import { Fiber, Hooks } from "./interface";
import { createDom, updateDom } from "./createElement";

let nextUnitOfWork: Fiber = null;
let wipRoot: Fiber = null;
let currentRoot: Fiber = null;
let deletions: Fiber[] = [];

/**
 * 1. 将fiber添加到dom上
 * 2. 为元素的子元素创建fiber
 * 3. 选择下一个 nextUnitOfWork
 * 4. 当完成root fiber的工作 下一个 UnitOfWork即为它的 child 或 sibling (深度优先遍历)
 */
function performUnitOfWork(fiber: Fiber): Fiber {
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponet(fiber);
  }

  /* ---- 深度优先遍历下一个UnitOfWork ---- */
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber: Fiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

/**
 * 为每个child创建fiber
 */
function reconcileChildren(fiber: Fiber, children: Fiber[]) {
  let preSibling: Fiber;
  let oldFiber: Fiber = fiber.alternate && fiber.alternate.child;
  let i = 0;

  while (i < children.length || oldFiber != null) {
    const element = children[i];
    let newFiber: Fiber;

    const sameType = element && oldFiber && element.type == oldFiber.type;

    if (sameType) {
      // update
      // 如果旧光纤和新元素的类型相同，我们可以保留 DOM 节点，只需使用新 prop 更新它
      newFiber = {
        parent: fiber,
        props: element.props,
        type: oldFiber.type,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      // add
      // 如果类型不同，并且有一个新元素，则意味着我们需要创建一个新的 DOM 节点
      newFiber = {
        parent: fiber,
        props: element.props,
        type: element.type,
        dom: null,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      // delete
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    /* ---- 将children ---- */
    if (i === 0) {
      fiber.child = newFiber;
    } else if (element) {
      preSibling.sibling = newFiber;
    }

    preSibling = newFiber;
    i++;
  }
}

export function render(element: JSX.Element, container: HTMLElement) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, // 指向旧的 RootFiber（上一次commit提交的fiber）
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber: Fiber) {
  if (!fiber) {
    return;
  }
  let parentFiber = fiber.parent;
  while (!parentFiber.dom) {
    parentFiber = parentFiber.parent;
  }
  const domParent = parentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    // domParent.removeChild(fiber.dom);
    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, dom: HTMLElement) {
  if (fiber.dom) {
    fiber.dom.removeChild(dom);
  } else {
    commitDeletion(fiber.child, fiber.dom);
  }
}

let wipFiber: Fiber;
let hookIndex: number;

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponet(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  reconcileChildren(fiber, fiber.props.children);
}

export function useState<T>(initial: T): [T, (action: (T: T) => {}) => void] {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex];
  const hook: Hooks = {
    state: oldHook ? oldHook.state : initial,
    quene: [],
  };

  const actions = oldHook?.quene ?? [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action: (T: T) => {}) => {
    hook.quene.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

/**
 * 将root fiber创建为 nextUnitOfWork
 * 其余的工作将发生在函数上 performUnitOfWork
 */
function workLoop(deadLine: IdleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadLine.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

/**
 * requestIdleCallback 提供了一个截止日期参数 我们可以用它来检查在浏览器需要再次控制之前我们还有多少时间
 * React 不再使用 requestIdleCallback
 * 它触发频率不稳定，受很多因素影响。比如当我们的浏览器切换 tab 后，之前 tab 注册的requestIdleCallback触发的频率会变得很低
 * React实现了功能更完备的Scheduler
 */
requestIdleCallback(workLoop);
