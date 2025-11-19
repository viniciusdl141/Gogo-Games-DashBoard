import { MadeWithDyad } from "@/components/made-with-dyad";
import ImageGenerator from "@/components/ImageGenerator";
import { ThemeToggle } from "@/components/ThemeToggle"; // Importando ThemeToggle

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground py-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl px-4">
        <ImageGenerator />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;