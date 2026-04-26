/**
 * Builds an invoke function for the editor runtime.
 *
 * Resolution order:
 * 1) explicit override (window.__CONFMAID_INVOKE__)
 * 2) provided bridge invoke (window.__FORGE_BRIDGE_INVOKE__)
 * 3) local fallback invoke (development/runtime-safe)
 */
export async function createInvokeAdapter(localInvoke) {
  if (typeof window.__CONFMAID_INVOKE__ === "function") {
    return window.__CONFMAID_INVOKE__;
  }

  if (typeof window.__FORGE_BRIDGE_INVOKE__ === "function") {
    return window.__FORGE_BRIDGE_INVOKE__;
  }

  return localInvoke;
}