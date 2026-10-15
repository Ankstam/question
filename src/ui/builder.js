import htmlTemplate from "./index.html";
import styles from "./styles.css";

import coreScript from "../client/01-core.client.js";
import historyScript from "../client/02-history.client.js";
import layoutScript from "../client/03-layout.client.js";
import parserScript from "../client/04-parser.client.js";
import diagramScript from "../client/05-diagram.client.js";
import rendererScript from "../client/06-renderer.client.js";
import exportScript from "../client/07-export.client.js";

export function buildDocumentHTML(initialData) {
  const jsonStr = JSON.stringify(initialData, null, 2);

  const clientScripts = [
    coreScript,
    historyScript,
    layoutScript,
    parserScript,
    diagramScript,
    rendererScript,
    exportScript
  ].join("\n\n");

  return htmlTemplate
    .replace("/*__INJECT_STYLES__*/", () => styles)
    .replace("<!--__INJECT_INITIAL_JSON__-->", () => jsonStr)
    .replace("/*__INJECT_CLIENT_SCRIPTS__*/", () => clientScripts);
}
