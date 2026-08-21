import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GizmoAttack } from "@/components/gizmo-attack";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GizmoAttack />
  </StrictMode>,
);
