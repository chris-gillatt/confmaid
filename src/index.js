const handlers = require("./resolverHandlers");

async function localHandler(request) {
  const payload = request?.payload || {};
  const context = request?.context || {};
  const operation = payload.operation || "healthcheck";
  const operationHandler = handlers[operation] || handlers.healthcheck;

  return operationHandler(payload, context);
}

function buildForgeDefinitions() {
  let ResolverCtor;
  try {
    const resolverModule = require("@forge/resolver");
    ResolverCtor = resolverModule.default || resolverModule.Resolver || resolverModule;
  } catch {
    return localHandler;
  }

  if (typeof ResolverCtor !== "function") {
    return localHandler;
  }

  const resolver = new ResolverCtor();
  resolver.define("healthcheck", handlers.healthcheck);
  resolver.define("validate", handlers.validate);
  resolver.define("render", handlers.render);
  resolver.define("loadMacroConfig", handlers.loadMacroConfig);
  resolver.define("saveMacroConfig", handlers.saveMacroConfig);
  resolver.define("renderFromMacroConfig", handlers.renderFromMacroConfig);
  return resolver.getDefinitions();
}

module.exports = {
  handler: buildForgeDefinitions(),
  localHandler,
};
