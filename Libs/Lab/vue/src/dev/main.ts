import { createApp } from "vue";
import App from "./App.vue";
// The Lab stylesheet — loaded only here in the dev playground (a stand-in for
// the consumer's `lab.css`), never by a library component, so the lib build
// emits zero CSS. This satisfies the runtime guard's --nc-lab:750 check.
import "./lab.dev.css";

createApp(App).mount("#app");
