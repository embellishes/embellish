declare const __brand: unique symbol;

/**
 * Creates a branded type to add a unique symbol for type differentiation.
 *
 * @public
 */
export type Branded<T, B> = T & { [__brand]: B };

const [space, newline] =
  // @ts-expect-error bundler expected to replace `process.env.NODE_ENV` expression
  process.env.NODE_ENV === "development" ? [" ", "\n"] : ["", ""];

/**
 * Converts a string into a union type of its unique characters.
 *
 * @typeParam S - The string to extract characters from.
 * @typeParam Acc - An accumulator to build the union of characters.
 *
 * @public
 */
export type Chars<S, Acc = never> = S extends `${infer Head}${infer Tail}`
  ? Chars<Tail, Acc | Head>
  : Acc;

/**
 * Represents an uppercase letter (A-Z).
 *
 * @public
 */
export type UppercaseLetter = Chars<"ABCDEFGHIJKLMNOPQRSTUVWXYZ">;

/**
 * Represents a letter (uppercase or lowercase).
 *
 * @public
 */
export type Letter = UppercaseLetter | Lowercase<UppercaseLetter>;

/**
 * Represents a digit (0-9).
 *
 * @public
 */
export type Digit = Chars<"0123456789">;

/**
 * Ensures that the string `S` contains only the characters `C`.
 *
 * @typeParam C - Allowable characters.
 * @typeParam S - The string to check.
 *
 * @public
 */
export type OnlyChars<C, S> = S extends `${infer Head}${infer Tail}`
  ? Head extends C
    ? unknown & OnlyChars<C, Tail>
    : never
  : unknown;

/**
 * Ensures that a condition name is alphanumeric.
 *
 * @public
 */
export type ValidConditionName<Name> = Name extends `${Letter}${infer Tail}`
  ? OnlyChars<Letter | Digit, Tail>
  : never;

/**
 * A condition consisting of a single `S` value or a logical combination of
 * multiple `S` values
 *
 * @typeParam S - a simple condition; either a hook id or a condition name
 *
 * @public
 */
export type Condition<S> =
  | S
  | { and: Condition<S>[]; or?: undefined; not?: undefined }
  | { or: Condition<S>[]; and?: undefined; not?: undefined }
  | { not: Condition<S>; and?: undefined; or?: undefined };

/**
 * Represents a hook implementation consisting of either a basic CSS selector or an at-rule.
 *
 * @public
 */
export type Selector =
  | `${string}&${string}`
  | `@${"media" | "container" | "supports"} ${string}`;

/**
 * Represents a unique hook identifier.
 *
 * @public
 */
export type HookId = Branded<string, "HookId">;

