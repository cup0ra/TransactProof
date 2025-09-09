'use client'

import Link from 'next/link'

interface EmptyStateProps {
  title?: string
  description?: string
  actionText?: string
  actionHref?: string
}

export function EmptyState({
  title = "No receipts yet",
  description = "You haven't generated any transaction receipts yet. Create your first one by entering a transaction hash.",
  actionText = "Generate Receipt",
  actionHref = "/generate"
}: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      {/* Icon */}
      <div className="mx-auto w-12 h-12 border border-orange-400 flex items-center justify-center mb-8">
        <div className="w-4 h-4 bg-orange-400"></div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8 text-sm font-light leading-relaxed transition-colors duration-300">
        {description}
      </p>

      {/* Action */}
      <Link href={actionHref} className="btn-primary-minimal text-xs">
        {actionText}
      </Link>
    </div>
  )
}