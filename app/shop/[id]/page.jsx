import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ClientItemDetails from "./ClientItemDetails";

export const dynamic = 'force-dynamic';

async function getItemDetails(id) {
  try {
    const res = await fetch("http://localhost:3000/api/shop", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data.find(item => item.id === id) || null;
  } catch (err) {
    return null;
  }
}

export default async function ItemDetailsPage({ params }) {
  const resolvedParams = await params;
  // Next.js passes the route segment as-is, already decoded by the router
  // For safety, ensure we handle both encoded and non-encoded IDs
  let itemId = resolvedParams.id;
  
  // Try to decode if it looks encoded (contains %xx patterns)
  if (itemId.includes('%')) {
    try {
      itemId = decodeURIComponent(itemId);
    } catch (e) {
      // If decoding fails, use as-is
    }
  }
  
  const item = await getItemDetails(itemId);
  
  if (!item) {
    return (
      <main className="min-h-screen bg-[#091C3E] text-white">
        <Navbar />
        <div className="pt-40 text-center pb-40">
          <h1 className="text-4xl font-display mb-4">OBJET INTROUVABLE</h1>
          <a href="/shop" className="text-[#31BBE6] underline font-semibold">Retour à la boutique</a>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#091C3E] to-[#122A59] text-white overflow-x-hidden pt-[120px] pb-[60px] relative">
      {/* Animated BG */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#31BBE6] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#A936DA] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[#FFF12B] rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
      </div>

      <Navbar />
      
      <ClientItemDetails item={item} />

      <Footer />
    </main>
  );
}
