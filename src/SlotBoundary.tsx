import { Component, type ReactNode } from 'react'
interface Props {
  children: ReactNode
  fallback: string
  resetKey: readonly unknown[]
}
interface State {
  failed: boolean
  resetKey: readonly unknown[]
}
export class SlotBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey }
  static getDerivedStateFromProps(
    props: Props,
    state: State,
  ): Partial<State> | null {
    return props.resetKey.length !== state.resetKey.length ||
      props.resetKey.some(
        (key, index) => !Object.is(key, state.resetKey[index]),
      )
      ? { failed: false, resetKey: props.resetKey }
      : null
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <span data-rdi-error>{this.props.fallback}</span>
    ) : (
      this.props.children
    )
  }
}
