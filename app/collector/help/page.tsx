"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, HelpCircle, Mail, BookOpen, Video } from "lucide-react"
import { PageContainer, PageHeader } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button } from "@/components/ui"
import Link from "next/link"

interface FAQ {
  question: string
  answer: string
  category: string
}

const helpArticles = [
  {
    id: "1",
    title: "Getting Started with Your Collector Account",
    content: "Start by browsing the collection and saving or buying the pieces you want to keep track of. Purchases add credits to your account, which you can use for InkOGatchi items and collector perks.",
    category: "Getting Started",
  },
  {
    id: "2",
    title: "Understanding Credits and Rewards",
    content: "You earn 10 credits for every dollar spent on artworks. Keep them for InkOGatchi items, use them on perks, or build them up by completing a full series.",
    category: "Credits",
  },
  {
    id: "3",
    title: "Setting Up Your InkOGatchi Avatar",
    content: "Your InkOGatchi changes as your collection grows. You start small, move through the stages over time, and can customize the avatar with items bought using credits.",
    category: "InkOGatchi",
  },
  {
    id: "4",
    title: "Authenticating Physical Artworks",
    content: "When a physical artwork arrives, scan the NFC tag with your device to verify ownership and unlock its digital certificate. Each completed authentication adds 500 bonus credits to your account.",
    category: "Authentication",
  },
]

const faqs: FAQ[] = [
  {
    question: "What are credits?",
    answer: "Credits are the rewards tied to your account activity. You earn 10 per dollar spent, then use them on InkOGatchi items or collector perks such as proof prints and lamps.",
    category: "Credits",
  },
  {
    question: "How do I authenticate physical artworks?",
    answer: "Physical artworks come with NFC tags. Scan the tag with your device to verify ownership and generate the digital certificate. Each authentication also adds 500 bonus credits.",
    category: "Authentication",
  },
  {
    question: "What happens when I complete a series?",
    answer: "Once you collect every artwork in a series, the account adds a 1,000-credit bonus automatically. You can track progress in the Series Binder on your dashboard.",
    category: "Series",
  },
  {
    question: "How do perks work?",
    answer: "Perks unlock as your credit total grows. For example, certain thresholds can open rewards like a free proof print or a lamp. Your perks page shows what is currently available to claim.",
    category: "Perks",
  },
  {
    question: "Can I share my collection?",
    answer: "Yes. Use the share option on your profile to generate a referral link. If someone signs up through it, both of you receive bonus credits.",
    category: "Sharing",
  },
  {
    question: "How do I contact support?",
    answer: "Email support@thestreetcollector.com and we will usually get back to you within one business day. For quicker answers, it is also worth checking this help center first.",
    category: "Support",
  },
]

export default function CollectorHelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredArticles = helpArticles.filter((article) => {
    return (
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const filteredFAQs = faqs.filter((faq) => {
    return (
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <PageContainer maxWidth="6xl" padding="lg">
      <PageHeader
        title="Help Center"
        description="Answers to common collector questions, account help, and support details"
      />

      <div className="space-y-8 mt-8">
        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="What can we help you with?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Getting Started Guide */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Getting Started Guide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription>{article.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{article.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Video Tutorials (Placeholder) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Video Tutorials</h2>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Video tutorials coming soon!</p>
              
            </CardContent>
          </Card>
        </section>

        {/* Contact Support */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Still Need Help?</CardTitle>
              <CardDescription>If the answer is not here, send us a note and we will point you in the right direction.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild>
                  <Link href="mailto:support@thestreetcollector.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/collector/dashboard">
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageContainer>
  )
}
