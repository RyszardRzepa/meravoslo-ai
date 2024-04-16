'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { IconArrowElbow } from "@/components/ui/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useActions, useUIState } from "ai/rsc";
import { AI } from "@/app/action";

type Props = {
  setDialogOpen: (open: boolean) => void;
}

const BookingForm = ({ setDialogOpen }: Props) => {
  const [showIframe, setShowIframe] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitBookingState } = useActions<typeof AI>();

  const onBookingClick = async () => {
    setDialogOpen(false);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });

    const responseMessage = await submitBookingState();

    setMessages(currentMessages => [
      ...currentMessages,
      responseMessage,
    ]);
  }

  return (
    <div className="flex gap-4 flex-col">
      <div>
        <p className="text-lg semi-bold">Bordbestilling hos Maximus Trattoria</p>
      </div>

      {showIframe ? (
        <div className="w-full h-96 sm:h-[500px] gap-4 flex flex-col rounded">
          <iframe className="border rounded w-full h-full" src="https://booking.gastroplanner.no/maximus/t"/>
          <div>
            <Button onClick={() => setAlertOpen(true)}>Bekreft bordbestilling</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p>Skriv din epost</p>
          <form className="relative">
            <Input placeholder="Epost"/>
            <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4">
              <Button
                className="w-6 h-6"
                type="submit"
                size="icon"
                onClick={() => setShowIframe(true)}
              >
                <IconArrowElbow/>
              </Button>
            </div>
          </form>
        </div>
      )}

      <AlertDialog open={alertOpen} onOpenChange={() => setAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du klar for å bekrefte bordbestilling</AlertDialogTitle>
            <AlertDialogDescription>
              Some text explaining why?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lukk</AlertDialogCancel>
            <AlertDialogAction onClick={onBookingClick}>Bekreft bordbestilling</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BookingForm;
