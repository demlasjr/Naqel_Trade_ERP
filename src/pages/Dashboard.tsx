import { useState } from "react";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Box
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesExpensesChart } from "@/components/dashboard/SalesExpensesChart";
import { ExpenseBreakdownChart } from "@/components/dashboard/ExpenseBreakdownChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("30");
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your business performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Date Range</span>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value="MRU 847,500"
          description="Compared to previous period"
          icon={DollarSign}
          iconColor="bg-success"
          trend={{ value: "+12.5%", isPositive: true }}
        />
        <KPICard
          title="Total Expenses"
          value="MRU 420,000"
          description="Operational costs"
          icon={CreditCard}
          iconColor="bg-destructive"
          trend={{ value: "+8.2%", isPositive: true }}
        />
        <KPICard
          title="Net Profit"
          value="MRU 427,500"
          description="50.4% profit margin"
          icon={TrendingUp}
          iconColor="bg-primary"
          trend={{ value: "+18.7%", isPositive: true }}
        />
        <KPICard
          title="Inventory Value"
          value="MRU 285,000"
          description="Current stock valuation"
          icon={Package}
          iconColor="bg-chart-4"
          trend={{ value: "-2.1%", isPositive: false }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Low Stock Items"
          value="4"
          description="Require immediate attention"
          icon={AlertTriangle}
          iconColor="bg-warning"
        />
        <KPICard
          title="Total Transactions"
          value="247"
          description="All recorded activities"
          icon={Receipt}
          iconColor="bg-chart-1"
          trend={{ value: "+15.3%", isPositive: true }}
        />
        <KPICard
          title="Avg Order Value"
          value="MRU 3,435"
          description="Per transaction average"
          icon={ShoppingCart}
          iconColor="bg-success"
          trend={{ value: "+5.8%", isPositive: true }}
        />
        <KPICard
          title="Active Products"
          value="142"
          description="In current inventory"
          icon={Box}
          iconColor="bg-primary"
          trend={{ value: "+3", isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Sales & Expenses Trend</h3>
          <p className="text-sm text-muted-foreground mb-4">Monthly performance comparison</p>
          <SalesExpensesChart />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-2">Expense Breakdown</h3>
          <p className="text-sm text-muted-foreground mb-4">Current year expense distribution</p>
          <ExpenseBreakdownChart />
        </div>
      </div>

      {/* Recent Transactions & Low Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions />
        <LowStockAlerts />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Button 
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => navigate("/sales")}
          >
            <span className="font-semibold">Record Sale</span>
            <span className="text-xs opacity-90 mt-1">
              Add new sales transaction
            </span>
          </Button>
          <Button 
            className="h-auto flex-col items-start p-4 text-left" 
            variant="outline"
            onClick={() => navigate("/purchases")}
          >
            <span className="font-semibold">Record Purchase</span>
            <span className="text-xs text-muted-foreground mt-1">
              Add new purchase transaction
            </span>
          </Button>
          <Button 
            className="h-auto flex-col items-start p-4 text-left" 
            variant="outline"
            onClick={() => navigate("/products")}
          >
            <span className="font-semibold">Manage Products</span>
            <span className="text-xs text-muted-foreground mt-1">
              Update inventory & pricing
            </span>
          </Button>
          <Button 
            className="h-auto flex-col items-start p-4 text-left" 
            variant="outline"
            onClick={() => navigate("/transactions")}
          >
            <span className="font-semibold">View Transactions</span>
            <span className="text-xs text-muted-foreground mt-1">
              Review financial records
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
