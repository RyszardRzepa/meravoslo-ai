export enum Role {
  User = "user",
  Assistant = "assistant",
}

export type Recommendation = {
  businessName: string;
  summary: string;
  images?: [{ url: string, alt: string }];
  address?: string;
  mapsUrl?: string;
  bookingUrl?: string;
  district?: string;
  openingHours?: string;
}

export enum TabName {
  EAT_DRINK = "eat_drink",
  ACTIVITIES = "activities",
}
