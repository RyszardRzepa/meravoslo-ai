import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";
import { JSX, SVGProps } from "react";

export default function ChatHeader({ title }: { title?: string }) {
  const router = useRouter()

  return (
    <header
      key="1"
      className="flex items-center justify-between py-3 text-gray-900"
    >
      <div className="flex flex-row gap-2 items-center">
        <Button
          className="rounded-full hover:bg-gray-200 hover:text-gray-900 focus:bg-gray-200 focus:text-gray-900"
          size="icon"
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-5 w-5"/>
          <span className="sr-only">Go back</span>
        </Button>
        <p className="text-sm">Tilbake</p>
      </div>
      {title && <div className="text-sm font-medium">{title}</div>}
      <div className="flex items-center gap-2">
      </div>
    </header>
  )
}

function ArrowLeftIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  )
}
