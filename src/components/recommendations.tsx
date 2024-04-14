'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

type RecommendationsProps = {
  response: string;
  recommendations: {
    title: string,
    description: string,
    images: [{ url: string, caption: string }],
    address: string,
    mapsUrl: string,
    bookingUrl?: URL
  }[];
}

function Recommendations(data: RecommendationsProps) {
  const router = useRouter();

  return (
    <div>
      <h2 className="pb-2">{data.response}</h2>
      <div className="flex gap-3 flex-col">
        {data.recommendations.map((recommendation, index) => (
          <Card key={index} className="flex flex-col gap-4 p-4">
            <b>{recommendation?.title}</b>
            <p>{recommendation?.description}</p>
            <Carousel className="w-full">
              <CarouselContent>
                {recommendation.images.map(image => (
                  <CarouselItem key={image.url}>
                    <div className="p-1 w-full">
                      <img src={image?.url} className="w-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <div className="text-sm">
              <p>Address: {' '}
                <span>
                  {recommendation.mapsUrl && (<Link
                    target="_blank"
                    href={recommendation?.mapsUrl}
                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                    {recommendation?.address}
                  </Link>)}
                  </span>
              </p>
            </div>
            <Button onClick={() => router.push(recommendation?.bookingUrl)}>Bestill bord</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Recommendations;
