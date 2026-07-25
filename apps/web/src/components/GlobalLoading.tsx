import { BrandLoader } from '#/components/brand/BrandLoader'

export function GlobalLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <BrandLoader />
    </div>
  )
}
