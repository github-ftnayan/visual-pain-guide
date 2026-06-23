import { VideoMatch } from "@/types";

interface VideoPlayerProps {
  video: VideoMatch;
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const src = `https://www.youtube.com/embed/${video.youtube_id}?start=${video.start_time}&autoplay=1&modestbranding=1&rel=0&mute=1`;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={src}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="p-4">
        <p className="font-medium text-slate-100 text-sm">{video.title}</p>
        <p className="text-slate-400 text-xs mt-0.5">by {video.creator}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {video.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
