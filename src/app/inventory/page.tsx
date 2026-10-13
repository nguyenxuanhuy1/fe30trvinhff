import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { InventoryView, inventoryPage } from "@/modules/inventory";

function generateMetadata(): Metadata {
  return buildMetadata("/inventory", {
    title: inventoryPage.title,
    description: inventoryPage.description,
  });
}

function InventoryPage() {
  return <InventoryView />;
}

export default InventoryPage;
export { generateMetadata };
