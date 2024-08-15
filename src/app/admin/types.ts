export type Business = {
  name: string;
  articleTitle: string;
  articleContent: string;
  images: Array<{ url: string; alt: string }>;
  tags: string[];
  address: string;
  googleMapsUrl: string;
  openingHours: string;
  district: string;
}
