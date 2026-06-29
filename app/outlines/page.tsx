import { OutlinesClient } from "@/components/OutlinesClient";
import { outlines } from "@/lib/outlines";

export default function OutlinesPage() {
  return <OutlinesClient outlines={outlines} />;
}
