import { invoke, view } from "@forge/bridge";

if (typeof window !== "undefined") {
  window.__FORGE_BRIDGE_INVOKE__ = invoke;
  window.__FORGE_BRIDGE_VIEW__ = view;
}

export { invoke, view };
