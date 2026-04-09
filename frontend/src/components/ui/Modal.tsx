import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

export function Modal({
  open,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  children,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
            {children ? <div className="mt-3">{children}</div> : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button variant="primary" onClick={onConfirm}>
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
