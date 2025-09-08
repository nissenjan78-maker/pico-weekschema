// src/modules/access/index.js
export { AccessProvider, useAccess } from "./AccessProvider";
export { useHeaderUsers, useLockVisibleUser, useCanEdit } from "./hooks";
export { VisibleIfParent, HiddenOnChild, RequireParent } from "./guards";
