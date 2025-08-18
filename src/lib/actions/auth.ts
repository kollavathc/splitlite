'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function ensureUserAndGroup() {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Upsert user record using Prisma
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email!,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      updatedAt: new Date()
    },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      createdAt: new Date(user.created_at),
      updatedAt: new Date()
    }
  })

  // Check if user already has a membership to the default group
  const existingMembership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      group: {
        name: 'บ้านเรา'
      }
    }
  })

  if (!existingMembership) {
    // Create default group if it doesn't exist
    const defaultGroup = await prisma.group.upsert({
      where: { name: 'บ้านเรา' },
      update: {},
      create: {
        name: 'บ้านเรา',
        description: 'Default group for personal expenses',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create membership for the user
    await prisma.membership.create({
      data: {
        userId: user.id,
        groupId: defaultGroup.id,
        role: 'owner',
        createdAt: new Date()
      }
    })
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  
  if (!email) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the magic link!' }
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
