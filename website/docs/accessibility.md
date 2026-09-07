## Keyboard and tree behavior

The inspector uses tree, treeitem, and group semantics with one navigation tab stop and active-descendant focus. Arrow keys navigate; Home and End move to boundaries; type-ahead finds visible labels. Enter expands or follows references, Space selects, and F2 opens current-node actions. Search uses Enter for next and Shift+Enter for previous.

Selection, keyboard focus, and search matches have distinct states. Search controls and action controls participate in normal tab order. When replacing slots or using `unstyled`, preserve visible focus, contrast, target size, and the library-owned row interactions.

## Current verification status

Automated keyboard interaction and axe checks have run in Chromium, Firefox, and WebKit, including a 390px layout, RTL, grouping, and virtualized focus. SSR and hydration have been exercised with React 18.3.1 and 19.2.8.

These checks do not establish screen-reader compatibility. Manual VoiceOver with Safari and NVDA with Firefox or Chrome have not been completed and remain release-readiness work. Test the exact data shapes, slots, messages, browser versions, and assistive technologies required by your application.
