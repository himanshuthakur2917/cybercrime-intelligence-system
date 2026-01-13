"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()

  return (
    <div className="h-screen w-full flex justify-center items-center bg-background">
      {/* Dashboard Push Button */}
      <div className="flex justify-center items-center gap-5">
        <Button
          onClick={() => {
            router.push("/dashboard");
          }}
        >
          Go to Dashboard
        </Button>
        <Button
          onClick={() => {
            router.push("/admin")
          }}
        >
          Go to Admin
        </Button>
      </div>

      {/* Add login page here , dont create any component for this page */}
    </div>
  );
}
