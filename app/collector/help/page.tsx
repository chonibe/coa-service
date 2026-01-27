"use client"

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
    content: "Welcome to Street Collector! Start by exploring our marketplace to find artworks you love. Each purchase earns you credits that you can use to customize your InkOGatchi avatar or unlock exclusive perks.",
    category: "Getting Started",
  },
  {
    id: "2",
    title: "Understanding Credits and Rewards",
    content: "You earn 10 credits for every dollar you spend on artworks. Credits can be used to purchase avatar items for your InkOGatchi or saved for future perks. Complete series to earn bonus credits!",
    category: "Credits",
  },
  {
    id: "3",
    title: "Setting Up Your InkOGatchi Avatar",
    content: "Your InkOGatchi avatar evolves as you collect. Start as a Rookie Can and progress through Tagger, Artist, and Legend stages. Customize your avatar with items from the shop using credits.",
    category: "InkOGatchi",
  },
  {
    id: "4",
    title: "Authenticating Physical Artworks",
    content: "When you receive a physical artwork, use the NFC tag to authenticate it. Simply scan the tag with your device to verify ownership and unlock digital certificates. You'll earn 500 bonus credits for each authentication!",
    category: "Authentication",
  },
]

const faqs: FAQ[] = [
  {
    question: "What are credits?",
    answer: "Credits are rewards you earn for purchases and activities. You get 10 credits per dollar spent. Use them to customize your InkOGatchi avatar or unlock exclusive perks like free lamps and proof prints.",
    category: "Credits",
  },
  {
    question: "How do I authenticate physical artworks?",
    answer: "Physical artworks come with NFC tags. Use your device to scan the tag, which will verify your ownership and generate a digital certificate. Each authentication earns you 500 bonus credits!",
    category: "Authentication",
  },
  {
    question: "What happens when I complete a series?",
    answer: "When you collect all artworks in a series, you'll automatically receive 1,000 bonus credits! Series completion is tracked automatically, and you can view your progress in the Series Binder section of your dashboard.",
    category: "Series",
  },
  {
    question: "How do perks work?",
    answer: "Perks are exclusive rewards unlocked based on your total credits earned. For example, unlock a free lamp at 2,550 credits or a free proof print at 240 credits. Check your perks page to see what's available.",
    category: "Perks",
  },
  {
    question: "Can I share my collection?",
    answer: "Yes! You can share your collection with friends. Use the share feature on your profile page to generate a referral link. When friends sign up with your link, you both get bonus credits!",
    category: "Sharing",
  },
  {
    question: "How do I contact support?",
    answer: "You can contact support by emailing support@thestreetcollector.com. We typically respond within 24 hours during business days. You can also check this help center for answers to common questions.",
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
        description="Find answers to common questions and learn how to make the most of your collection"
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
              <CardDescription>Can't find what you're looking for? Contact our support team</CardDescription>
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
