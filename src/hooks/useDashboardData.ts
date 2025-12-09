import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  // Additional metrics
  paidAmount: number;
  outstandingAmount: number;
  totalOrders: number;
}

export function useDashboardKPIs(dateRange: string) {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for dashboard updates
  useEffect(() => {
    const channels = [
      supabase
        .channel('dashboard_sales')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_orders' }, () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', dateRange] });
        })
        .subscribe(),
      supabase
        .channel('dashboard_transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', dateRange] });
        })
        .subscribe(),
      supabase
        .channel('dashboard_products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', dateRange] });
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [queryClient, dateRange]);

  const { data: kpis, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', dateRange],
    queryFn: async () => {
      const startDate = getStartDate(dateRange);

      // Fetch sales revenue with paid amounts
      const { data: salesData, error: salesError } = await supabase
        .from('sales_orders')
        .select('total, paid_amount, balance, status, created_at')
        .gte('created_at', startDate);

      if (salesError) throw salesError;

      // Fetch transactions for expenses
      const { data: transactionsData, error: transError } = await supabase
        .from('transactions')
        .select('amount, type, created_at')
        .gte('created_at', startDate);

      if (transError) throw transError;

      // Fetch products for inventory value and low stock
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('current_stock, selling_price, reorder_level, status');

      if (prodError) throw prodError;

      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0;
      const paidAmount = salesData?.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0) || 0;
      const outstandingAmount = salesData?.reduce((sum, sale) => sum + Number(sale.balance || 0), 0) || 0;
      const totalOrders = salesData?.length || 0;
      
      const totalExpenses = transactionsData
        ?.filter(t => t.type === 'expense' || t.type === 'purchase')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0) || 0;

      const activeProducts = productsData?.filter(p => p.status === 'active') || [];
      const inventoryValue = activeProducts.reduce(
        (sum, p) => sum + (Number(p.current_stock || 0) * Number(p.selling_price || 0)), 
        0
      );
      const lowStockCount = activeProducts.filter(
        p => (p.current_stock || 0) <= (p.reorder_level || 0)
      ).length;

      // Calculate trends (simplified - comparing to previous period)
      const previousStartDate = getPreviousStartDate(dateRange);
      
      const { data: previousSales } = await supabase
        .from('sales_orders')
        .select('total')
        .gte('created_at', previousStartDate)
        .lt('created_at', startDate);

      const { data: previousTransactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .gte('created_at', previousStartDate)
        .lt('created_at', startDate);

      const previousRevenue = previousSales?.reduce((sum, sale) => sum + Number(sale.total || 0), 0) || 0;
      const previousExpenses = previousTransactions
        ?.filter(t => t.type === 'expense' || t.type === 'purchase')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0) || 0;

      const revenueTrend = calculateTrend(totalRevenue, previousRevenue);
      const expensesTrend = calculateTrend(totalExpenses, previousExpenses);
      const netProfit = totalRevenue - totalExpenses;
      const previousProfit = previousRevenue - previousExpenses;
      const profitTrend = calculateTrend(netProfit, previousProfit);

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        inventoryValue,
        lowStockCount,
        totalTransactions: transactionsData?.length || 0,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        activeProducts: activeProducts.length,
        revenueTrend,
        expensesTrend,
        profitTrend,
        inventoryTrend: 0,
        paidAmount,
        outstandingAmount,
        totalOrders,
      } as DashboardKPIs;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  return { kpis: kpis || null, isLoading, error, refetch };
}

function getStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '7':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function getPreviousStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '7':
      return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    case '30':
      return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    case '90':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
    case 'ytd':
      return new Date(now.getFullYear() - 1, 0, 1).toISOString();
    default:
      return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
