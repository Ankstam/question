import { EMPTY_PAPER } from "./config/constants.js";
import { handlePaperPost } from "./api/paper.js";
import { buildDocumentHTML } from "./ui/builder.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/paper") {
      return handlePaperPost(request);
    }

    return new Response(buildDocumentHTML(EMPTY_PAPER), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
};
