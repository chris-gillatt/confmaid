import { invoke } from "@forge/bridge";

if (typeof window !== "undefined") {
  window.__FORGE_BRIDGE_INVOKE__ = invoke;
}

export { invoke };