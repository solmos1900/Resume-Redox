import type { Metadata } from "next";
import { BuilderApp } from "@/components/app/BuilderApp";

export const metadata: Metadata = {
  title: "Builder",
};

export default function BuilderPage() {
  return <BuilderApp />;
}
