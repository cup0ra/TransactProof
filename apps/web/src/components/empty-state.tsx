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
        <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3,3V21H21V3H3M5,5H19V19H5V5M7,7V9H17V7H7M7,11V13H17V11H7M7,15V17H14V15H7Z" />
        </svg>
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