export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        <div className="w-4 h-8 bg-yellow-400"></div>
        <div className="w-4 h-8 bg-blue-600"></div>
        <div className="w-4 h-8 bg-red-500"></div>
      </div>
      <div className="flex flex-col text-xs font-bold leading-tight">
        <span>LEGENDARY</span>
        <span>TRADING</span>
        <span>ACADEMY</span>
      </div>
    </div>
  )
}
