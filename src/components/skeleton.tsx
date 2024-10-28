export const Skeleton = () => {
  return (
    <div className='flex space-x-1 justify-start items-center'>
      <span className='text-gray-600 text-sm pr-1'>Tenker</span>
      <div className='h-1.5 w-1.5 bg-red-400  rounded-full animate-bounce [animation-delay:-0.3s]'></div>
      <div className='h-1.5 w-1.5 bg-red-300 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
      <div className='h-1.5 w-1.5 bg-peachDark rounded-full animate-bounce'></div>
    </div>
  );
};
