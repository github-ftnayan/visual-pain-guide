"use client";
import { Component, ReactNode } from "react";
import BodyMap from "@/components/BodyMap";
import MuscleSelector from "@/components/MuscleSelector";

interface SelectorProps {
  selectedMuscleId: string | null;
  onMuscleSelect: (muscleId: string) => void;
}

class BodyMapBoundary extends Component<
  SelectorProps & { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <MuscleSelector
          selectedMuscleId={this.props.selectedMuscleId}
          onMuscleSelect={this.props.onMuscleSelect}
        />
      );
    }
    return this.props.children;
  }
}

export default function BodyMapWithFallback(props: SelectorProps) {
  return (
    <BodyMapBoundary {...props}>
      <BodyMap {...props} />
    </BodyMapBoundary>
  );
}
