import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { friendsPage } from "./friends.const";
import { FriendsPage } from "./friends-view";
import "./friends.scss";

export function generateMetadata(): Metadata {
  return buildMetadata("/ban-be", {
    title: friendsPage.title,
    description: friendsPage.description,
  });
}

export default function Page() {
  return <FriendsPage />;
}
