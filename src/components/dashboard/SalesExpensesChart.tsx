import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "Jan", sales: 186000, expenses: 80000 },
  { month: "Feb", sales: 205000, expenses: 92000 },
  { month: "Mar", sales: 237000, expenses: 101000 },
  { month: "Apr", sales: 273000, expenses: 108000 },
  { month: "May", sales: 309000, expenses: 115000 },
  { month: "Jun", sales: 314000, expenses: 122000 },
  { month: "Jul", sales: 285000, expenses: 118000 },
  { month: "Aug", sales: 342000, expenses: 134000 },
  { month: "Sep", sales: 378000, expenses: 145000 },
  { month: "Oct", sales: 405000, expenses: 158000 },
  { month: "Nov", sales: 438000, expenses: 167000 },
  { month: "Dec", sales: 470000, expenses: 175000 },
];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--success))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export function SalesExpensesChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          className="text-xs"
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="var(--color-sales)"
          strokeWidth={2}
          dot={{ fill: "var(--color-sales)", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
          dot={{ fill: "var(--color-expenses)", r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
