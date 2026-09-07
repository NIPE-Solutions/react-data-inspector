## Scoped styles and specificity

Import `@nipe-solutions/react-data-inspector/styles.css` once. Default appearance uses zero-specificity selectors rooted in `[data-rdi-root]:not([data-rdi-unstyled])`. There is no global reset or CSS-in-JS runtime.

A consumer class can override the variables directly. DOM nesting and implementation class names are not a public contract.

## CSS variables

| Variable                    | Purpose                     | Light compact default                               |
| --------------------------- | --------------------------- | --------------------------------------------------- |
| `--rdi-font-family`         | Font stack                  | `ui-monospace, SFMono-Regular, Consolas, monospace` |
| `--rdi-font-size`           | Text size                   | `13px`                                              |
| `--rdi-line-height`         | Text line height            | `1.5`                                               |
| `--rdi-background`          | Surface                     | `#fff`                                              |
| `--rdi-foreground`          | Main text                   | `#262b33`                                           |
| `--rdi-muted`               | Secondary text              | `#656c78`                                           |
| `--rdi-key-color`           | Property labels             | `#344359`                                           |
| `--rdi-string-color`        | String values               | `#286547`                                           |
| `--rdi-number-color`        | Number and bigint values    | `#92500b`                                           |
| `--rdi-boolean-color`       | Boolean values              | `#794b91`                                           |
| `--rdi-null-color`          | Nullish and accessor values | `#76707c`                                           |
| `--rdi-special-color`       | Special type values         | `#315e8f`                                           |
| `--rdi-row-height`          | Uniform row height          | `28px`                                              |
| `--rdi-indent`              | Logical indentation step    | `18px`                                              |
| `--rdi-radius`              | Frame corner radius         | `6px`                                               |
| `--rdi-border-color`        | Frame and control border    | `#dfe2e7`                                           |
| `--rdi-hover-background`    | Hovered row                 | `#f2f4f6`                                           |
| `--rdi-selected-background` | Selected row                | `#e8edf5`                                           |
| `--rdi-focus-ring`          | Visible focus               | `#365f94`                                           |

Dark/system themes override color defaults. Comfortable density uses 36px rows; coarse pointers use 40px rows in the default styles. Consumer overrides still need to leave content readable and controls usable.

## Stable presence attributes

| Attribute             | Meaning                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `data-rdi-root`       | Inspector root                                                           |
| `data-rdi-tree`       | Tree navigation and scroll region                                        |
| `data-rdi-node`       | Meaningful navigation row                                                |
| `data-rdi-key`        | Key content                                                              |
| `data-rdi-value`      | Value content                                                            |
| `data-rdi-toggle`     | Expansion control                                                        |
| `data-rdi-actions`    | Node actions region                                                      |
| `data-rdi-reference`  | Reference content                                                        |
| `data-rdi-search`     | Search controls                                                          |
| `data-rdi-footer`     | Inspector footer                                                         |
| `data-rdi-unstyled`   | Root opts out of default appearance                                      |
| `data-rdi-delimiter`  | Decorative classic syntax: `open`, `close`, `comma`, `quote`, or `index` |
| `data-rdi-annotation` | Supplementary classic container notation                                 |
| `data-rdi-match`      | Row is a search match                                                    |

These attributes identify semantic parts without guaranteeing a specific DOM hierarchy.

## Stable state attributes

| Attribute               | Meaning                                     |
| ----------------------- | ------------------------------------------- |
| `data-type`             | Inspected row's resolved type               |
| `data-depth`            | Zero-based display depth                    |
| `data-expanded`         | Expansion state, `true` or `false`          |
| `data-selected`         | Selection state, `true` or `false`          |
| `data-focused`          | Navigation focus state, `true` or `false`   |
| `data-rdi-presentation` | Root presentation: `inspector` or `classic` |
| `data-theme`            | Root theme preference                       |
| `data-density`          | Root density choice                         |

Use logical CSS properties for RTL. Keep focus, selection, and search matching distinguishable: built-in styles outline focus, fill selection, and underline matches.

## Unstyled responsibilities

`unstyled` retains behavior and attributes but removes default appearance. Application CSS must provide:

- Tree overflow and row layout.
- Uniform single-line row height when virtualization is enabled.
- Logical indentation and readable type/value content.
- Visible keyboard focus distinct from selection.
- Usable controls, action feedback, and adequate contrast.

Set `virtualization={false}` when using wrapping or variable-height rows. Grouping and the visible-model limit remain active. Neither setting changes data inspection semantics.

The [unstyled playground](/playground?section=customization&appearance=unstyled) includes the complete design-system CSS and behavior. Use [customization](/guides/customization) for choosing among CSS, slots, types, actions, and controlled state.
