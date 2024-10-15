export type Business = {
  id?: number;
  name: string;
  articleTitle: string;
  articleContent: string;
  images: Array<{ url: string; alt: string }>;
  tags: string[];
  address: string;
  mapsUrl: string;
  googleMapsUrl?: string;
  openingHours: string;
  district: string;
}
