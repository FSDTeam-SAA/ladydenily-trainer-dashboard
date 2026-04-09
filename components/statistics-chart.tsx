"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts"

export interface StatisticsChartPoint {
  month: string
  earning: number
  courses: number
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat("en-US")
const emptyChartData: StatisticsChartPoint[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
].map((month) => ({
  month,
  earning: 0,
  courses: 0,
}))

function formatAxisCurrency(value: number) {
  if (value >= 1000) {
    const compact = value % 1000 === 0 ? value / 1000 : Number((value / 1000).toFixed(1))
    return `$${compact}k`
  }

  return `$${Math.round(value)}`
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null
  }

  const earning = Number(payload.find((item) => item.dataKey === "earning")?.value ?? 0)
  const courses = Number(payload.find((item) => item.dataKey === "courses")?.value ?? 0)

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-2 font-medium text-slate-700">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full bg-[#184a9c]" />
          <span>Earning :</span>
          <span className="font-medium text-slate-800">{currencyFormatter.format(earning)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full bg-[#f4c430]" />
          <span>Courses :</span>
          <span className="font-medium text-slate-800">{numberFormatter.format(courses)}</span>
        </div>
      </div>
    </div>
  )
}

export function StatisticsChart({ data }: { data: StatisticsChartPoint[] }) {
  const chartData = data.length ? data : emptyChartData
  const totalEarning = chartData.reduce((sum, item) => sum + item.earning, 0)
  const totalCourses = chartData.reduce((sum, item) => sum + item.courses, 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#eef2f7_0%,#f7f9fc_100%)] p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[28px] font-semibold tracking-tight text-slate-800">Statistic</h3>
          <p className="text-sm text-slate-500">Services</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#184a9c]" />
            <span>Earning</span>
            <span className="font-medium text-slate-800">{currencyFormatter.format(totalEarning)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f4c430]" />
            <span>Courses</span>
            <span className="font-medium text-slate-800">{numberFormatter.format(totalCourses)}</span>
          </div>
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trainer-earning-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#184a9c" stopOpacity={0.72} />
                <stop offset="95%" stopColor="#184a9c" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="trainer-courses-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f4c430" stopOpacity={0.52} />
                <stop offset="95%" stopColor="#f4c430" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#94a3b8" strokeDasharray="2 4" opacity={0.35} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={formatAxisCurrency}
            />
            <YAxis dataKey="courses" hide orientation="right" yAxisId="courses" />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "#f4c430", strokeDasharray: "3 5", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="earning"
              stroke="#184a9c"
              strokeWidth={2.5}
              fill="url(#trainer-earning-fill)"
              activeDot={{ r: 4, fill: "#184a9c", stroke: "#ffffff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="courses"
              yAxisId="courses"
              stroke="#f4c430"
              strokeWidth={2.5}
              fill="url(#trainer-courses-fill)"
              activeDot={{ r: 4, fill: "#f4c430", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
