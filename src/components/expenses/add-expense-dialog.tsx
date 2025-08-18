'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadReceipt } from '@/lib/storage'
import { toast } from 'sonner'

interface Member {
  id: string
  name: string
  email: string
}

interface Group {
  id: string
  name: string
  memberships: {
    user: Member
  }[]
}

interface CustomSplit {
  userId: string
  name: string
  amount: number
}

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal')
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Load user and groups on mount
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.user)
          setGroups(data.groups)
          if (data.groups.length > 0) {
            setSelectedGroupId(data.groups[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [])

  // Update custom splits when group or amount changes
  useEffect(() => {
    if (selectedGroupId && amount && splitMethod === 'custom') {
      const selectedGroup = groups.find(g => g.id === selectedGroupId)
      if (selectedGroup) {
        const totalAmount = parseFloat(amount) || 0
        const memberCount = selectedGroup.memberships.length
        const equalAmount = memberCount > 0 ? totalAmount / memberCount : 0
        
        const newSplits = selectedGroup.memberships.map(membership => ({
          userId: membership.user.id,
          name: membership.user.name || membership.user.email,
          amount: equalAmount
        }))
        
        setCustomSplits(newSplits)
      }
    }
  }, [selectedGroupId, amount, splitMethod, groups])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description || !amount || !selectedGroupId) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    if (splitMethod === 'custom') {
      const totalSplit = customSplits.reduce((sum, split) => sum + split.amount, 0)
      const totalAmount = parseFloat(amount)
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        toast.error('Custom splits must equal total amount')
        return
      }
    }

    setLoading(true)

    try {
      let imageUrl: string | undefined

      // Upload file if selected
      if (selectedFile) {
        try {
          imageUrl = await uploadReceipt(selectedFile)
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError)
          toast.error('Failed to upload receipt image')
          setLoading(false)
          return
        }
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          date: date || new Date().toISOString(),
          groupId: selectedGroupId,
          splitMethod,
          customSplits: splitMethod === 'custom' ? customSplits : undefined,
          imageUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Expense added successfully!')
        setOpen(false)
        // Reset form
        setDescription('')
        setAmount('')
        setDate('')
        setSplitMethod('equal')
        setCustomSplits([])
        setSelectedFile(null)
        // Refresh the page to show new expense
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to add expense')
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const updateCustomSplit = (userId: string, newAmount: number) => {
    setCustomSplits(prev => 
      prev.map(split => 
        split.userId === userId 
          ? { ...split, amount: newAmount }
          : split
      )
    )
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Add a new expense and split it among group members.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              required
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Group Selection */}
          <div className="space-y-2">
            <Label htmlFor="group">Group *</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Receipt Upload */}
          <FileUpload
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />

          {/* Split Method */}
          <div className="space-y-2">
            <Label htmlFor="splitMethod">Split Method</Label>
            <Select value={splitMethod} onValueChange={(value: 'equal' | 'custom') => setSplitMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Equal Split</SelectItem>
                <SelectItem value="custom">Custom Split</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Splits */}
          {splitMethod === 'custom' && selectedGroup && (
            <div className="space-y-4">
              <Label>Custom Split Amounts</Label>
              <div className="space-y-3">
                {customSplits.map((split) => (
                  <div key={split.userId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{split.name}</Label>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.amount}
                        onChange={(e) => updateCustomSplit(split.userId, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">
                    ${customSplits.reduce((sum, split) => sum + split.amount, 0).toFixed(2)}
                  </span>
                </div>
                {Math.abs(customSplits.reduce((sum, split) => sum + split.amount, 0) - (parseFloat(amount) || 0)) > 0.01 && (
                  <p className="text-sm text-red-600">
                    Split total must equal expense amount
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Equal Split Preview */}
          {splitMethod === 'equal' && selectedGroup && amount && (
            <div className="space-y-2">
              <Label>Equal Split Preview</Label>
              <div className="text-sm text-gray-600">
                {selectedGroup.memberships.map((membership, index) => {
                  const totalAmount = parseFloat(amount) || 0
                  const memberCount = selectedGroup.memberships.length
                  const equalAmount = memberCount > 0 ? totalAmount / memberCount : 0
                  const isFirst = index === 0
                  const remainder = totalAmount - (equalAmount * memberCount)
                  const finalAmount = isFirst ? equalAmount + remainder : equalAmount
                  
                  return (
                    <div key={membership.user.id} className="flex justify-between">
                      <span>{membership.user.name || membership.user.email}</span>
                      <span>${finalAmount.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
