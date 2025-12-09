import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { format } from "date-fns";

export default function GeneralLedger() {
  const { accounts, isLoading: isLoadingAccounts, refetch: refetchAccounts } = useAccounts();
  const { transactions, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useTransactions();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [search, setSearch] = useState("");

  // Force refetch periodically to ensure data is fresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAccounts();
      refetchTransactions();
    }, 15000); // Refetch every 15 seconds
    
    return () => clearInterval(interval);
  }, [refetchAccounts, refetchTransactions]);

  // Set default selected account when accounts load
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Filter transactions for selected account
  const accountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    
    return transactions
      .filter(t => {
        // Match by account ID (most reliable) or by account name
        const matchesFrom = t.accountFromId === selectedAccount.id || t.accountFrom === selectedAccount.name;
        const matchesTo = t.accountToId === selectedAccount.id || t.accountTo === selectedAccount.name;
        return matchesFrom || matchesTo;
      })
      .filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.reference?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date ascending
      .reduce((acc, t) => {
        // Determine if this transaction affects the selected account as debit or credit
        const isDebit = t.accountToId === selectedAccount.id || t.accountTo === selectedAccount.name;
        const isCredit = t.accountFromId === selectedAccount.id || t.accountFrom === selectedAccount.name;
        
        const debit = isDebit ? t.amount : 0;
        const credit = isCredit ? t.amount : 0;
        
        // Calculate running balance starting from account's current balance
        // For assets: debit increases, credit decreases
        // For liabilities/equity: credit increases, debit decreases
        // For revenue: credit increases, debit decreases
        // For expenses: debit increases, credit decreases
        const accountType = selectedAccount.type;
        let balanceChange = 0;
        
        if (accountType === 'Assets' || accountType === 'Expenses') {
          balanceChange = debit - credit;
        } else {
          balanceChange = credit - debit;
        }
        
        // Calculate running balance
        const previousBalance = acc.length > 0 
          ? acc[acc.length - 1].balance 
          : selectedAccount.balance;
        
        acc.push({
          ...t,
          debit,
          credit,
          balance: previousBalance + balanceChange,
        });
        
        return acc;
      }, [] as Array<Transaction & { debit: number; credit: number; balance: number }>);
  }, [selectedAccount, transactions, search]);

  if (isLoadingAccounts || isLoadingTransactions) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select 
                value={selectedAccountId || selectedAccount?.id} 
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {selectedAccount && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <p className="font-semibold">{selectedAccount.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code</p>
                  <p className="font-semibold font-mono">{selectedAccount.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold">{selectedAccount.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="font-semibold text-lg">MRU {selectedAccount.balance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No transactions found for this account
                    </TableCell>
                  </TableRow>
                ) : (
                  accountTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.reference || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.debit > 0 ? `MRU ${transaction.debit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction.credit > 0 ? `MRU ${transaction.credit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        MRU {transaction.balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
