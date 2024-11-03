'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Recommendation } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger
} from "@/components/ui/sheet";
import { useState } from "react";

const CardTitle = ({ text }: { text: string }) => {
  return (
    <div>
      <p>
        {text}
      </p>
    </div>
  )
}

function Recommendations({ data }: {  data: Recommendation[] }) {
  const router = useRouter();
  const [selectedUrl, setSelectedUrl] = useState<string>("https://meravoslo.no/chat-start");

  const sortedData = [...data].sort((a, b) => {
    if (a.images?.length && !b.images?.length) return -1;
    if (!a.images?.length && b.images?.length) return 1;
    return 0;
  });

  return (
      <div className="flex gap-5 flex-col rounded-lg">
        {sortedData.map((recommendation, index) => (
          <div key={index} className="flex flex-col gap-2">
            <CardTitle text={recommendation?.summary}/>
            {!!recommendation?.images?.length && (
              <Carousel className="w-full relative">
                <CarouselContent>
                  {recommendation?.images?.map(image => (
                    <CarouselItem key={image.url}>
                      <article className="w-full relative isolate rounded-xl flex flex-col">
                        <img src={image?.url} className="h-72 w-full rounded-xl object-cover"/>
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/10 rounded-xl "></div>
                      <div className="absolute bottom-0 p-2 overflow-hidden text-sm leading-6 text-gray-300">
                        <p className="line-clamp-1 hover:line-clamp-2">{image.alt}</p>
                      </div>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {recommendation?.images?.length >=2 &&  <CarouselPrevious/>}
              {recommendation?.images?.length >=2 && <CarouselNext/>}
            </Carousel>
            )}
            <div className="mb-1 gap-1 flex flex-col">
              <p className="text-sm text-gray-600">
                {recommendation?.businessName}, {" "}
                <span>
                  {recommendation?.mapsUrl && (
                    <Link
                      target="_blank"
                      href={recommendation?.mapsUrl}
                      className="text-sm hover:underline"
                    >
                      {recommendation?.district}
                    </Link>)}
                </span>
              </p>
              {recommendation?.bookingUrl && recommendation.articleUrl && (
                  <SheetTrigger
                    asChild
                    onClick={() => {
                      setSelectedUrl(recommendation.articleUrl);
                    }}>
                    <p className="text-sm cursor-pointer">Les mer på <span className="underline"> {recommendation.articleTitle}</span></p>
                  </SheetTrigger>
              )}
            </div>
            {recommendation?.bookingUrl ?
              <form
                className="mt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(`/booking?bn=${recommendation?.businessName}&bu=${recommendation?.bookingUrl || ""}`);
                }}
              >
                <Button type="submit">
                  Bestill bord
                </Button>
              </form> :
              <SheetTrigger
                asChild
                onClick={() => {
                  setSelectedUrl(recommendation.articleUrl);
                }}>
                <p className="">Les mer på <span className="text-blue-600 dark:text-blue-500 hover:underline"> {recommendation.articleTitle}</span></p>
              </SheetTrigger>
            }
            {index < data.length - 1 && (
              <Separator className="my-4"/>
            )}
          </div>

        ))}
        <SheetContent side="bottom" className="bg-white h-[97dvh] p-0 rounded-lg">
          <SheetHeader className="px-6 py-3 bg-gray-200 rounded-t-lg">
            <SheetDescription>
              Meravoslo AI
            </SheetDescription>
          </SheetHeader>
          <iframe src={selectedUrl} className="w-full h-full"/>
        </SheetContent>
      </div>
  );
}

export default Recommendations;
