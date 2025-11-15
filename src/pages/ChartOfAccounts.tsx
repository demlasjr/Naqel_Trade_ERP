import { useState, useMemo } from "react";
import { Plus, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Account, AccountType, AccountStatus, AccountWithChildren } from "@/types/account";
import { mockAccounts, mockAccountTransactions } from "@/data/mockAccounts";
import { AccountHierarchy } from "@/components/accounts/AccountHierarchy";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountDetailDialog } from "@/components/accounts/AccountDetailDialog";
import { AccountFilters } from "@/components/accounts/AccountFilters";
import { BulkActionsBar } from "@/components/accounts/BulkActionsBar";
import { AccountAnalytics } from "@/components/accounts/AccountAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);
  const { toast } = useToast();

  // Build hierarchy
  const hierarchicalAccounts = useMemo(() => {
    const filtered = accounts.filter(account => {
      const matchesSearch = searchTerm === '' || 
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || account.type === filterType;
      const matchesStatus = filterStatus === 'all' || account.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });

    function buildTree(parentId: string | null, level: number = 0): AccountWithChildren[] {
      return filtered
        .filter(acc => acc.parentId === parentId)
        .map(acc => ({
          ...acc,
          level,
          children: buildTree(acc.id, level + 1),
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    }

    return buildTree(null);
  }, [accounts, searchTerm, filterType, filterStatus]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    function getAllIds(accts: AccountWithChildren[]): string[] {
      let ids: string[] = [];
      accts.forEach(acc => {
        ids.push(acc.id);
        if (acc.children.length > 0) {
          ids = ids.concat(getAllIds(acc.children));
        }
      });
      return ids;
    }

    const allIds = getAllIds(hierarchicalAccounts);
    if (allIds.length > 0 && allIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleSaveAccount = (accountData: Partial<Account>) => {
    if (editingAccount) {
      setAccounts(prev => prev.map(acc => 
        acc.id === editingAccount.id 
          ? { ...acc, ...accountData, updatedAt: new Date() }
          : acc
      ));
      toast({
        title: "Account Updated",
        description: `${accountData.name} has been updated successfully.`,
      });
    } else {
      const newAccount: Account = {
        id: Date.now().toString(),
        code: accountData.code!,
        name: accountData.name!,
        type: accountData.type!,
        parentId: accountData.parentId || null,
        status: accountData.status || 'active',
        balance: accountData.balance || 0,
        description: accountData.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setAccounts(prev => [...prev, newAccount]);
      toast({
        title: "Account Created",
        description: `${newAccount.name} has been created successfully.`,
      });
    }
    setEditingAccount(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteAccount) {
      setAccounts(prev => prev.filter(acc => acc.id !== deleteAccount.id));
      toast({
        title: "Account Deleted",
        description: `${deleteAccount.name} has been deleted.`,
        variant: "destructive",
      });
      setDeleteAccount(null);
    }
  };

  const handleBulkActivate = () => {
    setAccounts(prev => prev.map(acc =>
      selectedIds.has(acc.id) ? { ...acc, status: 'active' as AccountStatus, updatedAt: new Date() } : acc
    ));
    toast({
      title: "Accounts Activated",
      description: `${selectedIds.size} account(s) have been activated.`,
    });
    setSelectedIds(new Set());
  };

  const handleBulkDeactivate = () => {
    setAccounts(prev => prev.map(acc =>
      selectedIds.has(acc.id) ? { ...acc, status: 'inactive' as AccountStatus, updatedAt: new Date() } : acc
    ));
    toast({
      title: "Accounts Deactivated",
      description: `${selectedIds.size} account(s) have been deactivated.`,
    });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    setAccounts(prev => prev.filter(acc => !selectedIds.has(acc.id)));
    toast({
      title: "Accounts Deleted",
      description: `${selectedIds.size} account(s) have been deleted.`,
      variant: "destructive",
    });
    setSelectedIds(new Set());
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your chart of accounts is being exported...",
    });
  };

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chart of Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your accounting structure and account hierarchy
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { setEditingAccount(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Accounts</CardDescription>
            <CardTitle className="text-3xl">{totalAccounts}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{activeAccounts} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-3xl">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'MRU',
                notation: 'compact',
              }).format(totalBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Selected</CardDescription>
            <CardTitle className="text-3xl">{selectedIds.size}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? 'Bulk actions available' : 'No selection'}
            </p>
          </CardContent>
        </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                onReset={handleResetFilters}
              />
            </CardContent>
          </Card>

          <AccountHierarchy
            accounts={hierarchicalAccounts}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onView={(account) => {
              setViewingAccount(account);
              setDetailOpen(true);
            }}
            onEdit={(account) => {
              setEditingAccount(account);
              setFormOpen(true);
            }}
            onDelete={(account) => setDeleteAccount(account)}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AccountAnalytics accounts={accounts} />
        </TabsContent>
      </Tabs>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editingAccount}
        accounts={accounts}
        onSave={handleSaveAccount}
      />

      <AccountDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        account={viewingAccount}
        transactions={viewingAccount ? (mockAccountTransactions[viewingAccount.id] || []) : []}
      />

      <AlertDialog open={!!deleteAccount} onOpenChange={(open) => !open && setDeleteAccount(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAccount?.name}"? This action cannot be undone
              and will remove all transaction history for this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
