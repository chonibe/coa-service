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
          'As soon as your order is packed and dispatched, you will receive a shipment confirmation email including your tracking number and a direct tracking link. Please note that tracking updates may take a few days to appear after dispatch. You can also track your parcel anytime under My Account → My Orders or via our Track Your Order page once you receive your tracking number.',
      },
      {
        question: 'Countries We Ship To',
        answer:
          'We currently ship to: North America (United States, Canada, Mexico), United Kingdom, Europe (Austria, Belgium, Denmark, Finland, France, Germany, Ireland, Italy, Luxembourg, Netherlands, Portugal, Spain, Sweden, Norway, Switzerland, Poland, Czech Republic, Slovakia, Hungary, Romania, Bulgaria, Croatia, Slovenia, Estonia, Latvia, Lithuania, Greece, Cyprus, Malta, Ukraine, Russia), Asia (Japan, South Korea, Hong Kong, Taiwan, Singapore, Malaysia, Thailand, Vietnam, Israel, United Arab Emirates), and Oceania (Australia, New Zealand).',
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
          'Yes! Prints are sold separately from The Street Lamp. However, they are specifically designed to be displayed on The Street Lamp\'s illuminated frame. If you already own The Street Lamp, you can purchase additional artworks to build your collection. If you\'re new to Street Collector, we recommend our bundle option (Lamp + Artwork) for the complete experience.',
      },
      {
        question: 'What if the artwork sells out?',
        answer:
          'Each piece is a limited edition. Once all editions sell, this artwork will never be reprinted.',
      },
      {
        question: 'What material are the prints made from?',
        answer:
          'Our prints are crafted on premium 1mm polycarbonate vinyl using state-of-the-art high-definition printing technology. This durable, lightweight material allows the artwork to beautifully illuminate when displayed on The Street Lamp while remaining easy to handle and swap.',
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
          'Yes! Because each print comes with a verified Certificate of Authenticity recorded on our ledger, you can resell it with full provenance documentation. Limited edition prints often appreciate in value, especially as artists gain recognition.',
      },
      {
        question: 'How do I change the artwork in my lamp?',
        answer:
          'Swapping artworks takes just seconds! Turn over the lamp with the little tabs facing a table top and press down on the lamp\'s bottom to release them, slide out the current print, insert your new artwork, and click the covers back into place.',
      },
      {
        question: 'Can I upload my art to customize a lamp?',
        answer:
          'While we don\'t offer custom artwork options, we love collaborating with new and emerging artists. If you\'re an artist—or know one—interested in being part of our journey, we invite you to leave your details through our artist submission page or participate in our open calls and competitions. It\'s an incredible opportunity to be featured on our lamps and connect with art lovers everywhere. The Street Lamp is more than a marketplace; it\'s a bridge between the artist, the art, and the collector.',
      },
      {
        question: 'How much do artists earn from each sale?',
        answer:
          'Artists receive 25% of every artwork sale—significantly higher than most platforms (10-15%) and traditional galleries. Your purchase directly supports independent street artists worldwide.',
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
          'The Street Lamp is designed to adapt to your space. Magnetic Landscape Mounting: Built-in magnets on one side of the lamp\'s cover allow you to effortlessly hang it in a horizontal, landscape orientation. Portrait Wall Mount Accessory: For a vertical display, the optional Wall Mount Accessory securely screws into the lamp\'s frame, enabling a portrait orientation. With these mounting options, The Street Lamp ensures your art fits perfectly into your space—whether it\'s on a desk, a wall, or a shelf.',
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
