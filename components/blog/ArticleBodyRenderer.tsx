import type {
  EditorialArticle,
  EditorialBlock,
  EditorialCitation,
  EditorialSection,
} from '@/content/editorial-blog'

interface ArticleBodyRendererProps {
  article: EditorialArticle
}

export function ArticleBodyRenderer({ article }: ArticleBodyRendererProps) {
  if (!article.body) return null

  return (
    <div className="editorial-prose prose prose-lg max-w-none
      prose-headings:font-heading prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-headings:text-[#171515]
      prose-p:text-[#171515]/75 prose-p:leading-8
      prose-strong:text-[#171515]
      prose-ul:text-[#171515]/75 prose-li:my-2 prose-li:leading-7
      prose-blockquote:border-l-[#8b3f25] prose-blockquote:bg-white prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:font-heading prose-blockquote:text-2xl prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:text-[#171515]"
    >
      {article.body.sections.map((section) => (
        <ArticleSectionView key={section.id} section={section} citations={article.citations} />
      ))}

      {article.citations.length > 0 && (
        <section className="mt-16 border-t border-[#171515]/12 pt-8">
          <h2 id="sources" className="font-heading text-3xl font-semibold tracking-[-0.02em] text-[#171515]">
            Sources and citations
          </h2>
          <ol className="mt-5 space-y-4 pl-5 text-sm leading-7 text-[#171515]/70">
            {article.citations.map((citation) => (
              <li key={citation.id} id={`citation-${citation.id}`}>
                <CitationView citation={citation} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

function ArticleSectionView({
  section,
  citations,
}: {
  section: EditorialSection
  citations: EditorialCitation[]
}) {
  return (
    <section className="mt-14 border-t border-[#171515]/12 pt-8 first:mt-0 first:border-t-0 first:pt-0">
      {section.title && (
        <h2 id={section.id} className="font-heading text-3xl font-semibold tracking-[-0.02em] text-[#171515]">
          {section.title}
        </h2>
      )}
      <div className="mt-5 space-y-6">
        {section.blocks.map((block, index) => (
          <BlockView key={`${section.id}-${index}`} block={block} citations={citations} />
        ))}
      </div>
    </section>
  )
}

function BlockView({
  block,
  citations,
}: {
  block: EditorialBlock
  citations: EditorialCitation[]
}) {
  switch (block.type) {
    case 'paragraph':
      return <p>{block.content}</p>
    case 'list':
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'quote':
      return (
        <blockquote>
          <p>{block.content}</p>
          {block.attribution && <footer className="mt-3 text-sm uppercase tracking-[0.14em] text-[#171515]/55">{block.attribution}</footer>}
        </blockquote>
      )
    case 'image':
      return (
        <figure className={block.layout === 'wide' ? 'mx-0 lg:-mx-8' : ''}>
          <div className="overflow-hidden bg-[#171515]/6">
            <img src={block.image.src} alt={block.image.alt} className="h-auto w-full object-cover" loading="lazy" />
          </div>
          {(block.image.caption || block.image.credit || block.image.citationIds?.length) && (
            <figcaption className="mt-3 text-sm leading-6 text-[#171515]/55">
              {block.image.caption && <span>{block.image.caption}</span>}
              {block.image.credit && <span>{block.image.caption ? ' ' : ''}Credit: {block.image.credit}.</span>}
            </figcaption>
          )}
        </figure>
      )
    case 'video':
      return (
        <figure className={block.layout === 'wide' ? 'mx-0 lg:-mx-8' : ''}>
          <div className="border border-[#171515]/12 bg-white p-6">
            <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.02em] text-[#171515]">
              {block.video.title}
            </h3>
            {block.video.description && (
              <p className="mt-3 text-base leading-7 text-[#171515]/68">{block.video.description}</p>
            )}
            <div className="mt-5">
              <a
                href={block.video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center border border-[#171515] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#171515] transition hover:bg-[#171515] hover:text-white"
              >
                Watch on {block.video.provider}
              </a>
            </div>
          </div>
          {block.video.caption && (
            <figcaption className="mt-3 text-sm leading-6 text-[#171515]/55">{block.video.caption}</figcaption>
          )}
        </figure>
      )
    default:
      return null
  }
}

function CitationView({ citation }: { citation: EditorialCitation }) {
  const label = citation.source ? `${citation.source}: ${citation.title}` : citation.title

  return citation.href ? (
    <a href={citation.href} target="_blank" rel="noopener noreferrer" className="text-[#8b3f25] no-underline hover:underline">
      {label}
    </a>
  ) : (
    <span>{label}</span>
  )
}
