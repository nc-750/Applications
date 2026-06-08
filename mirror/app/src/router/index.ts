import { createRouter, createWebHistory } from "vue-router";

import InterviewPage from "@/pages/InterviewPage.vue";
import InsightPage from "@/pages/InsightPage.vue";
import ProfilePage from "@/pages/ProfilePage.vue";
import SettingsPage from "@/pages/SettingsPage.vue";
import WelcomePage from "@/pages/WelcomePage.vue";

const Router = createRouter({
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
    }
  ]
})

export default Router;
