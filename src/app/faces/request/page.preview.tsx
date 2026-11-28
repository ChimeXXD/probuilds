import { redirect } from "next/navigation";

// Request a face moved into Submit as its second tab (D-121 (5)). The host answers /faces/request with a 301
// (public/_redirects); this page is the static fallback: the export writes it as a page that sends the browser on.
export default function RequestFaceMoved() {
  redirect("/submit/request");
}
