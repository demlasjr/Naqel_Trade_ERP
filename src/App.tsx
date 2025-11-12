import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Products from "./pages/Products";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import Accounting from "./pages/Accounting";
import HRPayroll from "./pages/HRPayroll";
import ActivityLog from "./pages/ActivityLog";
import UserManagement from "./pages/UserManagement";
import RolesPermissions from "./pages/RolesPermissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/products" element={<Products />} />
            <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/hr-payroll" element={<HRPayroll />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/roles-permissions" element={<RolesPermissions />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
