import { Component, type ErrorInfo, type ReactNode } from "react";

type HeroModelErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type HeroModelErrorBoundaryState = {
  hasError: boolean;
};

/** Captura falhas de carregamento do GLTF e exibe fallback 3D. */
export class HeroModelErrorBoundary extends Component<
  HeroModelErrorBoundaryProps,
  HeroModelErrorBoundaryState
> {
  state: HeroModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): HeroModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[HeroModelErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
