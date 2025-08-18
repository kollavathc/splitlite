import { prisma } from './prisma'
import { createClient } from './supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  return await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        include: {
          group: true
        }
      }
    }
  })
}

export async function getUserGroups(userId: string) {
  return await prisma.group.findMany({
    where: {
      memberships: {
        some: {
          userId
        }
      }
    },
    include: {
      memberships: {
        include: {
          user: true
        }
      },
      expenses: {
        include: {
          paidBy: true,
          splits: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })
}

export async function getGroupExpenses(groupId: string) {
  return await prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: true,
      splits: {
        include: {
          user: true
        }
      },
      group: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getUserBalances(userId: string) {
  // Get all expenses where user is involved
  const expenses = await prisma.expense.findMany({
    where: {
      OR: [
        { paidById: userId },
        {
          splits: {
            some: {
              userId
            }
          }
        }
      ]
    },
    include: {
      paidBy: true,
      splits: {
        include: {
          user: true
        }
      }
    }
  })

  // Calculate balances
  let totalPaid = 0
  let totalOwed = 0

  for (const expense of expenses) {
    if (expense.paidById === userId) {
      totalPaid += Number(expense.amount)
    }
    
    const userSplit = expense.splits.find(split => split.userId === userId)
    if (userSplit) {
      totalOwed += Number(userSplit.amount)
    }
  }

  return {
    totalPaid,
    totalOwed,
    balance: totalPaid - totalOwed
  }
}
