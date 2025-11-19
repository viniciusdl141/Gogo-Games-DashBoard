"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton"; // Importando Skeleton

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      showError("Please enter a prompt to generate an image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      // Simulate an API call to an AI image generation service
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

      // Placeholder image URL - replace with actual generated image URL
      const dummyImageUrl = `https://source.unsplash.com/random/800x600?${encodeURIComponent(prompt)}`;
      setImageUrl(dummyImageUrl);
      showSuccess("Image generated successfully!");
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Failed to generate image. Please try again.");
      showError("Failed to generate image.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="w-full shadow-lg border-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateImage} className="space-y-6">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="prompt" className="text-lg font-medium">Image Prompt</Label>
              <Input
                id="prompt"
                type="text"
                placeholder="A futuristic city at sunset, cyberpunk style"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                className="h-10 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button type="submit" className="w-full py-2 text-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
          </form>

          {error && (
            <p className="text-destructive text-center mt-6 text-sm">{error}</p>
          )}

          {isLoading && !imageUrl && (
            <div className="mt-8 text-center">
              <Skeleton className="w-full h-64 rounded-md mx-auto" />
              <p className="text-muted-foreground mt-4 animate-pulse">Generating your masterpiece...</p>
            </div>
          )}

          {imageUrl && (
            <div className="mt-8 text-center animate-fade-in">
              <h3 className="text-xl font-semibold mb-4">Generated Image:</h3>
              <img
                src={imageUrl}
                alt="Generated AI Image"
                className="max-w-full h-auto rounded-lg shadow-xl mx-auto border-2 border-border"
              />
            </div>
          )}

          {!imageUrl && !isLoading && !error && (
            <div className="mt-8 text-center text-muted-foreground flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg bg-muted/20 p-4">
              <ImageIcon className="h-16 w-16 mb-4 text-muted-foreground/60" />
              <p className="text-lg font-medium">Your generated image will appear here.</p>
              <p className="text-sm mt-1">Enter a prompt above and click "Generate Image".</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageGenerator;