const K_BUILD = "hm_build_new_flow";
const K_REMODEL = "hm_remodel_flow";

const defaultBuild = { preV0: false, postV0: false, v0: false, architectComment: "" };
const defaultRemodel = { preV0: false, postV0: false, v0: false, architectComment: "" };

function safeParse(raw, d) {
  try {
    return { ...d, ...JSON.parse(raw || "{}") };
  } catch {
    return { ...d };
  }
}

export function getBuildFlow() {
  return safeParse(
    typeof localStorage !== "undefined" ? localStorage.getItem(K_BUILD) : null,
    defaultBuild
  );
}

export function setBuildFlow(partial) {
  const n = { ...getBuildFlow(), ...partial, updatedAt: Date.now() };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(K_BUILD, JSON.stringify(n));
  }
  return n;
}

export function getRemodelFlow() {
  return safeParse(
    typeof localStorage !== "undefined" ? localStorage.getItem(K_REMODEL) : null,
    defaultRemodel
  );
}

export function setRemodelFlow(partial) {
  const n = { ...getRemodelFlow(), ...partial, updatedAt: Date.now() };
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(K_REMODEL, JSON.stringify(n));
  }
  return n;
}
