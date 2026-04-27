import { createFileRoute } from "@tanstack/react-router";
import { HeartLinkApp } from "@/components/heartlink/HeartLinkApp";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "HeartLink — A Daily Ritual of Connection" },
      {
        name: "description",
        content:
          "HeartLink is a dating app built around Sparks — a daily question your match must answer before midnight. Then, the simultaneous reveal.",
      },
    ],
  }),
});

function Index() {
  return <HeartLinkApp />;
}
