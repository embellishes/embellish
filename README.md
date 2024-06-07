<p align="center">
  <!-- npm-remove -->
  <a href="https://github.com/embellishes/embellish/#gh-dark-mode-only" target="_blank">
    <img alt="Embellish" src="https://raw.githubusercontent.com/embellishes/embellish/HEAD/.github/logo-dark.svg" width="320" height="64" style="max-width: 100%;">
  </a>
  <!-- /npm-remove -->
  <a href="https://github.com/embellishes/embellish/#gh-light-mode-only" target="_blank">
    <img alt="Embellish" src="https://raw.githubusercontent.com/embellishes/embellish/HEAD/.github/logo-light.svg" width="320" height="64" style="max-width: 100%;">
  </a>
  <br/>
  A powerfully <em>simple</em> React styling primitive
</p>

---

Embellish offers a powerful and intuitive way to style your React application
deterministically, without runtime style injection or extra build steps. Easily
create a polymorphic component with your own custom style props, and use a pure
CSS mechanism to apply styles conditionally, creating hover effects, responsive
behavior, and more. Consider this example of a `Box` component:

```tsx
<Box
  as="a"
  href="https://github.com/embellishes/embellish"
  color="#fff"
  background="#03f"
  hover:background="color-mix(in srgb, #03f, #fff 12.5%)"
  active:background="#c30">
  Get started
</Box>
```

With a styling API that builds heavily upon the declarative nature of React, the
`Box` component enables you to manage complex styling scenarios with ease.
Meanwhile, Embellish's purely CSS-driven approach for defining conditions like
`hover` and `active` means that you can create dynamic and interactive UI
elements without compromising on performance or maintainability.

## Features

- **Conditional styles with pure CSS**: Under the hood, Embellish uses CSS
  Variables to apply styles conditionally based on pseudo-classes, at-rules, or
  arbitrary selector logic.
- **First-class style props**: Components expose CSS properties as first-class
  props. You can choose which ones to support or even define your own custom
  props.
- **Style prop conditions**: Specify the name of a condition as a style prop
  modifier, e.g. `hover:background="#333"`, and its value will apply only under
  that condition.
- **Inline conditions**: Conditions can be combined in a single component
  instance using logical operators, providing flexibility, promoting reuse, and
  keeping global CSS to a minimum.
- **No runtime style injection**: Avoid hydration mismatches, flashes of
  unstyled content, and questionable performance of runtime style injection.
- **No build step**: Simplify the development workflow by avoiding static
  analysis and extra build steps.
- **Near-perfect code splitting**: Most style information is embedded directly
  in component markup, with a minimal global style sheet used only to define
  reusable conditions.
- **No cascade defects**: Embellish's use of inline styles ensures that CSS
  rulesets can't "leak in" and modify private component implementation details.

## Installation

```bash
npm install @embellish/react
```

## Getting started

### Step 1: CSS hooks

#### Step 1a: Define hooks

Start by defining CSS hooks. These are all of the CSS "selectors" you want to
use throughout your app. These can be actual selectors, e.g., `&:hover`,
`&.foo`, or `:checked ~ &`, where `&` is a placeholder for the element to which
the conditional style is to be applied; or even `@media`, `@container`, or
`@supports` rules.

```typescript
import { createHooks } from "@embellish/react";

const { StyleSheet, hooks } = createHooks([
  "&:hover",
  "&:focus",
  "&:active",
  "&:disabled",
  "&[aria-disabled=true]",
  "@media (width >= 600px)",
]);
```

> [!NOTE]
>
> It's a good practice to keep these hooks as simple and generic as possible to
> promote reuse. Later, you can combine them to create more complex conditions.

#### Step 1b: Add style sheet

The `StyleSheet` component obtained in the previous step renders a small static
style sheet containing the CSS required to support conditional styling. Add this
to the root layout component or entry point of your app.

```diff
// e.g. src/main.ts

root.render(
  <StrictMode>
+   <StyleSheet />
    <App />
  </StrictMode>
);
```

### Step 2: Create reusable conditions

A reusable condition assigns an alphanumeric alias (i.e. a valid prop name) to
each hook. You can also define complex conditions using logical operators.

```typescript
import { createConditions } from "@embellish/react";

const conditions = createConditions(hooks, {
  hover: "&:hover",
  focus: "&:focus",
  active: "&:active",
  disabled: { or: ["&:disabled", "&[aria-disabled=true]"] },
  intent: { or: ["&:hover", "&:focus"] },
  desktop: "@media (width >= 600px)",
});
```

