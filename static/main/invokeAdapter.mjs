/**
 * Builds an invoke function for the editor runtime.
 *
 * Resolution order:
 * 1) explicit override (window.__CONFMAID_INVOKE__)
 * 2) provided bridge invoke (window.__FORGE_BRIDGE_INVOKE__)
 * 3) dynamic import of @forge/bridge via ESM CDN
 * 4) local fallback invoke (development/runtime-safe)
 */
export async function createInvokeAdapter(localInvoke) {
  if (typeof window.__CONFMAID_INVOKE__ === "function") {
    return window.__CONFMAID_INVOKE__;
  }

  if (typeof window.__FORGE_BRIDGE_INVOKE__ === "function") {
    return window.__FORGE_BRIDGE_INVOKE__;
  }

  try {
    const forgeBridge = await import("https://esm.sh/@forge/bridge@4");
    if (typeof forgeBridge.invoke === "function") {
      return forgeBridge.invoke;
    }
  } catch (_error) {
    // Keep local fallback path when bridge import is unavailable.
  }

  return localInvoke;
}