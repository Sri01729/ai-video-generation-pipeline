'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VideoBuilderPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Sequence Video Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Assemble your images into dynamic videos
          </p>
          {/* Add video building controls here */}
        </CardContent>
      </Card>
    </div>
  );
}