> [!NOTE]
>
> At this stage, it's still a good practice to consider the reusability of each
> complex hook defined here. You can define
> [inline conditions](#inline-conditions) later for one-off use cases.

### Step 3: Create style props

You can create your own [custom style props](#custom-style-props), or use the
`createStyleProps` utility to generate them for you.

```typescript
import { createStyleProps } from "@embellish/react";

const styleProps = createStyleProps([
  "backgroundColor",
  "border",
  "borderRadius",
  "color",
  "cursor",
  "display",
  "fontSize",
  "fontWeight",
  "outline",
  "outlineOffset",
  "padding",
  "transition",
]);
```

### Step 4: Create a component

Create e.g. a `Box` component using the conditions defined in the previous step
along with your desired style props.

```typescript
import { createComponent } from "@embellish/react";

const Box = createComponent({
  displayName: "Box",
  defaultAs: "div", // optional, any HTML tag or component
  defaultStyle: {
    // optional, a regular React style object consisting of "base" styles
    boxSizing: "border-box",
    textDecoration: "none",
  },
  conditions,
  styleProps,
});
```

### Step 5: Use the component

Use your `Box` component to create e.g. a styled button:

```tsx
function CtaButton({
  href,
  children,
  disabled,
}: {
  href: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Box
      as="a"
      href={href}
      aria-disabled={disabled}
      display="inline-block"
      backgroundColor="#6200ea"
      color="#ffffff"
      padding="12px 24px"
      border="none"
      borderRadius="4px"
      cursor="pointer"
      fontSize="16px"
      fontWeight="bold"
      transition="background-color 0.3s, color 0.3s"
      intent:backgroundColor="#3700b3"
      active:backgroundColor="#6200ea"
      active:color="#bb86fc"
      focus:outline="2px solid #03dac6"
      focus:outlineOffset="2px"
      disabled:cursor="not-allowed">
      {children}
    </Box>
  );
}
```

## Advanced usage

### Inline conditions

You can compose conditions inline using logical operators, creating maximum
flexibility and reuse for the hooks you defined in Step 1 above. Simply pass
additional conditions to the `conditions` prop, and then use them as style prop
modifiers:

```diff
function CtaButton({
  href,
  children,
  disabled,
}: {
  href: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Box
+     conditions={{
+       intentEnabled: {
+         and: ["intent", { not: "disabled" }],
+       },
+       activeEnabled: {
+         and: ["active", { not: "disabled" }],
+       },
+       focusEnabled: {
+         and: ["focus", { not: "disabled" }],
+       },
+     }}
      as="a"
      href={href}
      aria-disabled={disabled}
      display="inline-block"
      backgroundColor="#6200ea"
      color="#ffffff"
      padding="12px 24px"
      border="none"
      borderRadius="4px"
      cursor="pointer"
      fontSize="16px"
      fontWeight="bold"
      transition="background-color 0.3s, color 0.3s"
-     intent:backgroundColor="#3700b3"
-     active:backgroundColor="#6200ea"
-     active:color="#bb86fc"
-     focusEnabled:outline="2px solid #03dac6"
+     intentEnabled:backgroundColor="#3700b3"
+     activeEnabled:backgroundColor="#6200ea"
+     activeEnabled:color="#bb86fc"
+     focusEnabled:outline="2px solid #03dac6"
      focus:outlineOffset="2px"
      disabled:cursor="not-allowed">
      {children}
    </Box>
  );
}
```

### Custom style props

The `createStyleProps` function used in the [Getting started](#getting-started)
section above generates a record of style prop utilities using type information
from
[`React.CSSProperties`](https://react.dev/learn/typescript#typing-style-props),
e.g.

```typescript
const styleProps = createStyleProps(["color", "padding"]);

// is equivalent to

const styleProps = {
  color: (color: React.CSSProperties["color"]) => ({ color }),
  padding: (padding: React.CSSProperties["padding"]) => ({ padding }),
};
```

To create a custom style prop, simply add an entry to this `styleProps` object,
with the prop name as the key, prop type as the function parameter, and
resulting CSS properties as the return value.

You can mix standard and custom style props using object-spread syntax:

```typescript
const styleProps = {
  ...createStyleProps(["color", "padding"]),
  marginX: (value: React.CSSProperties["marginTop"]) => ({
    marginLeft: value,
    marginRight: value,
  }),
};
```

## Browser support

| <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/chrome/chrome_24x24.png" alt="Chrome" /><br/>Chrome | <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/edge/edge_24x24.png" alt="Edge" /><br/>Edge | <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/safari/safari_24x24.png" alt="Safari" /><br/>Safari | <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/firefox/firefox_24x24.png" alt="Firefox" /><br/>Firefox | <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/opera/opera_24x24.png" alt="Opera" /><br/>Opera |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| <div align="center">49+</div>                                                                                             | <div align="center">16+</div>                                                                                     | <div align="center">10+</div>                                                                                             | <div align="center">31+</div>                                                                                                 | <div align="center">36+</div>                                                                                         |

## Contributing

Contributions are welcome. Please see the
[contributing guidelines](CONTRIBUTING.md) for more information.

## License

Embellish is offered under the [MIT license](LICENSE).
