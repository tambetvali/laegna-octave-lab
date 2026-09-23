import { Layout } from "@/components/Layout";
import { ConceptsPage } from "@/pages/ConceptsPage";
import { EssaysPage } from "@/pages/EssaysPage";
import { FourierPage } from "@/pages/FourierPage";
import { LandingPage } from "@/pages/LandingPage";
import { LovePage } from "@/pages/LovePage";
import { NotebookPage } from "@/pages/NotebookPage";
import { ProjectionPage } from "@/pages/ProjectionPage";
import { TranscendencePage } from "@/pages/TranscendencePage";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const transcendenceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transcendence",
  component: TranscendencePage,
});

const loveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/love",
  component: LovePage,
});

const fourierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fourier",
  component: FourierPage,
});

const projectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projection",
  component: ProjectionPage,
});

const notebookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notebook",
  component: NotebookPage,
});

const essaysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/essays",
  component: EssaysPage,
});

const conceptsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/concepts",
  component: ConceptsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  transcendenceRoute,
  loveRoute,
  fourierRoute,
  projectionRoute,
  notebookRoute,
  essaysRoute,
  conceptsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
