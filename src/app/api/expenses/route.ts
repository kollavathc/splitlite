import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { uploadReceipt } from '@/lib/storage'

function equalSplit(total: number, memberCount: number): number[] {
  const baseAmount = Math.floor(total * 100 / memberCount) / 100
  const remainder = Math.round((total - baseAmount * memberCount) * 100) / 100
  
  const splits = new Array(memberCount).fill(baseAmount)
  if (remainder > 0) {
    splits[0] += remainder
  }
  
  return splits
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, date, groupId, splitMethod, customSplits, imageUrl } = body

    // Validate required fields
    if (!description || !amount || !groupId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get group members
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          include: {
            user: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const members = group.memberships.map(m => m.user)
    const memberCount = members.length

    if (memberCount === 0) {
      return NextResponse.json({ error: 'No members in group' }, { status: 400 })
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        imageUrl: imageUrl || null,
        groupId,
        paidById: user.id,
        createdAt: date ? new Date(date) : new Date(),
        updatedAt: new Date()
      }
    })

    // Create splits
    let splits: { userId: string; amount: number }[] = []

    if (splitMethod === 'equal') {
      const equalAmounts = equalSplit(parseFloat(amount), memberCount)
      splits = members.map((member, index) => ({
        userId: member.id,
        amount: equalAmounts[index]
      }))
    } else if (splitMethod === 'custom' && customSplits) {
      // Validate custom splits sum equals total
      const totalSplit = customSplits.reduce((sum: number, split: any) => sum + parseFloat(split.amount), 0)
      if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
        return NextResponse.json({ error: 'Custom splits must equal total amount' }, { status: 400 })
      }
      splits = customSplits.map((split: any) => ({
        userId: split.userId,
        amount: parseFloat(split.amount)
      }))
    }

    // Create all splits
    await prisma.split.createMany({
      data: splits.map(split => ({
        expenseId: expense.id,
        userId: split.userId,
        amount: split.amount,
        createdAt: new Date()
      }))
    })

    return NextResponse.json({ 
      success: true, 
      expense: {
        ...expense,
        splits
      }
    })

  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
