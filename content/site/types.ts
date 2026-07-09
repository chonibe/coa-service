export type CtaCopy = {
  label: string
  href?: string
}

export type HeroCopy = {
  title: string
  subtitle?: string
  eyebrow?: string
  cta?: CtaCopy
}

export type BannerCopy = {
  title: string
  body?: string
}

export type NoticeCopy = {
  title?: string
  body: string
}

export type FieldCopy = {
  label: string
  placeholder?: string
  hint?: string
}

export type FormMessageCopy = {
  successTitle?: string
  successBody?: string
  errorFallback?: string
  submitIdle?: string
  submitLoading?: string
}

export type FaqItem = {
  question: string
  answer: string
}

export type FaqGroup = {
  title: string
  items: FaqItem[]
}

export type ValueCardCopy = {
  title: string
  body: string
}

export type TestimonialQuote = {
  author: string
  content: string
  rating?: number
}
