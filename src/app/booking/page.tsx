'use client';

import { useRouter, useSearchParams } from "next/navigation";
import {  useState } from "react";
import ChatHeader from "@/components/chat-header";
import { useActions, useUIState } from "ai/rsc";
import { AI } from "@/app/actions/ai";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { saveBooking } from "@/app/actions/db";
import { TabName } from "@/lib/types";
import { BotMessage } from "@/components/message";

const ConfirmBookingAlert = ({ placeName, open, setOpen, bookingUrl }: { placeName: string, open: boolean, setOpen: (val: boolean) => void, bookingUrl: string }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const [, setMessages] = useUIState<typeof AI>();

  const { submitBookingState } = useActions<typeof AI>();
  const restaurantName = useSearchParams().get("bn");
  const params = useSearchParams()

  const onBookingComplete = async () => {
    setLoading(true);
    const responseMessage = await submitBookingState(restaurantName!);
    setMessages(currentMessages => [
      ...currentMessages,
      { ...responseMessage,
        name: TabName.EAT_DRINK,
        id: Date.now(),
        display: <BotMessage>{responseMessage?.display}</BotMessage>
      },
    ]);

    router.push("/");

    await saveBooking({ bookingUrl, businessName: params.get("bn")! });

    setTimeout(() => {
      const element = document.getElementById('chat-list-end');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 500)

    setLoading(false);
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gjennomførte du alle stegene og fikk bekreftelse fra restauranten på e-post eller sms?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Lukk</AlertDialogCancel>
          <AlertDialogAction onClick={onBookingComplete}>{loading ? "Bekrefter booking" : "Ja"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function BookingPage() {
  const params = useSearchParams()
  const [alertOpen, setAlertOpen] = useState(false);

  const router = useRouter();
  const bookingUrl = params.get("bu") ? params.get("bu")! : "https://booking.gastroplanner.no/maximus/t";
  const placeName = params.get("bn")

  return (
    <div className="flex flex-col">
      <ChatHeader/>

      <div className="pb-4">
        <div className="pb-2">
          <p className="text-lg semi-bold">Bestill bord på {placeName}</p>
        </div>

        <div
          className="h-[70vh] flex items-center justify-center my-2 border bg-peach text-primary rounded-md">
          <iframe
            className="border rounded w-full h-full"
            src={bookingUrl}
          />
        </div>

        <div className="flex mt-4 gap-4 justify-end">
          <Button
            onClick={router.back}
            size="sm"
            variant="secondary"
          >
            Jeg venter med å booke
          </Button>
          <Button size="sm" onClick={() => setAlertOpen(true)}>
            Da har jeg booket
          </Button>
        </div>

        <ConfirmBookingAlert placeName={placeName!} open={alertOpen} setOpen={setAlertOpen} bookingUrl={bookingUrl}/>
      </div>
    </div>
  )
}
