import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatisticsChart, type StatisticsChartPoint } from "@/components/statistics-chart"
import { getRequiredServerSession } from "@/lib/auth-utils"
import { BookOpen, CheckCircle2, DollarSign, User } from "lucide-react"

type DashboardPageProps = {
  className?: string
  welcomeMessage?: string
}

type Overview = {
  totalEarning: number | null
  totalCourses: number | null
  totalPublishedCourses: number | null
  totalStudents: number | null
  monthlyStats: StatisticsChartPoint[]
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat("en-US")

function getApiBaseUrl() {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001/api/v1"
  ).replace(/\/$/, "")

  return /\/api\/v\d+$/.test(baseUrl) ? baseUrl : `${baseUrl}/api/v1`
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "")
    if (!normalized) {
      return null
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function pickFirstNumber(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = toNumber(data[key])
    if (value !== null) {
      return value
    }
  }

  return null
}

function formatValue(value: number | null, isCurrency = false) {
  if (value === null) {
    return "--"
  }

  return isCurrency ? currencyFormatter.format(value) : numberFormatter.format(value)
}

function getMonthlyStats(value: unknown): StatisticsChartPoint[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const data = getObject(item) ?? {}
    return {
      month: typeof data.month === "string" ? data.month : `M${index + 1}`,
      earning: toNumber(data.earning) ?? 0,
      courses: toNumber(data.courses) ?? 0,
    }
  })
}

async function getOverview(): Promise<Overview> {
  const session = await getRequiredServerSession()
  const accessToken = session.accessToken

  if (!accessToken) {
    return {
      totalEarning: null,
      totalCourses: null,
      totalPublishedCourses: null,
      totalStudents: null,
      monthlyStats: [],
    }
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/trainer/overview`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Overview request failed with status ${response.status}`)
    }

    const payload = await response.json()
    const data = getObject(payload?.data) ?? getObject(payload) ?? {}

    return {
      totalEarning: pickFirstNumber(data, ["totalEarning", "totalRevenue"]),
      totalCourses: pickFirstNumber(data, ["totalCourses", "totalCourse", "courseCount"]),
      totalPublishedCourses: pickFirstNumber(data, [
        "totalPublishedCourses",
        "publishedCourses",
        "publishedCourseCount",
      ]),
      totalStudents: pickFirstNumber(data, ["totalStudents", "totalUser", "totalUsers", "studentCount"]),
      monthlyStats: getMonthlyStats(data.monthlyStats),
    }
  } catch (error) {
    console.error("Failed to load dashboard overview:", error)

    return {
      totalEarning: null,
      totalCourses: null,
      totalPublishedCourses: null,
      totalStudents: null,
      monthlyStats: [],
    }
  }
}

export default async function DashboardPage({
  className = "p-6 space-y-6 pt-16",
  welcomeMessage = "Welcome back to your trainer panel",
}: DashboardPageProps) {
  const overview = await getOverview()

  const stats = [
    {
      title: "Total Earning",
      value: formatValue(overview.totalEarning, true),
      numericValue: overview.totalEarning,
      icon: DollarSign,
      iconColor: "text-yellow-500",
      chartColorClass: "bg-yellow-500",
      isCurrency: true,
    },
    {
      title: "Total Courses",
      value: formatValue(overview.totalCourses),
      numericValue: overview.totalCourses,
      icon: BookOpen,
      iconColor: "text-amber-500",
      chartColorClass: "bg-amber-500",
    },
    {
      title: "Published Courses",
      value: formatValue(overview.totalPublishedCourses),
      numericValue: overview.totalPublishedCourses,
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      chartColorClass: "bg-emerald-500",
    },
    {
      title: "Total Students",
      value: formatValue(overview.totalStudents),
      numericValue: overview.totalStudents,
      icon: User,
      iconColor: "text-blue-500",
      chartColorClass: "bg-blue-500",
    },
  ]

  return (
    <div className={className}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">{welcomeMessage}</p>
    </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`rounded-lg bg-muted p-2 ${stat.iconColor}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Performance</CardTitle>
          <p className="text-sm text-muted-foreground">Monthly earning and course sales</p>
        </CardHeader>
        <CardContent>
          <StatisticsChart data={overview.monthlyStats} />
        </CardContent>
      </Card>
    </div>
  )
}
