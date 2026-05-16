import { redirect } from "next/navigation";

export default function CosmeticsPage() {
  // Page désactivée car la requête charge trop de cosmétiques
  redirect("/shop");
}
