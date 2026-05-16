import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WeldDesign Production",
    short_name: "WeldDesign",
    description:
      "Aplikasi produksi las, inventaris, estimasi biaya, portofolio, e-learning, dan client portal.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ee",
    theme_color: "#181716",
    categories: ["productivity", "education", "business"],
    lang: "id",
  };
}
