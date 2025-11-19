"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

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
      // In a real application, you would replace this with an actual API call
      // For example:
      // const response = await fetch('/api/generate-image', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ prompt }),
      // });
      // if (!response.ok) {
      //   throw new Error('Failed to generate image');
      // }
      // const data = await response.json();
      // setImageUrl(data.imageUrl);

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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">AI Image Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateImage} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="prompt">Image Prompt</Label>
              <Input
                id="prompt"
                type="text"
                placeholder="A futuristic city at sunset, cyberpunk style"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
          </form>

          {error && (
            <p className="text-red-500 text-center mt-4">{error}</p>
          )}

          {imageUrl && (
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Generated Image:</h3>
              <img
                src={imageUrl}
                alt="Generated AI Image"
                className="max-w-full h-auto rounded-md shadow-lg mx-auto"
              />
            </div>
          )}

          {!imageUrl && !isLoading && !error && (
            <div className="mt-6 text-center text-muted-foreground flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p>Your generated image will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageGenerator;