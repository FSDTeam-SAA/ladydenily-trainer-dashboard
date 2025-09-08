import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, BookOpen, User } from "lucide-react"
import { StatisticsChart } from "@/components/statistics-chart"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Earning",
      value: "$10250",
      icon: DollarSign,
      iconColor: "text-yellow-500",
    },
    {
      title: "Total Trainer",
      value: "250",
      icon: Users,
      iconColor: "text-orange-500",
    },
    {
      title: "Total Courses",
      value: "1250",
      icon: BookOpen,
      iconColor: "text-yellow-500",
    },
    {
      title: "Total User",
      value: "850",
      icon: User,
      iconColor: "text-blue-500",
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your admin panel</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-muted ${stat.iconColor}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Statistic</CardTitle>
          <p className="text-sm text-muted-foreground">Services</p>
        </CardHeader>
        <CardContent>
          <StatisticsChart />
        </CardContent>
      </Card>
    </div>
  )
}
