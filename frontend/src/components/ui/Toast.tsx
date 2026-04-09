import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ToastProps {
  open: boolean
  message: string
  duration?: number
  onClose: () => void
}

export function Toast({ open, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return

    const timer = window.setTimeout(() => {
      onClose()
    }, duration)

    return () => {
      window.clearTimeout(timer)
    }
  }, [open, duration, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-green-200 bg-white px-4 py-3 shadow-lg"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden="true" />
          <p className="text-sm text-gray-700">{message}</p>
          <button
            type="button"
            className="ml-auto rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
