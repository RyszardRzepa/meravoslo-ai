import { useRef, useState } from 'react';
import { useUIState } from 'ai/rsc';
import { type AI } from '../app/actions/ai';
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { Button } from "@/components/ui/button";
import { useScrollToBottom } from "@/lib/hooks/use-scroll-to-bottom";
import { saveMessage, searchForActivities, searchForPlaces } from "@/app/actions/db";
import { Loader2 } from "lucide-react"; // If you don't have lucide-react, you can use any other loading icon
import { SheetContent, SheetDescription, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Textarea from "react-textarea-autosize";
import { IconClose, IconSend } from "@/components/ui/icons";
import { Role, SearchType, TabName } from "@/lib/types";

interface ChatTabProps {
  uid: string | null;
  threadId: number;
  exampleMessages: Array<{ heading: string; message: string }>;
  name: string;
  data: any[];
  setData: (results: any[]) => void;
}

const maxCharacters = 80;

export default function SearchTab({ uid, threadId, exampleMessages, data, setData }: ChatTabProps) {
  const { formRef, onKeyDown } = useEnterSubmit();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>("https://meravoslo.no");
  const [inputValue, setInputValue] = useState('');



  const getUniqueArticles = (articles: { articleUrl: string; }[]) => {
    const seen = new Set();
    return articles.filter((article) => {
      if (!article.articleUrl || seen.has(article.articleUrl)) {
        return false;
      }
      seen.add(article.articleUrl);
      return true;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    const inputText = inputRef.current?.value;

    event.preventDefault();
    if (!inputText) return

    setIsLoading(true);
    saveMessage({
      role: Role.User,
      message: inputText,
      threadId,
      uid: uid!,
      type: SearchType.Search
    })
    const places = (await searchForPlaces(inputText))
    const activities = (await searchForActivities(inputText))
    setData([...getUniqueArticles(places), ...getUniqueArticles(activities)]);
    setIsLoading(false);
  }

  return (
    <div className="h-dvh">
      <div>
        <div className="h-full bg-peachLight">
          {!isLoading && data.length === 0 ? (
            <>
              <div className="">
                <div className="rounded-lg p-6">
                  <div className="flex flex-row gap-4 items-center mb-4">
                    <div
                      className={
                        'flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-full border' +
                        ' border-peachDark' +
                        ' bg-peach text-primary-foreground'}
                    >
                      <svg width="614" height="613" viewBox="0 0 614 613" fill="none"
                           xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M150.623 195.454C158.538 186.174 168.428 184.353 179.208 187.386C189.057 190.157 193.949 198.057 194.265 207.543C194.93 227.507 194.467 247.509 194.467 267.748C186.336 267.748 178.413 267.748 169.731 267.748C169.731 266.04 169.731 264.326 169.731 262.613C169.731 248.928 169.751 235.244 169.723 221.559C169.707 213.314 166.938 208.986 161.271 208.178C154.153 207.162 148.592 210.977 146.556 218.648C145.858 221.276 145.708 224.107 145.686 226.848C145.58 240.042 145.604 253.237 145.567 266.431C145.566 266.732 145.379 267.031 145.167 267.664C137.244 267.664 129.216 267.664 120.638 267.664C120.638 262.737 120.641 257.898 120.637 253.06C120.629 242.145 120.739 231.228 120.564 220.316C120.45 213.239 117.349 209.022 112.234 208.193C105.622 207.121 99.9798 210.357 97.8399 217.039C96.7673 220.388 96.2101 224.033 96.1599 227.555C95.9702 240.87 96.0837 254.189 96.0837 267.752C87.7633 267.752 79.8709 267.752 71.6972 267.752C71.6972 241.256 71.6972 214.938 71.6972 188.265C79.6061 188.265 87.4976 188.265 95.8102 188.265C95.8102 193.016 95.8102 197.82 95.8102 202.624C101.525 192.059 109.718 185.994 121.891 186.154C134.296 186.317 141.884 192.68 144.925 205.069C147.004 201.516 148.7 198.619 150.623 195.454Z"
                          fill="#4151A3"/>
                        <path
                          d="M408.061 213.506C407.143 214.528 406.353 215.726 405.532 215.748C399.541 215.91 393.544 215.835 387.637 215.835C385.986 205.884 391.812 194.886 401.597 190.457C414.527 184.605 427.855 184.559 440.926 190.064C449.558 193.699 454.178 200.85 455.801 209.906C456.372 213.094 456.594 216.383 456.61 219.627C456.69 235.564 456.646 251.501 456.646 267.718C449.103 267.718 442.019 267.718 434.792 267.718C434.201 265.13 433.635 262.649 432.957 259.677C432.11 260.314 431.459 260.678 430.965 261.193C422.724 269.782 412.619 271.249 401.728 268.276C390.148 265.114 383.951 255.132 385.31 242.854C386.657 230.693 394.758 223.003 407.298 222.11C415.712 221.511 423.903 222.066 430.911 227.766C433.204 216.961 431.582 210.476 426.134 208.139C419.306 205.21 411.846 207.286 408.061 213.506ZM421.12 251.919C423.453 251.293 426.038 251.112 428.067 249.954C432.929 247.181 432.904 240.14 428.096 237.49C423.524 234.97 418.409 234.636 414.18 237.562C412.15 238.966 410.591 242.65 410.699 245.222C410.941 250.931 415.904 251.453 421.12 251.919Z"
                          fill="#4151A3"/>
                        <path
                          d="M221.848 192.236C237.722 184.392 253.471 183.861 269.02 191.708C279.724 197.11 285.993 209.976 284.285 221.919C279.032 221.919 273.696 221.919 268.361 221.919C266.6 221.919 264.838 221.919 263.252 221.919C259.451 210.299 252.397 205.696 242.031 207.691C232.86 209.456 227.751 216.028 228.39 225.921C234.772 218.442 242.76 217.918 251.309 219.574C254.116 220.117 255.496 221.468 255.246 224.594C254.964 228.117 255.181 231.68 255.181 235.124C250.185 234.303 245.62 233.13 241.008 232.902C235.364 232.622 231.056 235.269 230.902 238.624C230.65 244.094 234.945 245.647 239.014 246.895C250.859 250.528 261.811 247.624 272.29 241.889C273.982 240.963 275.641 239.977 278.157 238.538C278.157 245.87 278.275 252.579 278.037 259.275C277.998 260.343 276.559 261.722 275.43 262.336C259.72 270.887 243.32 272.506 226.482 266.303C216.47 262.615 209.626 255.358 206.041 245.301C200.725 230.384 202.397 207.938 216.061 196.485C217.8 195.028 219.713 193.779 221.848 192.236Z"
                          fill="#4151A3"/>
                        <path
                          d="M84.9903 397.393C56.7347 359.995 71.0767 296.233 129.857 287.032C167.646 281.117 202.451 301.451 210.785 337.902C221.313 383.953 190.657 419.954 150.267 423.613C124.227 425.972 102.106 418.316 84.9903 397.393ZM171.375 352.805C171.039 350.388 170.832 347.945 170.346 345.559C167.498 331.572 156.637 322.408 142.513 321.991C128.655 321.581 117.099 329.93 114.147 343.942C112.744 350.603 112.774 357.92 113.837 364.675C116.04 378.681 126.476 387.068 141.113 388.011C153.796 388.828 165.523 380.609 169.362 367.626C170.679 363.173 170.744 358.35 171.375 352.805Z"
                          fill="#3F50A2"/>
                        <path
                          d="M327.236 366.584C335.531 391.064 325.056 412.653 300.896 420.473C283.653 426.054 266.211 425.766 249.178 419.392C231.238 412.679 220.351 396.046 221.641 377.737C233.872 377.737 246.139 377.737 258.694 377.737C259.002 379.569 259.163 381.501 259.662 383.341C262.701 394.552 280.362 399.646 289.193 391.898C292.944 388.607 293.252 382.514 288.98 378.984C285.3 375.942 280.881 373.578 276.456 371.697C266.439 367.44 256.039 364.058 246.13 359.579C237.218 355.551 229.756 349.483 225.939 339.982C218.69 321.936 226.059 301.483 244.053 292.734C264.281 282.898 285.333 282.659 305.96 291.599C320.577 297.934 328.078 311.672 327.79 329.611C322.052 329.611 316.274 329.611 310.496 329.611C304.829 329.611 299.162 329.611 293.612 329.611C290.431 316.507 284.065 311.967 272.05 313.918C267.929 314.587 264.498 316.399 263.431 320.752C262.345 325.18 264.475 328.709 268.237 330.485C275.267 333.802 282.682 336.294 289.768 339.502C298.472 343.442 307.522 346.982 315.418 352.21C320.27 355.423 323.245 361.472 327.236 366.584Z"
                          fill="#4050A3"/>
                        <path
                          d="M343.297 324.718C343.297 311.549 343.297 298.868 343.297 285.894C354.141 285.894 364.632 285.894 375.445 285.894C375.522 287.607 375.652 289.189 375.655 290.771C375.706 319.607 375.747 348.442 375.779 377.278C375.793 389.878 376.562 390.798 389.145 392.468C389.145 402.121 389.227 411.857 389.006 421.586C388.986 422.466 387.033 424.007 385.938 424.044C377.802 424.316 369.648 424.521 361.513 424.291C350.574 423.982 343.539 416.404 343.506 405.355C343.425 378.639 343.365 351.923 343.297 324.718Z"
                          fill="#4050A3"/>
                        <path
                          d="M401.249 343.441C407.869 309.723 431.965 288.696 465.959 286.354C500.681 283.961 527.744 303.363 537.384 329.049C553.431 371.803 528.318 418.752 479.636 423.622C448.655 426.72 421.816 413.39 408.285 387.884C400.962 374.081 398.87 359.294 401.249 343.441ZM479.196 386.901C489.919 383.899 496.723 376.775 498.978 366.114C500.262 360.043 500.494 353.503 499.839 347.319C498.512 334.794 489.277 324.999 477.919 322.77C464.717 320.178 452.523 324.771 446.734 335.583C439.909 348.332 439.706 361.727 446.812 374.389C453.726 386.71 465.297 389.293 479.196 386.901Z"
                          fill="#3F50A2"/>
                        <path
                          d="M460.596 191.006C461.034 189.722 461.575 188.049 462.155 188.036C469.641 187.86 477.144 187.722 484.613 188.123C485.821 188.188 487.481 190.757 487.925 192.435C492.118 208.297 496.089 224.217 500.137 240.117C500.487 241.488 500.935 242.835 501.762 245.627C504.002 237.005 505.927 229.691 507.801 222.365C510.418 212.136 513.136 201.929 515.506 191.643C516.204 188.612 517.485 187.773 520.441 187.849C528.041 188.042 535.648 187.913 543.836 187.913C535.535 214.906 527.425 241.281 519.21 267.996C508.209 267.996 497.317 268.113 486.436 267.825C485.285 267.795 483.637 265.571 483.165 264.068C475.963 241.116 468.918 218.115 461.838 195.125C461.455 193.883 461.091 192.635 460.596 191.006Z"
                          fill="#4151A3"/>
                        <path
                          d="M331.435 188.092C334.626 187.465 337.463 186.99 340.817 186.428C340.817 195.603 340.817 204.114 340.817 212.677C340.607 212.81 340.332 213.138 340.091 213.115C323.984 211.532 317.567 223.053 317.232 235.346C316.988 244.297 317.131 253.26 317.104 262.217C317.099 263.976 317.103 265.734 317.103 267.737C308.945 267.737 301.185 267.737 293.035 267.737C293.035 241.418 293.035 214.984 293.035 188.232C300.859 188.232 308.728 188.232 316.9 188.232C316.9 194.697 316.9 201.002 316.9 207.308C320.411 199.921 323.094 192.152 331.435 188.092Z"
                          fill="#4050A3"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-center text-2xl">🔎</p>
                    </div>
                  </div>

                  <h1 className="mb-6 text-lg font-semibold">
                    Søk artikler relatert til spørsmålet ditt!
                  </h1>

                  <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
                    <label className="text-gray-600 text-sm">Forslag</label>
                    {exampleMessages.map((message, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="bg-transparent shadow-neutral-50 h-auto text-base text-left border-2 border-peachDark py-2 px-4 rounded-full transition-all duration-200 hover:bg-peachDark hover:text-black focus:outline-none focus:ring-2 focus:ring-peachDark focus:ring-opacity-50"
                        onClick={() => {
                          setInputValue(message.message);
                          inputRef.current?.focus()

                          setTimeout(() => {
                            formRef.current?.requestSubmit();
                          }, 500)
                        }}
                      >
                        {message.heading}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-[50vh]">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-600"/>
                </div>
              ) : (
                data?.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-lg border-2 border-peachDark hover:bg-peachDark cursor-pointer transition-colors duration-200 p-4"
                  >
                    <SheetTrigger
                      asChild
                      onClick={() => {
                        setSelectedUrl(item.articleUrl);
                      }}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0 mr-4">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.articleTitle}</h3>
                          <p className="text-gray-600 truncate">
                            {item.articleContent}
                          </p>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-600 hover:text-gray-900 flex-shrink-0"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </div>
                    </SheetTrigger>
                  </div>
                ))
              )}
              <div className="h-40"/>
            </div>
          )}
        </div>
        <div
          className="fixed inset-x-0 bottom-0 w-full from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
          <div className="mx-auto sm:max-w-2xl">
            <div className="px-4 py-2 space-y-4 border-t border-t-peachDark shadow-lg bg-peachLight md:py-4">
              <form ref={formRef} onSubmit={handleSubmit}>
                <div className="flex flex-row gap-3 justify-center items-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="hover:bg-peachDark bg-transparent shadow-none border-none w-10 h-10 rounded-full"
                        onClick={e => {
                          setInputValue("");
                        }}
                      >
                        <IconClose className="h-5 w-5"/>
                        <span className="sr-only">Ny Søk</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ny Søk</TooltipContent>
                  </Tooltip>
                  <div
                    className="relative flex flex-col w-full overflow-hidden max-h-60 grow bg-peach border border-peachDark rounded-full pr-14 pl-6 focus-within:ring-2 focus-within:ring-gray-700 focus-within:ring-offset-0">
                    <Textarea
                      ref={inputRef}
                      tabIndex={0}
                      onKeyDown={onKeyDown}
                      placeholder="Søk her..."
                      className="min-h-[54px] w-full resize-none bg-transparent py-[1rem] focus-within:outline-none sm:text-sm placeholder:text-gray-700"
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                      autoCorrect="off"
                      name="message"
                      rows={1}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      maxLength={maxCharacters}
                    />
                    <span
                      className={`absolute bottom-1 right-16 text-xs ${inputValue.length === maxCharacters ? 'text-red-500' : 'text-gray-500'}`}>
    {inputValue.length}/{maxCharacters}
  </span>
                    <div className="absolute right-0 right-4 md:right-4 lg:right-4 top-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="submit"
                            size="icon"
                            disabled={inputValue === ''}
                            className="bg-transparent shadow-none hover:bg-transparent text-gray-700"
                          >
                            <IconSend className=""/>
                            <span className="sr-only">Søk</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Søk</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
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
