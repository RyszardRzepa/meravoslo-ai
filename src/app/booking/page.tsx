'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import ChatHeader from "@/components/chat-header";
import {
  Step,
  type StepItem,
  Stepper,
  useStepper,
} from "@/components/stepper";
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
import { saveBookingEmail, updateBooking } from "@/app/actions/db";

const steps = [
  { label: "Bestill bord" },
  { label: "Bekreft bestilling" },
] satisfies StepItem[];

const ConfirmBookingAlert = ({ open, setOpen }: { open: boolean, setOpen: (val: boolean) => void }) => {
  const { nextStep } = useStepper()

  const onComplete = () => {
    setOpen(false);
    nextStep();
  }

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gjennomførte du alle stegene og fikk bekreftelse fra restauranten på e-post eller sms?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Lukk</AlertDialogCancel>
          <AlertDialogAction onClick={onComplete}>Ja</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const Footer = ({ canGoNext, setAlertOpen, onEmailSave, bookingId }: {
  canGoNext: () => boolean,
  setAlertOpen: (val: boolean) => void
  onEmailSave: () => Promise<void>
  bookingId: number | null
}) => {
  const {
    nextStep,
    prevStep,
    isDisabledStep,
    hasCompletedAllSteps,
    isLastStep,
    isOptionalStep,
    activeStep,
  } = useStepper();

  const [, setMessages] = useUIState<typeof AI>();
  const router = useRouter()
  const { submitBookingState } = useActions<typeof AI>();
  const restaurantName = useSearchParams().get("bn");

  const onClickNext = () => {
    // if (!canGoNext()) return

    // if (activeStep === 0) {
    //   onEmailSave();
    // }

    if (activeStep === 0) {
      setAlertOpen(true);
      return;
    }

    nextStep();
  }

  const onBookingComplete = async () => {
    const responseMessage = await   submitBookingState(restaurantName!);
    setMessages(currentMessages => [
      ...currentMessages,
      responseMessage,
    ]);

    router.push("/")

    setTimeout(() => {
      const element = document.getElementById('chat-list');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 500)

    // Confirm booking
    await updateBooking({
      id: bookingId!,
      data: { bookingConfirmed: true }
    })
  }

  return (
    <>
      {hasCompletedAllSteps && (
        <div
          className="h-96 flex items-center justify-center my-2 border border-peachDark bg-peach text-primary rounded-md">
          <h1 className="text-xl">Woohoo! All steps completed! 🎉</h1>
        </div>
      )}
      <div className="w-full flex justify-end gap-2">
        {hasCompletedAllSteps ? (
          <Button size="sm" onClick={onBookingComplete}>
            Ferdig
          </Button>
        ) : (
          <>
            {activeStep === 0 && (
              <Button
                // disabled={isDisabledStep}
                onClick={prevStep}
                size="sm"
                variant="secondary"
              >
                Jeg venter med å booke
              </Button>
            )}
            <Button size="sm" onClick={onClickNext}>
              {isLastStep ? "Fullfør bestilling" : isOptionalStep ? "Hopp inn" : "Da har jeg booket"}
            </Button>
          </>
        )}
      </div>
    </>
  );
};

function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export default function BookingPage() {
  const params = useSearchParams()
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const bookingUrl = params.get("bu") ? params.get("bu")! : "https://booking.gastroplanner.no/maximus/t";

  useEffect(() => {
    if (validateEmail(email)) {
      setError("");
    }
  }, [email])

  const canGoNext = () => {
    if (!validateEmail(email)) {
      setError("Invalid email")
    }

    return validateEmail(email);
  }

  const onEmailSave = async () => {
    if (emailSaved) return;

    const id = await saveBookingEmail({
      email,
      businessName: params.get("bn")!,
      bookingUrl,
    });
    setEmailSaved(true);
    setBookingId(id);
  }

  return (
    <div className="flex flex-col gap-4">
      <ChatHeader/>

      <div className="pl-4 pr-4 pb-4">
        <div className="pb-2">
          <p className="text-lg semi-bold">Bestill bord på {params.get("bn")}</p>
        </div>

        <Stepper
          size="sm"
          responsive={false}
          variant="circle"
          initialStep={0}
          steps={steps}
          orientation="horizontal"
        >
          {steps.map((stepProps, index) => {

            // if (index === 0) {
            //   return (
            //     <Step key={stepProps.label} {...stepProps}>
            //       <div
            //         className="h-96  bg-peach flex items-center justify-center my-2 border border-peachDark text-primary rounded-md  p-4">
            //         <div className="flex flex-col w-full">
            //           <p className="text-sm pb-1">Skriv inn epost</p>
            //           <Input
            //             onChange={(e) => setEmail(e.target.value)}
            //             value={email}
            //             placeholder="eg. hei@selskap.no"
            //             className="bg-white"
            //           />
            //           {error && <p className="text-sm text-red-500 pt-1">{error}</p>}
            //         </div>
            //       </div>
            //     </Step>
            //   );
            // }

            if (index === 0) {
              return (
                <Step key={stepProps.label} {...stepProps}>
                  <div
                    className="h-96 flex items-center justify-center my-2 border bg-peach text-primary rounded-md">
                    <iframe
                      className="border rounded w-full h-full"
                      src={bookingUrl}
                    />
                  </div>
                </Step>
              );
            }

            if (index === 1) {
              return (
                <Step key={stepProps.label} {...stepProps}>
                  <div
                    className="h-96 flex items-center justify-center my-2 border bg-peach text-primary rounded-md">
                    Done!
                  </div>
                </Step>
              );
            }

            return null;
          })}
          <div className="mt-4">
            <Footer canGoNext={canGoNext} setAlertOpen={setAlertOpen} onEmailSave={onEmailSave} bookingId={bookingId}/>
          </div>
          <ConfirmBookingAlert open={alertOpen} setOpen={setAlertOpen}/>
        </Stepper>
      </div>
    </div>
  )
}
