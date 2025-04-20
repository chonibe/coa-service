import type { InstagramMedia } from "@/types/instagram"

interface InstagramFeedProps {
  posts: InstagramMedia[]
}

export function InstagramFeed({ posts }: InstagramFeedProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <div key={post.id} className="relative aspect-square overflow-hidden rounded-md">
          {post.media_type === "IMAGE" && (
            <img src={post.media_url || "/placeholder.svg"} alt={post.caption} className="object-cover w-full h-full" />
          )}
          {post.media_type === "VIDEO" && (
            <video src={post.media_url} controls className="object-cover w-full h-full"></video>
          )}
          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
        </div>
      ))}
    </div>
  )
}
