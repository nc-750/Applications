import { createRouter, createWebHistory } from "vue-router";

import InterviewPage from "@/pages/InterviewPage.vue";
import InsightPage from "@/pages/InsightPage.vue";
import PrivacyPage from "@/pages/PrivacyPage.vue";
import ProfilePage from "@/pages/ProfilePage.vue";
import SettingsPage from "@/settings/pages/SettingsPage.vue";
import WelcomePage from "@/welcome/WelcomePage.vue";

const Router = createRouter({
  scrollBehavior() {
    return { top: 0 };
  },
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "welcome",
      component: WelcomePage
    },
    {
      path: "/interview",
      name: "interview",
      component: InterviewPage
    },
    {
      path: "/insight",
      name: "insight",
      component: InsightPage
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfilePage
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsPage
    },
    {
      path: "/privacy",
      name: "privacy",
      component: PrivacyPage
    }
  ]
})

Router.afterEach(() => {
  // Focus the main content area after navigation for screen readers (WCAG 2.4.3)
  const mainEl = document.getElementById("main-content");
  if (mainEl) {
    mainEl.focus({ preventScroll: true });
  }
});

export default Router;
