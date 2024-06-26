<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@embellish/react](./react.md) &gt; [Condition](./react.condition.md)

## Condition type

Represents a condition consisting of a single `S` value or a logical combination of multiple `S` values.

**Signature:**

```typescript
export declare type Condition<S> = S | {
    and: Condition<S>[];
    or?: undefined;
    not?: undefined;
} | {
    or: Condition<S>[];
    and?: undefined;
    not?: undefined;
} | {
    not: Condition<S>;
    and?: undefined;
    or?: undefined;
};
```
**References:** [Condition](./react.condition.md)

