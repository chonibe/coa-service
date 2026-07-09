/**
 * FAQ content for the shop FAQ page
 * Sourced from thestreetcollector.com
 */

export interface FAQGroup {
  title: string
  items: { question: string; answer: string }[]
}

export const shopFaqGroups: FAQGroup[] = [
  {
    title: 'Shipping & Delivery',
    items: [
      {
        question: 'Production Time',
        answer:
          'Please allow up to 7 business days for production. Orders are printed and assembled before dispatch. We do not mass-produce inventory. Every piece is prepared with care.',
      },
      {
        question: 'Delivery Time',
        answer:
          'Once shipped, delivery takes approximately 9–15 business days (Customs processing times not included). During high season, delivery may take slightly longer. All orders ship from our Shenzhen warehouse in China.',
      },
      {
        question: 'How Can I Track My Order?',
        answer:
          'As soon as your order is packed and dispatched, you will receive a shipment confirmation email including your tracking number and a direct tracking link. Please note that tracking updates may take a few days to appear after dispatch. You can also track your parcel anytime under My Account → My Orders or via our track your order page once you receive your tracking number.',
      },
      {
        question: 'Countries We Ship To',
        answer:
          'We currently ship to: North America (United States, Canada, Mexico), United Kingdom, Europe (Austria, Belgium, Denmark, Finland, France, Germany, Ireland, Italy, Luxembourg, Netherlands, Portugal, Spain, Sweden, Norway, Switzerland, Poland, Czech Republic, Slovakia, Hungary, Romania, Bulgaria, Croatia, Slovenia, Estonia, Latvia, Lithuania, Greece, Cyprus, Malta, Ukraine, Russia), Asia (Japan, South Korea, Hong Kong, Taiwan, Singapore, Malaysia, Thailand, Vietnam, India, Israel, United Arab Emirates), and Oceania (Australia, New Zealand). If your country is not shown at checkout, use the “Don\'t see your country?” link on the address step to email us your order details and we will try to arrange shipping.',
      },
      {
        question: 'Shopping From a Different Country',
        answer:
          'If you are browsing from a different country than your delivery destination, you can change your market selection at the top of the website under "International." Prices, delivery times, and charges may adjust depending on the selected destination.',
      },
      {
        question: 'Import Taxes & Customs Duties',
        answer:
          'Prices on thestreetcollector.com do not include local VAT, sales tax, or import duties. If your order exceeds your country\'s duty-free threshold, import taxes and customs duties may apply upon delivery. These charges are determined by your local customs authority and are the responsibility of the customer. We recommend contacting your local customs office for further details.',
      },
      {
        question: 'How Do I Pay Customs Fees?',
        answer:
          'If duties or taxes apply: 1) Your parcel will be held at customs. 2) The local carrier will contact you. 3) Payment must be completed before delivery.',
      },
      {
        question: 'Undeliverable Parcels',
        answer:
          'If delivery cannot be completed due to incorrect address, non-payment of customs fees, or failure to collect the parcel, it will be returned to The Street Collector. Reshipping fees may apply.',
      },
      {
        question: 'Bank Fees',
        answer:
          'Your bank may charge additional cross-border transaction fees. Street Collector does not compensate these charges. Please contact your bank for more information.',
      },
    ],
  },
  {
    title: 'About the Artworks',
    items: [
      {
        question: 'Does this artwork come with The Street Lamp?',
        answer:
          'No, artworks are sold separately. Choose the "Add Basic Collector Bundle" option above to get both the lamp and this artwork.',
      },
      {
        question: 'Can I buy prints without buying The Street Lamp?',
        answer:
          'Yes. Prints are sold separately from The Street Lamp and are made for its illuminated frame. If you already own the lamp, you can add more artworks anytime. If you are new to Street Collector, start with the Lamp + Artwork bundle.',
      },
      {
        question: 'What if the artwork sells out?',
        answer:
          'Each piece is a limited edition. Once all editions sell, this artwork will never be reprinted.',
      },
      {
        question: 'What material are the prints made from?',
        answer:
          'The prints are made from 1mm polycarbonate vinyl. It is light, durable, and lets the artwork hold the light well while still being easy to swap in and out.',
      },
      {
        question: 'What does "Limited Edition" mean?',
        answer:
          'Each artwork is released in a strictly limited quantity (typically 44 editions per design). Once all editions sell out, that artwork will never be reprinted. Your edition number (e.g., #12/44) is recorded on your Certificate of Authenticity.',
      },
      {
        question: 'How do I know which edition number I\'ll receive?',
        answer:
          'Edition numbers are assigned sequentially based on purchase order. You\'ll see your specific edition number on your Certificate of Authenticity after purchase.',
      },
      {
        question: 'How do I know this is authentic?',
        answer:
          'Every purchase includes a digital Certificate of Authenticity recorded on our permanent ledger and embedded in the NFC chip on the Artwork itself.',
      },
      {
        question: 'Can I resell my print later?',
        answer:
          'Yes. Each print comes with verified Certificate of Authenticity documentation recorded on our ledger, so you can pass it on with the provenance attached. Future value depends on the artist and the edition, so we do not make resale promises.',
      },
      {
        question: 'How do I change the artwork in my lamp?',
        answer:
          'Swapping artworks takes just seconds! Turn over the lamp with the little tabs facing a table top and press down on the lamp\'s bottom to release them, slide out the current print, insert your new artwork, and click the covers back into place.',
      },
      {
        question: 'Can I upload my art to customize a lamp?',
        answer:
          'We do not offer custom upload orders right now. If you are an artist, or know one, use the artist submission page or our open calls. That is how new work gets onto the lamp: through real collaborations, not one-off file uploads.',
      },
      {
        question: 'How much do artists earn from each sale?',
        answer:
          'Artists receive 25% of each artwork sale. The split is designed to pay artists more directly than the usual platform or gallery model.',
      },
    ],
  },
  {
    title: 'About the Street Lamp',
    items: [
      {
        question: 'Is the Street Lamp weatherproof or suitable for outdoor use?',
        answer:
          'No, the Street Lamp is designed for indoor use only. It is not weatherproof and should not be exposed to moisture or extreme weather conditions.',
      },
      {
        question: 'Can I mount the lamp on a wall?',
        answer:
          'Yes. You can hang it in landscape using the built-in magnets on one side of the cover. If you want a portrait setup, there is an optional wall-mount accessory that screws into the frame. It also sits comfortably on a desk or shelf.',
      },
      {
        question: 'How long does it take to fully charge the lamp?',
        answer:
          'It typically takes around 3-4 hours to fully charge the lamp\'s 2500mAh internal battery using the Type-C port or the included magnetic charging cable.',
      },
      {
        question: 'Can I leave the lamp charging?',
        answer:
          'Yes, the lamp is designed with built-in overcharge protection, so it is safe to leave it plugged in while charging. However, for optimal battery health, we recommend unplugging the lamp once it\'s fully charged.',
      },
      {
        question: 'Is the lamp compatible with universal charging cables?',
        answer:
          'Yes, the lamp uses a USB-C cable, which is a universal standard. You can use the included cable or any USB-C charging cable to charge the lamp.',
      },
      {
        question: 'How do I change the artwork in my lamp?',
        answer:
          'Swapping artworks takes just seconds! Turn over the lamp with the little tabs facing a table top and press down on the lamp\'s bottom to release them, slide out the current print, insert your new artwork, and click the covers back into place.',
      },
      {
        question: 'Customer support hours?',
        answer:
          'Our customer support is available Monday to Friday, 8am–8:30pm. Average answer time: 24h. Feel free to reach out via the chat if you have any further questions.',
      },
    ],
  },
]
