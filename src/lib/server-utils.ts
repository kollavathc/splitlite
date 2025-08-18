import { prisma } from './prisma'

export interface MemberBalance {
  userId: string
  name: string
  email: string
  paid: number
  owed: number
  net: number
}

export interface Transfer {
  from: string
  to: string
  amount: number
  fromName: string
  toName: string
}

export async function getBalances(groupId: string): Promise<MemberBalance[]> {
  // Get all expenses for the group with splits
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: true,
      splits: {
        include: {
          user: true
        }
      }
    }
  })

  // Get all group members
  const memberships = await prisma.membership.findMany({
    where: { groupId },
    include: {
      user: true
    }
  })

  const memberBalances = new Map<string, MemberBalance>()

  // Initialize balances for all members
  memberships.forEach(membership => {
    memberBalances.set(membership.user.id, {
      userId: membership.user.id,
      name: membership.user.name || membership.user.email,
      email: membership.user.email,
      paid: 0,
      owed: 0,
      net: 0
    })
  })

  // Calculate paid and owed amounts
  expenses.forEach(expense => {
    const paidBy = memberBalances.get(expense.paidById)
    if (paidBy) {
      paidBy.paid += Number(expense.amount)
    }

    expense.splits.forEach(split => {
      const member = memberBalances.get(split.userId)
      if (member) {
        member.owed += Number(split.amount)
      }
    })
  })

  // Calculate net amounts
  memberBalances.forEach(member => {
    member.net = member.paid - member.owed
  })

  return Array.from(memberBalances.values())
}

export function minimalTransfers(nets: { userId: string; name: string; net: number }[]): Transfer[] {
  const transfers: Transfer[] = []
  const balances = [...nets].map(net => ({ ...net, net: Math.round(net.net * 100) / 100 }))
  
  // Separate debtors (negative net) and creditors (positive net)
  const debtors = balances.filter(b => b.net < 0).sort((a, b) => a.net - b.net)
  const creditors = balances.filter(b => b.net > 0).sort((a, b) => b.net - a.net)
  
  let debtorIndex = 0
  let creditorIndex = 0
  
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    
    if (Math.abs(debtor.net) < 0.01 || creditor.net < 0.01) {
      if (Math.abs(debtor.net) < 0.01) debtorIndex++
      if (creditor.net < 0.01) creditorIndex++
      continue
    }
    
    const transferAmount = Math.min(Math.abs(debtor.net), creditor.net)
    
    transfers.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: transferAmount,
      fromName: debtor.name,
      toName: creditor.name
    })
    
    debtor.net += transferAmount
    creditor.net -= transferAmount
    
    if (Math.abs(debtor.net) < 0.01) debtorIndex++
    if (creditor.net < 0.01) creditorIndex++
  }
  
  return transfers
}
