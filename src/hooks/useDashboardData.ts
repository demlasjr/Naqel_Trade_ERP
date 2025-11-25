import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  inventoryValue: number;
  lowStockCount: number;
  totalTransactions: number;
  avgOrderValue: number;
  activeProducts: number;
  revenueTrend: number;
  expensesTrend: number;
  profitTrend: number;
  inventoryTrend: number;
}

export function useDashboardKPIs(dateRange: string) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchKPIs() {
      setIsLoading(true);
      try {
        const startDate = getStartDate(dateRange);

        // Fetch sales revenue
        const { data: salesData } = await supabase
          .from('sales_orders')
          .select('total_amount, created_at')
          .gte('created_at', startDate);

        // Fetch transactions for expenses
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('amount, transaction_type, created_at')
          .gte('created_at', startDate);

        // Fetch products for inventory value and low stock
        const { data: productsData } = await supabase
          .from('products')
          .select('current_stock, unit_price, reorder_level, status');

        const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const totalExpenses = transactionsData
          ?.filter(t => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

        const activeProducts = productsData?.filter(p => p.status === 'active') || [];
        const inventoryValue = activeProducts.reduce(
          (sum, p) => sum + (Number(p.current_stock) * Number(p.unit_price)), 
          0
        );
        const lowStockCount = activeProducts.filter(
          p => p.current_stock <= p.reorder_level
        ).length;

        // Calculate trends (simplified - comparing to previous period)
        const previousStartDate = getPreviousStartDate(dateRange);
        
        const { data: previousSales } = await supabase
          .from('sales_orders')
          .select('total_amount')
          .gte('created_at', previousStartDate)
          .lt('created_at', startDate);

        const { data: previousTransactions } = await supabase
          .from('transactions')
          .select('amount, transaction_type')
          .gte('created_at', previousStartDate)
          .lt('created_at', startDate);

        const previousRevenue = previousSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const previousExpenses = previousTransactions
          ?.filter(t => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

        const revenueTrend = calculateTrend(totalRevenue, previousRevenue);
        const expensesTrend = calculateTrend(totalExpenses, previousExpenses);
        const netProfit = totalRevenue - totalExpenses;
        const previousProfit = previousRevenue - previousExpenses;
        const profitTrend = calculateTrend(netProfit, previousProfit);

        setKpis({
          totalRevenue,
          totalExpenses,
          netProfit,
          inventoryValue,
          lowStockCount,
          totalTransactions: transactionsData?.length || 0,
          avgOrderValue: salesData && salesData.length > 0 ? totalRevenue / salesData.length : 0,
          activeProducts: activeProducts.length,
          revenueTrend,
          expensesTrend,
          profitTrend,
          inventoryTrend: 0, // Placeholder for inventory trend calculation
        });
      } catch (error) {
        console.error('Error fetching dashboard KPIs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchKPIs();
  }, [dateRange]);

  return { kpis, isLoading };
}

function getStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '7':
      return new Date(now.setDate(now.getDate() - 7)).toISOString();
    case '30':
      return new Date(now.setDate(now.getDate() - 30)).toISOString();
    case '90':
      return new Date(now.setDate(now.getDate() - 90)).toISOString();
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return new Date(now.setDate(now.getDate() - 30)).toISOString();
  }
}

function getPreviousStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '7':
      return new Date(now.setDate(now.getDate() - 14)).toISOString();
    case '30':
      return new Date(now.setDate(now.getDate() - 60)).toISOString();
    case '90':
      return new Date(now.setDate(now.getDate() - 180)).toISOString();
    case 'ytd':
      return new Date(now.getFullYear() - 1, 0, 1).toISOString();
    default:
      return new Date(now.setDate(now.getDate() - 60)).toISOString();
  }
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
