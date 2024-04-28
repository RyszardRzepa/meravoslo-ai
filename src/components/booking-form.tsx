'use client';

import { useState } from "react";
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
import { AI } from "@/app/actions/ai";
import posthog from 'posthog-js'

posthog.init('phc_YknfD4axmqkiYBRZXA4hSUF2QGnkweodW4mCju8FTjl', { api_host: 'https://eu.posthog.com' })

type Props = {
  setDialogOpen: (open: boolean) => void;
}

const BookingForm = ({ setDialogOpen }: Props) => {
  const [alertOpen, setAlertOpen] = useState(false);

  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitBookingState } = useActions<typeof AI>();

  const onBookingClick = async () => {
    setDialogOpen(false);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });

    const responseMessage = await submitBookingState("restaurant name");

    setMessages(currentMessages => [
      ...currentMessages,
      responseMessage,
    ]);
  }

  return (
    <div className="flex gap-4 flex-col">
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
