'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { motion } from 'framer-motion'
import { ReceiptCard } from '@/components/receipt-card'

// Import Swiper styles only when this component is used
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import '@/styles/swiper-custom.css'

interface Receipt {
  id: string
  txHash: string
  sender: string
  receiver: string
  amount: string
  token: string
  chainId: number
  pdfUrl: string
  description?: string
  createdAt: string
}

interface ReceiptsSwiperProps {
  receipts: Receipt[]
  itemsPerSlide: number
}

export function ReceiptsSwiper({ receipts, itemsPerSlide }: ReceiptsSwiperProps) {
  return (
    <div className="">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={24}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{
          el: '.swiper-pagination',
          clickable: true,
        }}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 16,
          },
          640: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 1,
            spaceBetween: 24,
          },
          1024: {
            slidesPerView: 1,
            spaceBetween: 24,
          },
          1280: {
            slidesPerView: 1,
            spaceBetween: 24,
          },
        }}
        className="receipts-swiper-grid"
      >
        {Array.from({ length: Math.ceil(receipts.length / itemsPerSlide) }, (_, pageIndex) => (
          <SwiperSlide key={pageIndex}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 2xl:grid-rows-2 lg:h-auto">
              {receipts.slice(pageIndex * itemsPerSlide, (pageIndex + 1) * itemsPerSlide).map((receipt, index) => (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 1 + (pageIndex * itemsPerSlide + index) * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                >
                  <ReceiptCard receipt={receipt} />
                </motion.div>
              ))}
            </div>
          </SwiperSlide>
        ))}            
        {/* Custom Pagination */}
        <div className="swiper-pagination"></div>
      </Swiper>
    </div>
  )
}
