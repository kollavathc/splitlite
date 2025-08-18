import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalances, minimalTransfers } from '@/lib/server-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId } = params

    // Get balances for the group
    const balances = await getBalances(groupId)
    
    // Calculate minimal transfers
    const transfers = minimalTransfers(balances.map(b => ({
      userId: b.userId,
      name: b.name,
      net: b.net
    })))

    return NextResponse.json({
      balances,
      transfers
    })

  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