/** @internal */
export function createHooks<Selectors extends Selector[]>(
  selectors: Selectors,
) {
  const hooks = Object.fromEntries(
    selectors.map(selector => [selector, createHash(selector)]),
  ) as { [Hook in Selectors[number]]: HookId };
  return {
    styleSheet() {
      const indent = Array(2).fill(space).join("");
      return `*${space}{${newline}${Object.entries(hooks)
        .flatMap(([, id]) => [
          `${indent}--${id}-0:${space}initial;`,
          `${indent}--${id}-1:${space};`,
        ])
        .join(newline)}${newline}}${newline}${Object.entries(hooks)
        .flatMap(([def, id]) => {
          if (def.startsWith("@")) {
            return [
              `${def} {`,
              `${indent}* {`,
              `${indent}${indent}--${id}-0:${space};`,
              `${indent}${indent}--${id}-1:${space}initial;`,
              `${indent}}`,
              "}",
            ];
          }
          return [
            `${def.replace(/&/g, "*")}${space}{`,
            `${indent}--${id}-0:${space};`,
            `${indent}--${id}-1:${space}initial;`,
            "}",
          ];
        })
        .join(newline)}`;
    },
    hooks,
  };
}

/**
 * A record of conditions that map to hook ids or combinations using `and`, `or`,
 * and `not` operators.
 *
 * @typeParam ConditionName - The type of the condition names.
 *
 * @public
 */
export type Conditions<ConditionName extends string> = Branded<
  Record<ConditionName, Condition<HookId>>,
  "Conditions"
>;

/**
 * Creates the specified conditions based on available hooks.
 *
 * @param hooks - The hooks available as the basis for conditions.
 * @param conditions - The conditions to create based on the available hooks.
 *
 * @returns The conditions available for use by a component.
 *
 * @public
 */
export function createConditions<
  Hooks extends Record<string, HookId>,
  ConditionsConfig extends Record<string, unknown>,
>(
  hooks: Hooks,
  conditions: ConditionsConfig & {
    [ConditionName in keyof ConditionsConfig]: ValidConditionName<ConditionName> &
      Condition<keyof Hooks>;
  },
) {
  return Object.fromEntries(
    (
      Object.entries(conditions) as [
        keyof ConditionsConfig,
        Condition<keyof Hooks>,
      ][]
    ).map(([conditionName, condition]) => [
      conditionName,
      (function expand(condition: Condition<keyof Hooks>): Condition<HookId> {
        if (typeof condition === "string") {
          return hooks[condition] as HookId;
        }
        if (typeof condition === "object") {
          if (condition.and) {
            return { and: condition.and.map(expand) };
          }
          if (condition.or) {
            return { or: condition.or.map(expand) };
          }
          if (condition.not) {
            return { not: expand(condition.not) };
          }
        }
        throw new Error(`Invalid condition: ${JSON.stringify(condition)}`);
      })(condition),
    ]),
  ) as keyof ConditionsConfig extends string
    ? Conditions<keyof ConditionsConfig>
    : never;
}

export function createLocalConditions<
  Conditions extends ReturnType<typeof createConditions>,
  LocalConditions,
>(
  conditions: Conditions,
  localConditions: LocalConditions & {
    [ConditionName in keyof LocalConditions]: ValidConditionName<ConditionName> &
      Condition<keyof Conditions>;
  },
) {
  return {
    get conditionNames() {
      return Object.keys(conditions || {}).concat(
        Object.keys(localConditions || {}),
      ) as (keyof Conditions | keyof LocalConditions)[];
    },
    conditionalDeclarationValue(
      conditionName: keyof Conditions | keyof LocalConditions,
      valueIfTrue: string,
      valueIfFalse: string,
    ) {
      const condition =
        conditionName in localConditions
          ? (function expand(
              condition: Condition<keyof typeof conditions>,
            ): Condition<HookId> {
              if (typeof condition === "string") {
                return conditions[condition] as HookId;
              }
              if (condition && typeof condition === "object") {
                if (condition.and) {
                  return { and: condition.and.map(expand) };
                }
                if (condition.or) {
                  return { or: condition.or.map(expand) };
                }
                if (condition.not) {
                  return { not: expand(condition.not) };
                }
              }
              throw new Error(
                `Invalid condition: ${JSON.stringify(condition)}`,
              );
            })(localConditions[conditionName as keyof LocalConditions])
          : (conditions[
              conditionName as keyof Conditions
            ] as Condition<HookId>);

      return (function buildExpression(
        condition: Condition<HookId>,
        valueIfTrue: string,
        valueIfFalse: string,
      ): string {
        if (typeof condition === "string") {
          return `var(--${condition}-1, ${valueIfTrue}) var(--${condition}-0, ${valueIfFalse})`;
        }
        if (condition.and) {
          const [head, ...tail] = condition.and;
          if (!head) {
            return valueIfTrue;
          }
          if (tail.length === 0) {
            return buildExpression(head, valueIfTrue, valueIfFalse);
          }
          return buildExpression(
            head,
            buildExpression({ and: tail }, valueIfTrue, valueIfFalse),
            valueIfFalse,
          );
        }
        if (condition.or) {
          return buildExpression(
            { and: condition.or.map(not => ({ not })) },
            valueIfFalse,
            valueIfTrue,
          );
        }
        if (condition.not) {
          return buildExpression(condition.not, valueIfFalse, valueIfTrue);
        }
        throw new Error(`Invalid condition: ${JSON.stringify(condition)}`);
      })(condition, valueIfTrue, valueIfFalse);
    },
  };
}

function createHash(obj: unknown) {
  const jsonString = JSON.stringify(obj);

  let hashValue = 0;

  for (let i = 0; i < jsonString.length; i++) {
    const charCode = jsonString.charCodeAt(i);
    hashValue = (hashValue << 5) - hashValue + charCode;
    hashValue &= 0x7fffffff;
  }

  const str = hashValue.toString(36);

  return /^[0-9]/.test(str) ? `a${str}` : str;
}
