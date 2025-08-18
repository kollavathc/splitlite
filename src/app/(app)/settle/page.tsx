'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";

interface MemberBalance {
  userId: string;
  name: string;
  email: string;
  paid: number;
  owed: number;
  net: number;
}

interface Transfer {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

interface Group {
  id: string;
  name: string;
  memberships: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export default function SettlePage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
          setGroups(data.groups);
          
          if (data.groups.length > 0) {
            setSelectedGroupId(data.groups[0].id);
            await loadBalances(data.groups[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadBalances = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/balances`);
      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances);
        setTransfers(data.transfers);
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const handleGroupChange = async (groupId: string) => {
    setSelectedGroupId(groupId);
    await loadBalances(groupId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settle Up</h1>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const userBalance = balances.find(b => b.userId === currentUser?.id)?.net || 0;
  const totalOwed = balances.filter(b => b.net > 0).reduce((sum, b) => sum + b.net, 0);
  const totalOwe = balances.filter(b => b.net < 0).reduce((sum, b) => sum + Math.abs(b.net), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settle Up</h1>
        <p className="text-gray-600 mt-2">Manage and track your settlements</p>
      </div>

      {/* Group Selection */}
      {groups.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {groups.map((group) => (
                <Button
                  key={group.id}
                  variant={selectedGroupId === group.id ? "default" : "outline"}
                  onClick={() => handleGroupChange(group.id)}
                >
                  {group.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
                             <CardTitle>You&apos;re Owed</CardTitle>
            <CardDescription>Money others owe you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-4">฿{totalOwed.toFixed(2)}</div>
            <div className="space-y-2">
              {balances.filter(b => b.net > 0).map((balance, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">{balance.name}</span>
                  <span className="text-green-600 font-bold">฿{balance.net.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>You Owe</CardTitle>
            <CardDescription>Money you owe others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-4">฿{totalOwe.toFixed(2)}</div>
            <div className="space-y-2">
              {balances.filter(b => b.net < 0).map((balance, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-medium">{balance.name}</span>
                  <span className="text-red-600 font-bold">฿{Math.abs(balance.net).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Suggestions */}
      {transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Suggestions</CardTitle>
            <CardDescription>Minimal transfers to settle all balances</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount (THB)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{transfer.fromName}</TableCell>
                    <TableCell>{transfer.toName}</TableCell>
                    <TableCell className="font-bold">฿{transfer.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Mark as Paid
                        </Button>
                        <Button size="sm" variant="ghost">
                          Remind
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common settlement actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center space-y-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>Request Payment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mark as Paid</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Schedule Payment</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>Recent settlement activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount (THB)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John</TableCell>
                <TableCell>You</TableCell>
                <TableCell>฿32.50</TableCell>
                <TableCell>Movie Tickets</TableCell>
                <TableCell>2024-01-14</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Pending
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">Accept</Button>
                    <Button size="sm" variant="ghost">Remind</Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">You</TableCell>
                <TableCell>Sarah</TableCell>
                <TableCell>฿15.25</TableCell>
                <TableCell>Gas Station</TableCell>
                <TableCell>2024-01-13</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Pending
                  </span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">Pay</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Mike</TableCell>
                <TableCell>You</TableCell>
                <TableCell>฿8.75</TableCell>
                <TableCell>Coffee Shop</TableCell>
                <TableCell>2024-01-11</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">View</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
