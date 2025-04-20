import type { InstagramStory } from "@/types/instagram"

interface InstagramStoriesProps {
  stories: InstagramStory[]
}

export function InstagramStories({ stories }: InstagramStoriesProps) {
  return (
    <div className="flex space-x-4 overflow-x-auto">
      {stories.map((story) => (
        <a
          key={story.id}
          href={story.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary"
        >
          <img
            src={story.media_url || "/placeholder.svg"}
            alt="Instagram Story"
            className="object-cover w-full h-full"
          />
        </a>
      ))}
    </div>
  )
}
