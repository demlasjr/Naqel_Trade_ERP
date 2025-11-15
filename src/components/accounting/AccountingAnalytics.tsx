import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const monthlyData = [
  { month: 'Jul', revenue: 425000, expenses: 298500, profit: 126500 },
  { month: 'Aug', revenue: 445000, expenses: 312000, profit: 133000 },
  { month: 'Sep', revenue: 438000, expenses: 305000, profit: 133000 },
  { month: 'Oct', revenue: 462000, expenses: 318000, profit: 144000 },
  { month: 'Nov', revenue: 425000, expenses: 298500, profit: 126500 },
];

const accountTypeData = [
  { type: 'Assets', value: 485000, color: 'hsl(var(--chart-1))' },
  { type: 'Liabilities', value: 165000, color: 'hsl(var(--chart-2))' },
  { type: 'Equity', value: 320000, color: 'hsl(var(--chart-3))' },
];

export default function AccountingAnalytics() {
  const currentProfit = 126500;
  const previousProfit = 133000;
  const profitChange = ((currentProfit - previousProfit) / previousProfit) * 100;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MRU {currentProfit.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              {profitChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={profitChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(profitChange).toFixed(1)}%
              </span>
              <span>vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MRU 485,000</div>
            <p className="text-sm text-muted-foreground mt-1">
              Current + Fixed Assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">29.8%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Net profit / Revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accountTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Key Financial Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Ratio</p>
              <p className="text-2xl font-bold">2.48</p>
              <p className="text-xs text-muted-foreground mt-1">Current Assets / Current Liabilities</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Debt to Equity</p>
              <p className="text-2xl font-bold">0.52</p>
              <p className="text-xs text-muted-foreground mt-1">Total Liabilities / Total Equity</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Return on Assets</p>
              <p className="text-2xl font-bold">26.1%</p>
              <p className="text-xs text-muted-foreground mt-1">Net Income / Total Assets</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Return on Equity</p>
              <p className="text-2xl font-bold">39.5%</p>
              <p className="text-xs text-muted-foreground mt-1">Net Income / Total Equity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
