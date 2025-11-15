import { useState } from "react";
import { Plus, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockAccounts } from "@/data/mockAccounts";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  lines: {
    account: string;
    debit: number;
    credit: number;
  }[];
  status: 'draft' | 'posted';
}

export default function JournalEntries() {
  const [open, setOpen] = useState(false);
  const [entries] = useState<JournalEntry[]>([
    {
      id: 'JE-001',
      date: new Date('2024-11-05'),
      reference: 'JE-001',
      description: 'Monthly depreciation expense',
      lines: [
        { account: 'Depreciation', debit: 5000, credit: 0 },
        { account: 'Accumulated Depreciation', debit: 0, credit: 5000 },
      ],
      status: 'posted',
    },
    {
      id: 'JE-002',
      date: new Date('2024-11-03'),
      reference: 'JE-002',
      description: 'Accrued expenses adjustment',
      lines: [
        { account: 'Accrued Expenses', debit: 2500, credit: 0 },
        { account: 'Utilities', debit: 0, credit: 2500 },
      ],
      status: 'posted',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Journal Entries</h2>
          <p className="text-muted-foreground">Record manual accounting entries</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input placeholder="JE-XXX" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Enter description..." />
              </div>
              <div className="space-y-2">
                <Label>Journal Lines</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6">
                      <Label className="text-xs">Account</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Debit</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Credit</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpen(false)}>Save Entry</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debits</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
                  return (
                    <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(entry.date, 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{entry.reference}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        MRU {totalDebit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        MRU {totalCredit.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
