"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
  { month: "Jan", earning: 800, courses: 400 },
  { month: "Feb", earning: 400, courses: 450 },
  { month: "Mar", earning: 450, courses: 300 },
  { month: "Apr", earning: 600, courses: 400 },
  { month: "May", earning: 700, courses: 350 },
  { month: "Jun", earning: 800, courses: 400 },
  { month: "Jul", earning: 750, courses: 420 },
  { month: "Aug", earning: 650, courses: 380 },
  { month: "Sep", earning: 700, courses: 300 },
  { month: "Oct", earning: 800, courses: 250 },
  { month: "Nov", earning: 600, courses: 200 },
  { month: "Dec", earning: 750, courses: 220 },
]

export function StatisticsChart() {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-end gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-sm text-muted-foreground">Earning</span>
          <span className="text-sm font-medium">1,240</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span className="text-sm text-muted-foreground">Courses</span>
          <span className="text-sm font-medium">30%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="earningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="coursesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickFormatter={(value) => `$${value}`}
              domain={[0, 1200]}
              ticks={[0, 200, 400, 600, 800, 1000, 1200]}
              tickFormatter={(value) => {
                if (value >= 1000) return `$${value / 1000}k`
                return `$${value}`
              }}
            />
            <Area type="monotone" dataKey="earning" stroke="#2563eb" strokeWidth={2} fill="url(#earningGradient)" />
            <Area type="monotone" dataKey="courses" stroke="#eab308" strokeWidth={2} fill="url(#coursesGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
