"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, HelpCircle, Mail, BookOpen, Video } from "lucide-react"
import { PageContainer, PageHeader } from "@/components/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button } from "@/components/ui"
import Link from "next/link"
import { getCollectorPageContent } from "@/lib/content/site-content"

const helpContent = getCollectorPageContent('help')

export default function CollectorHelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredArticles = helpContent.articles.filter((article) => {
    return (
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const filteredFAQs = helpContent.faqs.filter((faq) => {
    return (
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <PageContainer maxWidth="6xl" padding="lg">
      <PageHeader
        title={helpContent.hero.title}
        description={helpContent.hero.subtitle}
      />

      <div className="space-y-8 mt-8">
        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={helpContent.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Basics */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{helpContent.articlesTitle}</h2>
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
            <h2 className="text-2xl font-bold">{helpContent.faqTitle}</h2>
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
            <h2 className="text-2xl font-bold">{helpContent.videoTutorials.title}</h2>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{helpContent.videoTutorials.emptyState}</p>
              
            </CardContent>
          </Card>
        </section>

        {/* Contact Support */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>{helpContent.support.title}</CardTitle>
              <CardDescription>{helpContent.support.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild>
                  <Link href="mailto:support@thestreetcollector.com">
                    <Mail className="h-4 w-4 mr-2" />
                    {helpContent.support.primaryCta}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/collector/dashboard">
                    {helpContent.support.secondaryCta}
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
