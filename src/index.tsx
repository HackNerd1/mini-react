import React, { useState } from "../package/index";

// const element = (
//   <div style="background: salmon">
//     <h1>Hello World</h1>
//     <h2 style="text-align:right">from Didact</h2>
//   </div>
// );

function Counter() {
  const [state, setState] = useState<number>(0);
  const [count, setCount] = useState(0);
  return (
    <>
      <h1 onClick={() => setState((c: number) => c + 1)}>Count: {state}</h1>
      <h1 onClick={() => setCount((c: number) => c + 1)}>Count2: {count}</h1>
    </>
  );
}

const element = <Counter></Counter>;

const container = document.getElementById("root");
React.render(element, container as HTMLElement);
