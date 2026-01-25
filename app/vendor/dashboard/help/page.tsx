"use client"

import { useState } from "react"



import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, HelpCircle, Mail, BookOpen, Video, Keyboard, MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/vendor/empty-state"
import { SidebarLayout } from "../../components/sidebar-layout"


import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button, Badge } from "@/components/ui"
interface HelpArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

interface FAQ {
  question: string
  answer: string
  category: string
}

const helpArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Getting Started with Your Vendor Account",
    content: "Welcome to the Vendor Portal! This guide will help you set up your account and start selling. First, complete your profile in Settings, then add your products. Once your products are approved, they'll be live on the marketplace.",
    category: "Getting Started",
    tags: ["onboarding", "profile", "setup"],
  },
  {
    id: "2",
    title: "How to Add Products",
    content: "Navigate to Products > Add New Product. Fill in all required fields including title, description, price, and images. Make sure to set your payout preferences. Products will be reviewed before going live.",
    category: "Products",
    tags: ["products", "add", "upload"],
  },
  {
    id: "3",
    title: "Understanding Your Analytics",
    content: "The Analytics page shows your sales performance over time. Use the time range selector to view different periods. Export your data to CSV for detailed analysis. Track your best-performing products and identify trends.",
    category: "Analytics",
    tags: ["analytics", "sales", "reports"],
  },
  {
    id: "4",
    title: "Managing Payouts",
    content: "Payouts are processed according to your payout settings. You can view pending and completed payouts in the Payouts section. Make sure your payment information is up to date in Settings.",
    category: "Payouts",
    tags: ["payouts", "payment", "money"],
  },
  {
    id: "5",
    title: "Setting Up Benefits",
    content: "Benefits are additional perks you can offer to customers. Navigate to Benefits to create digital content, exclusive access, discounts, and more. Benefits can be linked to specific products.",
    category: "Benefits",
    tags: ["benefits", "perks", "rewards"],
  },
]

const faqs: FAQ[] = [
  {
    question: "How do I get paid?",
    answer: "Payouts are processed automatically based on your payout settings. You can configure percentage or flat-rate payouts per product in the product settings. Payments are typically processed monthly.",
    category: "Payouts",
  },
  {
    question: "How long does product approval take?",
    answer: "Product approval typically takes 1-3 business days. You'll receive a notification once your product is reviewed and approved or if any changes are needed.",
    category: "Products",
  },
  {
    question: "Can I edit my products after they're live?",
    answer: "Yes, you can edit your products at any time. Navigate to Products, select the product you want to edit, and make your changes. Some changes may require re-approval.",
    category: "Products",
  },
  {
    question: "How do I contact support?",
    answer: "You can contact support through the Messages section or by emailing support@thestreetlamp.com. We typically respond within 24 hours during business days.",
    category: "Support",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We support PayPal and bank transfers. Configure your payment preferences in Settings > Payment. Make sure your information is accurate to avoid payment delays.",
    category: "Payouts",
  },
  {
    question: "How do I track my sales?",
    answer: "Use the Dashboard and Analytics pages to track your sales. The Dashboard shows key metrics, while Analytics provides detailed charts and trends. You can export data for external analysis.",
    category: "Analytics",
  },
]

const keyboardShortcuts = [
  { key: "g + d", description: "Go to Dashboard" },
  { key: "g + p", description: "Go to Products" },
  { key: "g + a", description: "Go to Analytics" },
  { key: "g + y", description: "Go to Payouts" },
  { key: "g + b", description: "Go to Benefits" },
  { key: "g + m", description: "Go to Messages" },
  { key: "g + s", description: "Go to Settings" },
  { key: "/", description: "Focus search" },
  { key: "?", description: "Show keyboard shortcuts" },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set([...helpArticles.map((a) => a.category), ...faqs.map((f) => f.category)]))

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <div>
          <p className="text-muted-foreground text-lg">Need help? We're here for you - find answers and learn how everything works</p>
        </div>

        {/* Search */}
        <Card className="border shadow-sm">
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
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:bg-accent transition-colors border shadow-sm">
            <CardHeader>
              <Mail className="h-8 w-8 mb-2" />
              <CardTitle className="text-lg">Contact Support</CardTitle>
              <CardDescription>Reach out to us - we're here to help</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border shadow-sm" 
                asChild
              >
                <a href="/vendor/dashboard/messages">Send Message</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors border shadow-sm">
            <CardHeader>
              <BookOpen className="h-8 w-8 mb-2" />
              <CardTitle className="text-lg">Documentation</CardTitle>
              <CardDescription>Step-by-step guides to help you succeed</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border shadow-sm" 
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors border shadow-sm">
            <CardHeader>
              <Video className="h-8 w-8 mb-2" />
              <CardTitle className="text-lg">Video Tutorials</CardTitle>
              <CardDescription>Learn by watching - we'll walk you through it</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full border shadow-sm" 
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors border shadow-sm">
            <CardHeader>
              <Keyboard className="h-8 w-8 mb-2" />
              <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
              <CardDescription>Work faster with these time-saving shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => {
                const shortcutsSection = document.getElementById("keyboard-shortcuts")
                shortcutsSection?.scrollIntoView({ behavior: "smooth" })
              }}>
                View Shortcuts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Articles */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Help Articles</CardTitle>
            <CardDescription>Everything you need to know, step by step</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredArticles.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="No articles found"
                description="Try adjusting your search or category filter"
              />
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="border shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          <CardDescription>{article.category}</CardDescription>
                        </div>
                        <Badge variant="outline">{article.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{article.content}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to the questions we hear most often</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFAQs.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="No FAQs found"
                description="Try adjusting your search or category filter"
              />
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card id="keyboard-shortcuts" className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </div>
            <CardDescription>Work faster and smarter with these shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}

