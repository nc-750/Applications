import { createApp } from "vue";
import App from "./App.vue";
// The vendored flat stylesheet — only imported here in the dev playground,
// never by a library component (so the lib build emits zero CSS).
import "../style.css";

createApp(App).mount("#app");
