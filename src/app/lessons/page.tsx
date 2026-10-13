import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LessonsListView } from "./lessons-list-view";
import { lessonsLabPage } from "./lessons.const";

function generateMetadata(): Metadata {
  return buildMetadata("/lessons", {
    title: lessonsLabPage.title,
    description: lessonsLabPage.description,
  });
}

function LessonsLabPage() {
  return (
    <main>
      <LessonsListView />
    </main>
  );
}

export default LessonsLabPage;
export { generateMetadata };
