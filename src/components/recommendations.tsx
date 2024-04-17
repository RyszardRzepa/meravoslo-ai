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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useClampText } from "use-clamp-text";
import { useState } from "react";
import { getMutableAIState, useActions, useUIState } from "ai/rsc";
import { AI } from "@/app/action";
import BookingForm from "@/components/booking-form";

type Props = {
  title: string;
  data: {
    summary: string,
    images: [{ url: string, caption: string }],
    address: string,
    mapsUrl: string,
    bookingUrl: string,
    businessName: string,
    district: string,
  }[];
}

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
            className="reset-button text-blue-600 dark:text-blue-500 hover:underline"
            onClick={toggleExpanded}
          >
            ...
          </button>
        )}
      </p>
    </div>
  )
}

function Recommendations({ data, title }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useUIState<typeof AI>();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <p className="pb-2">{title}</p>
      <div className="flex gap-5 flex-col">
        {data.map((recommendation, index) => (
          <div key={index} className="flex flex-col gap-2">
            <CardTitle text={recommendation?.summary}/>
            <Carousel className="w-full relative">
              <CarouselContent>
                {recommendation?.images.map(image => (
                  <CarouselItem key={image.url}>
                    <article className="w-full relative isolate rounded-xl flex flex-col">
                      <img src={image?.url} className="w-full object-cover rounded-xl h:80 md:h-80"/>
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/10 rounded-xl "></div>
                      <div className="absolute bottom-0 p-2 overflow-hidden text-sm leading-6 text-gray-300">
                        <p className="line-clamp-1 hover:line-clamp-2">{image.caption}</p>
                      </div>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious/>
              <CarouselNext/>
            </Carousel>
            <div>
              <p className="text-sm">
                {recommendation?.businessName}, {" "}
                <span>
                  {recommendation.mapsUrl && (<Link
                    target="_blank"
                    href={recommendation?.mapsUrl}
                    className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                    {recommendation?.district}
                  </Link>)}
                </span>
              </p>
            </div>
            <form
              className="mt-1"
              onSubmit={(e) => {
                e.preventDefault();
                setDialogOpen(!dialogOpen);
              }}>
              <Button type="submit">
                Bestill bord
              </Button>
            </form>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(false)} modal>
        <DialogContent>
          <BookingForm setDialogOpen={setDialogOpen}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Recommendations;
