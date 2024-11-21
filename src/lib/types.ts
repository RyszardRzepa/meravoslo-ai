export enum Role {
  User = "user",
  Assistant = "assistant",
  Function = "function",
}

export enum SearchType {
  Search = "search",
  Inspirations = "inspirations",
}

export type Recommendation = {
  articleTitle: string;
  businessName: string;
  summary: string;
  images?: [{ url: string, alt: string }];
  address?: string;
  mapsUrl?: string;
  bookingUrl?: string;
  district?: string;
  openingHours?: string;
  articleUrl: string;
}

export enum TabName {
  EAT_DRINK = "eat_drink",
  ACTIVITIES = "activities",
  SEARCH = "search",
}
