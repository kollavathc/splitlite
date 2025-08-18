'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { useEffect, useState } from "react";
import { getReceiptUrl } from "@/lib/storage";
import { Image, Eye } from "lucide-react";
import { ReceiptViewerDialog } from "@/components/expenses/receipt-viewer-dialog";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ imageUrl: string; description: string } | null>(null);

  useEffect(() => {
    async function loadExpenses() {
      try {
        // For now, we'll use mock data until we have the API endpoint
        const mockExpenses = [
          {
            id: 1,
            description: "Dinner at Italian Restaurant",
            amount: 45.67,
            date: "2024-01-15",
            group: "Weekend Trip",
            paidBy: "You",
            status: "Settled",
            imageUrl: null
          },
          {
            id: 2,
            description: "Movie Tickets",
            amount: 32.50,
            date: "2024-01-14",
            group: "Movie Night",
            paidBy: "John",
            status: "Pending",
            imageUrl: "https://example.com/receipt1.jpg"
          },
          {
            id: 3,
            description: "Gas Station",
            amount: 28.75,
            date: "2024-01-13",
            group: "Road Trip",
            paidBy: "Sarah",
            status: "Settled",
            imageUrl: null
          },
          {
            id: 4,
            description: "Grocery Shopping",
            amount: 67.89,
            date: "2024-01-12",
            group: "Household",
            paidBy: "You",
            status: "Pending",
            imageUrl: "https://example.com/receipt2.jpg"
          },
          {
            id: 5,
            description: "Coffee Shop",
            amount: 12.30,
            date: "2024-01-11",
            group: "Work",
            paidBy: "Mike",
            status: "Settled",
            imageUrl: null
          }
        ];
        setExpenses(mockExpenses);
      } catch (error) {
        console.error('Error loading expenses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-2">Track and manage your shared expenses</p>
        </div>
        <AddExpenseDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$186.11</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">$100.19</div>
            <p className="text-xs text-muted-foreground">2 expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$85.92</div>
            <p className="text-xs text-muted-foreground">3 expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>A list of your recent expenses and their settlement status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {expense.imageUrl ? (
                      <div className="flex items-center space-x-2">
                        <div className="relative group">
                          <img
                            src={getReceiptUrl(expense.imageUrl)}
                            alt="Receipt"
                            className="w-12 h-12 object-cover rounded border"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReceipt({
                              imageUrl: expense.imageUrl,
                              description: expense.description
                            });
                            setReceiptViewerOpen(true);
                          }}
                        >
                          View Receipt
                        </Button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                        <Image className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>฿{expense.amount.toFixed(2)}</TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>{expense.group}</TableCell>
                  <TableCell>{expense.paidBy}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.status === 'Settled' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {expense.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receipt Viewer Dialog */}
      <ReceiptViewerDialog
        open={receiptViewerOpen}
        onOpenChange={setReceiptViewerOpen}
        imageUrl={selectedReceipt?.imageUrl || null}
        expenseDescription={selectedReceipt?.description}
      />
    </div>
  );
}

