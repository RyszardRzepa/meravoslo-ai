export type Business = {
  id?: number;
  name: string;
  articleTitle: string;
  articleContent: string;
  articleUrl: string;
  images: Array<{ url: string; alt: string }>;
  tags: string[];
  address?: string;
  mapsUrl?: string;
  googleMapsUrl?: string;
  openingHours?: string;
  district?: string;
  bookingUrl?: string;
  websiteUrl?: string;
  menuText?: string;
  foodMenuUrl?: string;

}
