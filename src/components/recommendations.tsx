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
import { useClampText } from "use-clamp-text";
import { useState } from "react";
import { Recommendation } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

const CardTitle = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);

  const [ref, { noClamp, clampedText, key }] = useClampText({
    text,
    lines: 2,
    ellipsis: 12.5,
    expanded
  });

  const toggleExpanded = () => setExpanded((state) => !state);

  return (
    // @ts-ignore
    <div ref={ref} key={key}>
      <p>
        {clampedText}
        {!noClamp && (
          <button
            className="px-1 text-blue-600 dark:text-blue-500 hover:underline"
            onClick={toggleExpanded}
          >
            <p className="">... 👇</p>
          </button>
        )}
      </p>
    </div>
  )
}

function Recommendations({ data }: {  data: Recommendation[] }) {
  const router = useRouter();

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
                        <img src={image?.url} className="h-96 w-full rounded-xl object-cover"/>
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/10 rounded-xl "></div>
                      <div className="absolute bottom-0 p-2 overflow-hidden text-sm leading-6 text-gray-300">
                        <p className="line-clamp-1 hover:line-clamp-2">{image.alt}</p>
                      </div>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {recommendation?.images?.length && <CarouselPrevious/>}
              {recommendation?.images?.length && <CarouselNext/>}
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
                <p className="text-sm">Les mer på <span className="italic">
                   <Link
                     className="font-sm  hover:underline"
                     target="_blank"
                     rel="noopener noreferrer"
                     href={String(recommendation.articleUrl)}>
                      {recommendation.articleTitle}
                   </Link>
                </span>
                </p>)}
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
              <p>Les mer på <span className="italic">
                   <Link
                     className="text-blue-600 dark:text-blue-500 hover:underline"
                     target="_blank"
                     rel="noopener noreferrer"
                     href={String(recommendation.articleUrl)}>
                  {recommendation.articleTitle}
                   </Link>
                </span></p>
            }
            {index < data.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>

        ))}
      </div>
  );
}

export default Recommendations;
