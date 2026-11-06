import { NotFoundContent } from "@/components/layout/NotFoundContent";
import MarketingLayout from "./(marketing)/layout";

/* Hiçbir rotayla eşleşmeyen derin adresler için; site çerçevesiyle birlikte gerçek 404 döner. */

export default function RootNotFound() {
  return (
    <MarketingLayout>
      <NotFoundContent />
    </MarketingLayout>
  );
}
