'use client'

import dynamic from 'next/dynamic'

const CheckoutBrick = dynamic(() => import('@/components/CheckoutBrick'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary rounded-full animate-spin" />
    </div>
  ),
})

type Props = {
  productId:    string
  productTitle: string
  price:        number
}

export default function CheckoutWrapper(props: Props) {
  return <CheckoutBrick {...props} />
}
