import { Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartData = [
  { category: "Salaries", value: 125000, fill: "hsl(var(--chart-1))" },
  { category: "Rent", value: 45000, fill: "hsl(var(--chart-2))" },
  { category: "Utilities", value: 28000, fill: "hsl(var(--chart-3))" },
  { category: "Marketing", value: 67000, fill: "hsl(var(--chart-4))" },
  { category: "Supplies", value: 42000, fill: "hsl(var(--chart-5))" },
  { category: "Other", value: 113000, fill: "hsl(var(--muted))" },
];

const chartConfig = {
  value: {
    label: "Amount",
  },
  salaries: {
    label: "Salaries",
    color: "hsl(var(--chart-1))",
  },
  rent: {
    label: "Rent",
    color: "hsl(var(--chart-2))",
  },
  utilities: {
    label: "Utilities",
    color: "hsl(var(--chart-3))",
  },
  marketing: {
    label: "Marketing",
    color: "hsl(var(--chart-4))",
  },
  supplies: {
    label: "Supplies",
    color: "hsl(var(--chart-5))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

export function ExpenseBreakdownChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
