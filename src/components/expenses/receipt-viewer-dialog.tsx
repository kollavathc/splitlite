'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getSignedReceiptUrl } from '@/lib/storage'
import { Loader2, X } from 'lucide-react'

interface ReceiptViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string | null
  expenseDescription?: string
}

export function ReceiptViewerDialog({ 
  open, 
  onOpenChange, 
  imageUrl, 
  expenseDescription 
}: ReceiptViewerDialogProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && imageUrl) {
      loadSignedUrl()
    } else {
      setSignedUrl(null)
      setError(null)
    }
  }, [open, imageUrl])

  const loadSignedUrl = async () => {
    if (!imageUrl) return

    setLoading(true)
    setError(null)

    try {
      const url = await getSignedReceiptUrl(imageUrl)
      setSignedUrl(url)
    } catch (err) {
      console.error('Error loading signed URL:', err)
      setError('Failed to load receipt image')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (signedUrl) {
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = `receipt-${expenseDescription || 'expense'}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            Receipt - {expenseDescription || 'Expense'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading receipt...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadSignedUrl} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : signedUrl ? (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg border">
                <img
                  src={signedUrl}
                  alt="Receipt"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button onClick={handleDownload} variant="outline">
                  Download
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">No receipt available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
